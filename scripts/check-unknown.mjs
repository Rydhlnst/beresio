import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const UNKNOWN_PATTERNS = [
  /TS18046:/,
  /TS2345: Argument of type 'unknown'/,
  /TS2322: Type 'unknown\[\]' is not assignable/,
  /TS2322: Type 'unknown' is not assignable/,
];

const TYPECHECK_TARGETS = [
  { name: "backend", cmd: "node apps/backend/node_modules/typescript/bin/tsc --noEmit -p apps/backend/tsconfig.json" },
  { name: "app", cmd: "node apps/app/node_modules/typescript/bin/tsc --noEmit -p apps/app/tsconfig.json" },
  { name: "web", cmd: "node apps/web/node_modules/typescript/bin/tsc --noEmit -p apps/web/tsconfig.json" },
];

function runTypecheckForUnknown({ name, cmd }) {
  try {
    execSync(cmd, { stdio: "pipe", encoding: "utf8" });
    return { name, unknownLines: [] };
  } catch (error) {
    const stdout = typeof error.stdout === "string" ? error.stdout : "";
    const stderr = typeof error.stderr === "string" ? error.stderr : "";
    const output = `${stdout}\n${stderr}`;
    const unknownLines = output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => UNKNOWN_PATTERNS.some((pattern) => pattern.test(line)));
    return { name, unknownLines };
  }
}

function walkFiles(rootDir, out = []) {
  for (const entry of readdirSync(rootDir)) {
    const fullPath = join(rootDir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      if (entry === "node_modules" || entry === ".next" || entry === "dist") continue;
      walkFiles(fullPath, out);
      continue;
    }
    const ext = extname(fullPath);
    if (ext === ".ts" || ext === ".tsx") {
      out.push(fullPath);
    }
  }
  return out;
}

function findForbiddenCasts() {
  const files = [
    ...walkFiles("apps/app"),
    ...walkFiles("apps/backend/src/routes/dashboard"),
  ];

  const apiClientAnyHits = [];
  const unknownBridgeHits = [];

  for (const file of files) {
    const content = readFileSync(file, "utf8");
    if (content.includes("(apiClient as any)")) {
      apiClientAnyHits.push(file);
    }
    if (content.includes("as unknown as")) {
      unknownBridgeHits.push(file);
    }
  }

  return { apiClientAnyHits, unknownBridgeHits };
}

const results = TYPECHECK_TARGETS.map(runTypecheckForUnknown);
const { apiClientAnyHits, unknownBridgeHits } = findForbiddenCasts();

const hasUnknownDiagnostics = results.some((result) => result.unknownLines.length > 0);
const hasForbiddenCasts = apiClientAnyHits.length > 0 || unknownBridgeHits.length > 0;

if (!hasUnknownDiagnostics && !hasForbiddenCasts) {
  console.log("Unknown diagnostics check passed.");
  process.exit(0);
}

for (const result of results) {
  if (result.unknownLines.length === 0) continue;
  console.error(`\n[${result.name}] unknown diagnostics:`);
  for (const line of result.unknownLines) {
    console.error(line);
  }
}

if (apiClientAnyHits.length > 0) {
  console.error("\nForbidden '(apiClient as any)' cast found in:");
  for (const hit of apiClientAnyHits) {
    console.error(hit);
  }
}

if (unknownBridgeHits.length > 0) {
  console.error("\nForbidden 'as unknown as' cast found in:");
  for (const hit of unknownBridgeHits) {
    console.error(hit);
  }
}

process.exit(1);
