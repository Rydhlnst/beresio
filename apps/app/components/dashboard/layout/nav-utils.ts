import type { BusinessNavItem } from "./nav-config"

const ROUTE_PREFIX_ALIASES: Array<[string, string]> = [
  ["/laporan", "/reports"],
  ["/cabang", "/branches"],
  ["/tim", "/team"],
  ["/menu", "/menus"],
  ["/meja", "/tables"],
  ["/pengaturan", "/settings"],
]

function stripTrailingSlash(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1)
  return path
}

function normalizePath(path: string) {
  const trimmed = path.trim()
  if (!trimmed) return "/"
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  const normalized = stripTrailingSlash(withLeadingSlash)
  return normalized.length === 0 ? "/" : normalized
}

export function resolveNavPath(path: string) {
  const normalized = normalizePath(path)
  for (const [from, to] of ROUTE_PREFIX_ALIASES) {
    if (normalized === from || normalized.startsWith(`${from}/`)) {
      return `${to}${normalized.slice(from.length)}`
    }
  }
  return normalized
}

export function getNavPathMatchScore(pathname: string, itemPath: string) {
  const current = normalizePath(pathname)
  const resolvedItem = resolveNavPath(itemPath)
  if (current === resolvedItem || current.startsWith(`${resolvedItem}/`)) {
    return resolvedItem.length
  }
  return -1
}

export function isNavPathActive(pathname: string, itemPath: string) {
  return getNavPathMatchScore(pathname, itemPath) >= 0
}

export function getActiveNavCrumb(
  pathname: string,
  items: BusinessNavItem[]
): { label: string; parentLabel?: string } | null {
  let bestSubMatch: { label: string; parentLabel: string; score: number } | null = null

  for (const item of items) {
    const submenu = item.submenu ?? []
    for (const sub of submenu) {
      const score = getNavPathMatchScore(pathname, sub.path)
      if (score > (bestSubMatch?.score ?? -1)) {
        bestSubMatch = { label: sub.label, parentLabel: item.label, score }
      }
    }
  }
  if (bestSubMatch) return { label: bestSubMatch.label, parentLabel: bestSubMatch.parentLabel }

  let bestItemMatch: { label: string; score: number } | null = null
  for (const item of items) {
    const score = getNavPathMatchScore(pathname, item.path)
    if (score > (bestItemMatch?.score ?? -1)) {
      bestItemMatch = { label: item.label, score }
    }
  }
  if (bestItemMatch) return { label: bestItemMatch.label }

  const fallback: Array<[RegExp, string]> = [
    [/^\/settings(\/|$)/, "Pengaturan Akun"],
    [/^\/organizations(\/|$)/, "Organisasi"],
    [/^\/onboarding(\/|$)/, "Onboarding"],
  ]
  const current = normalizePath(pathname)
  for (const [re, label] of fallback) {
    if (re.test(current)) return { label }
  }

  return null
}
