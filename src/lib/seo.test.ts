import { describe, expect, test } from "bun:test";
import { alternates, pageMetadata } from "./seo";

const LANGUAGES = [
  { code: "en", name: "English", dir: "ltr" as const },
  { code: "pt", name: "Português", dir: "ltr" as const },
];

describe("alternates", () => {
  test("alternates('/marketplace', 'pt') has canonical /pt/marketplace", () => {
    const result = alternates("/marketplace", "pt", LANGUAGES);
    expect(result?.canonical).toBe("https://medialane.io/pt/marketplace");
  });

  test("languages lists en without prefix and every other locale with it", () => {
    const result = alternates("/marketplace", "en", LANGUAGES);
    expect(result?.canonical).toBe("https://medialane.io/marketplace");
    expect(result?.languages).toMatchObject({
      en: "https://medialane.io/marketplace",
      pt: "https://medialane.io/pt/marketplace",
    });
  });

  test("x-default is the unprefixed URL", () => {
    const result = alternates("/marketplace", "pt", LANGUAGES);
    expect(result?.languages?.["x-default"]).toBe("https://medialane.io/marketplace");
  });

  test("the home page maps to the bare language root", () => {
    const result = alternates("/", "pt", LANGUAGES);
    expect(result?.canonical).toBe("https://medialane.io/pt");
    expect(result?.languages?.en).toBe("https://medialane.io/");
  });
});

describe("pageMetadata", () => {
  const params = Promise.resolve({ locale: "en" });

  test("builds title, description, canonical and social tags from one declaration", async () => {
    const metadata = await pageMetadata({ path: "/claim", title: "Claims", description: "Reserve a name." })({ params });
    expect(metadata.title).toBe("Claims");
    expect(metadata.description).toBe("Reserve a name.");
    expect(metadata.alternates?.canonical).toBe("https://medialane.io/claim");
    expect(metadata.openGraph?.title).toBe("Claims | Medialane");
  });

  test("social tags can be left out", async () => {
    const metadata = await pageMetadata({ path: "/verify", title: "Verify", social: false })({ params });
    expect(metadata.openGraph).toBeUndefined();
    expect(metadata.description).toBeUndefined();
  });

  test("robots pass through", async () => {
    const metadata = await pageMetadata({ path: "/s", title: "S", robots: { index: false } })({ params });
    expect(metadata.robots).toEqual({ index: false });
  });
});
