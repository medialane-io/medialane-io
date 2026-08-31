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

// A name is free text the account typed: no length limit, no charset rule, no
// uniqueness, no review. Falling back to it makes it an identifier. A profile
// that set its name to "medialane" rendered as that across the whole site.
const NAME_AS_IDENTITY = /\bdisplayName\s*(\|\||\?\?)/;

// Legitimate uses of the same word: the shared helper's own inputs, form state
// bound to the settings field, and unrelated entities that have a display name.
const ALLOWED = [
  "profile-live-preview",
  "settings-content",
  "settings/types",
  "portfolio/collections",
  "coin-page-client",
  "identity-guard.test",
  "wallet/passkey",
  "components/ui/",
];

test("no surface falls back to a profile name as the account identity", () => {
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
