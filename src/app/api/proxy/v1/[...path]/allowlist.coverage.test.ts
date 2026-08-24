import { test, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { isPathAllowed } from "./allowlist";

// Guards against the exact regression this repo shipped once already: a
// method's allowlist silently reverting to a wildcard. Probed indirectly
// (isPathAllowed exposes no pattern accessor) via two paths that must never
// be publicly reachable regardless of method.
test("no method in the allowlist is a catch-all pattern", () => {
  for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
    expect(isPathAllowed(method, "portal/me")).toBe(false);
    expect(isPathAllowed(method, "business/provisioning")).toBe(false);
  }
});

// Traces every real /v1/... call site this app (and the shared packages it
// pulls in) can reach through the public proxy, and asserts each one is
// covered by some method in the allowlist. This is what would have caught
// both misses in this file's history — do not delete without replacing.
//
// Scope: string/template literals containing a literal /v1/ or /api/proxy/v1/
// path segment, found under src/hooks, src/components, src/app (excluding
// src/app/api, which are server-only routes never reached through this proxy)
// and @medialane/ui's dist (small and fully hook-scoped, so low false-positive
// risk). @medialane/sdk's client.ts is intentionally NOT scanned wholesale —
// it also defines /v1/portal/* and /v1/business/provisioning, which this app
// must never allowlist, so a blanket scan there would tell us to reintroduce
// the exact hole this file exists to close. SDK-mediated calls (anything
// behind `.api.someMethod(...)`) are out of scope for this scanner; audit
// medialane-sdk's client.ts by hand when it changes.
const REPO_ROOT = process.cwd();
const APP_ROOTS = ["src/hooks", "src/components", "src/app"];
const EXCLUDED_DIRS = [join(REPO_ROOT, "src/app/api")];
const EXCLUDED_FILES = new Set([
  // Server-only: calls MEDIALANE_BACKEND_URL directly for SSR metadata,
  // never through /api/proxy.
  join(REPO_ROOT, "src/lib/api-server.ts"),
  join(REPO_ROOT, "src/lib/backend-metadata.ts"),
  // Server component: redirects by slug using env vars directly, never
  // through /api/proxy.
  join(REPO_ROOT, "src/app/collection/[slug]/page.tsx"),
]);
const UI_DIST_DIR = join(REPO_ROOT, "node_modules/@medialane/ui/dist");

// Backend routes intentionally handled by their own dedicated route.ts files
// (server-authenticated, never through the generic [...path] proxy).
const NOT_PROXIED_PREFIXES = ["rpc", "paymaster/", "swap/"];

function walk(dir: string, out: string[] = []): string[] {
  if (EXCLUDED_DIRS.some((excluded) => dir === excluded || dir.startsWith(excluded + "/"))) {
    return out;
  }
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walk(full, out);
    } else if (/\.(ts|tsx|js)$/.test(entry) && !/\.(test|d)\.(ts|tsx|js)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

// A hand-rolled scanner rather than a single regex: a `${...}` interpolation
// can contain arbitrary expression characters (e.g. `${encodeURIComponent(x)}`),
// which a flat character class can't safely bound.
function extractPaths(source: string): string[] {
  const found: string[] = [];
  const START = /\/(?:api\/proxy\/)?v1\//g;
  let start: RegExpExecArray | null;
  while ((start = START.exec(source))) {
    let i = start.index + start[0].length;
    let path = "";
    while (i < source.length) {
      const ch = source[i];
      if (ch === "$" && source[i + 1] === "{") {
        const close = source.indexOf("}", i + 2);
        if (close === -1) break;
        path += "PARAM";
        i = close + 1;
        continue;
      }
      if (/[A-Za-z0-9_\-./:]/.test(ch)) {
        path += ch;
        i++;
        continue;
      }
      break;
    }
    path = path.replace(/\/+$/, "");
    if (path) found.push(path);
  }
  return found;
}

test("every /v1/* path referenced by app code and @medialane/ui is covered by the proxy allowlist", () => {
  const files = [
    ...APP_ROOTS.flatMap((root) => walk(join(REPO_ROOT, root))),
    ...walk(UI_DIST_DIR).filter((f) => !f.endsWith(".map")),
  ].filter((f) => !EXCLUDED_FILES.has(f));

  const uncovered = new Map<string, string>();

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const path of extractPaths(source)) {
      if (NOT_PROXIED_PREFIXES.some((prefix) => path.startsWith(prefix))) continue;
      const covered = ["GET", "POST", "PATCH", "DELETE"].some((method) =>
        isPathAllowed(method, path)
      );
      if (!covered && !uncovered.has(path)) {
        uncovered.set(path, relative(REPO_ROOT, file));
      }
    }
  }

  if (uncovered.size > 0) {
    const details = [...uncovered.entries()]
      .map(([path, file]) => `  /v1/${path}  (found in ${file})`)
      .join("\n");
    throw new Error(
      `${uncovered.size} path(s) are referenced but not covered by any method in allowlist.ts:\n${details}\n\n` +
        `Either add the path to allowlist.ts, or if it's not meant to be publicly reachable, remove the call site.`
    );
  }
});
