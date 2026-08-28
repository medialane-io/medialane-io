import { test, expect } from "bun:test";
import pkg from "../../../package.json";
import { PAID_UPSTREAM_MARKERS } from "@medialane/sdk";

const PAID_UPSTREAM_PACKAGES = ["@avnu/avnu-sdk"];

test("the app holds no direct dependency on a paid upstream SDK", () => {
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  for (const name of PAID_UPSTREAM_PACKAGES) {
    expect(deps).not.toContain(name);
  }
});

test("no app source reaches a paid upstream or an RPC node directly", async () => {
  // Sourced from the SDK so that adding an upstream protects every app at once.
  // Each repo keeping its own list is how one of them ended up without the
  // guard entirely.
  const banned = PAID_UPSTREAM_MARKERS;
  const glob = new Bun.Glob("**/*.{ts,tsx}");
  const offenders: string[] = [];
  for await (const file of glob.scan({ cwd: `${import.meta.dir}/../..`, absolute: true })) {
    if (file.includes(".test.")) continue;
    const source = await Bun.file(file).text();
    for (const needle of banned) {
      if (source.includes(needle)) offenders.push(`${file}: ${needle}`);
    }
  }
  expect(offenders).toEqual([]);
});
