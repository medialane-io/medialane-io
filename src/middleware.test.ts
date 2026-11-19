import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { LOCALES } from "@medialane/ui/i18n";
import { handleRequest } from "./middleware";

const PT = LOCALES;

function request(path: string, headers: Record<string, string> = {}) {
  const { cookie, ...rest } = headers;
  const result = new NextRequest(`http://localhost:3000${path}`, { headers: rest });
  if (cookie) {
    const [name = "", value = ""] = cookie.split("=");
    result.cookies.set(name, value);
  }
  return result;
}

describe("language middleware", () => {
  test("an unprefixed request with no cookie and no header is rewritten to /en and its URL is unchanged", () => {
    const response = handleRequest(request("/marketplace?sort=new"), PT);
    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/en/marketplace?sort=new");
    expect(response.status).toBe(200);
  });

  test("the home page is rewritten to /en", () => {
    const response = handleRequest(request("/"), PT);
    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/en");
  });

  test("/en/marketplace redirects to /marketplace", () => {
    const response = handleRequest(request("/en/marketplace?sort=new"), PT);
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("http://localhost:3000/marketplace?sort=new");
  });

  test("a prefixed request passes through with its language", () => {
    const response = handleRequest(request("/pt/marketplace"), PT);
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  test("an unprefixed request with a pt header redirects to the prefixed path with Vary set", () => {
    const response = handleRequest(request("/marketplace?sort=new", { "accept-language": "pt-BR,pt;q=0.9" }), PT);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/pt/marketplace?sort=new");
    expect(response.headers.get("vary")).toContain("Accept-Language");
    expect(response.headers.get("vary")).toContain("Cookie");
  });

  test("the language cookie wins over the header", () => {
    const response = handleRequest(request("/marketplace", { "accept-language": "pt", cookie: "ml_locale=en" }), PT);
    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/en/marketplace");
  });

  test("a language that is not offered is served in English", () => {
    const response = handleRequest(request("/marketplace", { "accept-language": "pt" }), LOCALES.filter((locale) => locale.code === "en"));
    expect(response.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/en/marketplace");
  });

  test("a double slash after the language cannot redirect off the site", () => {
    const response = handleRequest(request("/en//evil.com"), PT);
    expect(response.headers.get("location")).toBe("http://localhost:3000/evil.com");
  });
});
