import { expect, test } from "bun:test";
import { IP_TYPE_DATA } from "@medialane/ui";
import { APP_URL } from "@/lib/seo";
import * as sitemapModule from "./sitemap";

test("the sitemap lists the app's own pages straight from code, without waiting on any data", () => {
  const entries = sitemapModule.default();
  expect(Array.isArray(entries)).toBe(true);
  const urls = entries.map((entry) => entry.url);
  expect(urls).toContain(APP_URL);
  expect(urls).toContain(`${APP_URL}/discover`);
  expect(urls).toContain(`${APP_URL}/${IP_TYPE_DATA[0]!.slug}`);
});

test("there is one sitemap, not an index of chunks", () => {
  expect("generateSitemaps" in sitemapModule).toBe(false);
});
