import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import url from 'node:url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const backendRoot = path.resolve(__dirname, '..')
const srcRoot = path.join(backendRoot, 'src')

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile()
  } catch {
    return false
  }
}

function dirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory()
  } catch {
    return false
  }
}

function resolveModule(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null

  const base = path.resolve(path.dirname(fromFile), specifier)

  if (fileExists(base)) return base
  if (fileExists(`${base}.ts`)) return `${base}.ts`
  if (fileExists(`${base}.tsx`)) return `${base}.tsx`
  if (fileExists(`${base}.js`)) return `${base}.js`
  if (fileExists(`${base}.mjs`)) return `${base}.mjs`

  if (dirExists(base)) {
    const indexTs = path.join(base, 'index.ts')
    const indexJs = path.join(base, 'index.js')
    const indexMjs = path.join(base, 'index.mjs')
    if (fileExists(indexTs)) return indexTs
    if (fileExists(indexJs)) return indexJs
    if (fileExists(indexMjs)) return indexMjs
  }

  return null
}

function parseNamedImports(sourceText) {
  /** @type {Map<string, string>} */
  const imports = new Map()
  const importRe =
    /import\s*{\s*([^}]+)\s*}\s*from\s*['"]([^'"]+)['"]/g

  let match
  while ((match = importRe.exec(sourceText))) {
    const rawNames = match[1]
    const specifier = match[2]
    const names = rawNames
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.split(/\s+as\s+/i)[0].trim())
      .filter(Boolean)
    for (const name of names) {
      imports.set(name, specifier)
    }
  }

  return imports
}

function joinUrlPath(prefix, suffix) {
  const left = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
  const right = suffix.startsWith('/') ? suffix : `/${suffix}`
  const combined = `${left}${right}`
  return combined === '' ? '/' : combined
}

function normalizePath(p) {
  if (!p) return '/'
  const withLeading = p.startsWith('/') ? p : `/${p}`
  return withLeading.replace(/\/{2,}/g, '/')
}

function parseArgs(argv) {
  const outIndex = argv.indexOf('--out')
  const out = outIndex >= 0 ? argv[outIndex + 1] : null
  const pretty = argv.includes('--pretty')
  return { out, pretty }
}

/**
 * @typedef {{ method: string, path: string, sourceFile: string }} InventoryRoute
 */

/**
 * @param {string} routerName
 * @param {string} moduleFile
 * @param {string} basePrefix
 * @param {Set<string>} visited
 * @param {InventoryRoute[]} out
 */
function traverseRouter(routerName, moduleFile, basePrefix, visited, out) {
  const visitKey = `${moduleFile}::${routerName}::${basePrefix}`
  if (visited.has(visitKey)) return
  visited.add(visitKey)

  const sourceText = readText(moduleFile)
  const namedImports = parseNamedImports(sourceText)

  // Collect direct HTTP method routes for this router instance.
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']
  const methodRe = new RegExp(
    String.raw`\b${routerName}\.(${methods.join('|')})\(\s*(['"])([^'"]+)\2`,
    'g',
  )
  let match
  while ((match = methodRe.exec(sourceText))) {
    const method = match[1].toUpperCase()
    const localPath = match[3]
    const fullPath = normalizePath(joinUrlPath(basePrefix || '', localPath))
    out.push({ method, path: fullPath, sourceFile: moduleFile })
  }

  // Follow nested `.route('/prefix', childRouter)` mounts.
  const routeMountRes = [
    new RegExp(
      String.raw`\b${routerName}\.route\(\s*(['"])([^'"]+)\1\s*,\s*([A-Za-z0-9_]+)\s*\)`,
      'g',
    ),
  ]

  // `apps/backend/src/index.ts` mounts routers using a chained `.route(...)` call:
  // `const routes = app.route(...).route(...)`.
  // Support that pattern only for the root `app` router to avoid false positives.
  if (routerName === 'app') {
    routeMountRes.push(
      new RegExp(
        String.raw`\.route\(\s*(['"])([^'"]+)\1\s*,\s*([A-Za-z0-9_]+)\s*\)`,
        'g',
      ),
    )
  }

  for (const routeMountRe of routeMountRes) {
    while ((match = routeMountRe.exec(sourceText))) {
    const mountPrefix = match[2]
    const childRouterName = match[3]
    const childSpecifier = namedImports.get(childRouterName)
    if (!childSpecifier) continue

    const childModuleFile = resolveModule(moduleFile, childSpecifier)
    if (!childModuleFile) continue

    const nextPrefix = normalizePath(joinUrlPath(basePrefix || '', mountPrefix))
    traverseRouter(childRouterName, childModuleFile, nextPrefix, visited, out)
  }
  }
}

function uniqueRoutes(routes) {
  /** @type {Map<string, InventoryRoute>} */
  const map = new Map()
  for (const r of routes) {
    const key = `${r.method} ${r.path}`
    if (!map.has(key)) map.set(key, r)
  }
  return [...map.values()].sort((a, b) => {
    if (a.path === b.path) return a.method.localeCompare(b.method)
    return a.path.localeCompare(b.path)
  })
}

const { out: outArg, pretty } = parseArgs(process.argv.slice(2))
const outFile = outArg
  ? path.resolve(backendRoot, outArg)
  : path.join(backendRoot, 'api-inventory.json')

const entryFile = path.join(srcRoot, 'index.ts')
if (!fileExists(entryFile)) {
  console.error(`Entry file not found: ${entryFile}`)
  process.exit(1)
}

/** @type {InventoryRoute[]} */
const routes = []
traverseRouter('app', entryFile, '', new Set(), routes)

const unique = uniqueRoutes(routes)
const payload = {
  generatedAt: new Date().toISOString(),
  service: '@beresio/backend',
  count: unique.length,
  routes: unique,
}

fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, JSON.stringify(payload, null, pretty ? 2 : 0))

console.log(`Wrote ${unique.length} routes to ${outFile}`)
