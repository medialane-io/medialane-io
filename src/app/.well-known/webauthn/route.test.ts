import { test, expect } from "bun:test";
import { GET } from "./route";

async function origins(): Promise<string[]> {
  const body = (await GET().json()) as { origins: string[] };
  return body.origins;
}

test("every Medialane app that signs people in is listed", async () => {
  const listed = await origins();
  for (const origin of [
    "https://www.medialane.io",
    "https://medialane.io",
    "https://portal.medialane.io",
  ]) {
    expect(listed).toContain(origin);
  }
});

test("nothing outside medialane.io is listed, since this authorises use of our passkeys", async () => {
  for (const origin of await origins()) {
    expect(origin.startsWith("https://")).toBe(true);
    const host = new URL(origin).hostname;
    expect(host === "medialane.io" || host.endsWith(".medialane.io")).toBe(true);
  }
});

test("the list has no duplicates", async () => {
  const listed = await origins();
  expect(new Set(listed).size).toBe(listed.length);
});
