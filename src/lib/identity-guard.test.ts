import { test, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry !== "node_modules") sourceFiles(path, acc);
    } else if (path.endsWith(".ts") || path.endsWith(".tsx")) {
      acc.push(path);
    }
  }
  return acc;
}

const NAME_AS_IDENTITY = /\b(profile|creator|account|user)s?\??\.(name|displayName)\s*(\|\||\?\?)\s*[A-Za-z_$]/;

const ALLOWED = ["identity-guard.test"];

test("a profile name is never the fallback for an account identity", () => {
  const offenders = sourceFiles("src")
    .filter((f) => !ALLOWED.some((a) => f.includes(a)))
    .flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .map((line, i) => ({ file, line: i + 1, text: line.trim() }))
        .filter((l) => NAME_AS_IDENTITY.test(l.text)),
    );

  expect(offenders).toEqual([]);
});
