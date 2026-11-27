import { expect, test } from "bun:test";
import { Glob } from "bun";
import { join } from "node:path";

const APP = join(import.meta.dir, "../src/app");

async function dynamicPages() {
  const pages: { path: string; source: string }[] = [];
  for await (const path of new Glob("**/page.tsx").scan(APP)) {
    const segments = path.split("/").filter((segment) => segment !== "[locale]");
    if (!segments.some((segment) => segment.startsWith("["))) continue;
    pages.push({ path, source: await Bun.file(join(APP, path)).text() });
  }
  return pages;
}

test("a dynamic page that sets revalidate can actually be cached", async () => {
  const uncached = (await dynamicPages())
    .filter(({ source }) => source.includes("export const revalidate"))
    .filter(({ source }) => !source.includes("export function generateStaticParams"))
    .map(({ path }) => path);
  expect(uncached).toEqual([]);
});

test("unknown top-level paths are rejected without rendering a page", async () => {
  const ipType = (await dynamicPages()).find(({ path }) => path.endsWith("[ipType]/page.tsx"));
  expect(ipType?.source).toContain("export const dynamicParams = false");
  expect(ipType?.source).toContain("export function generateStaticParams");
});
