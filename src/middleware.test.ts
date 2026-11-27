import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { LOCALES } from "@medialane/ui/i18n";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import nextConfig from "../next.config";
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
  test("an unprefixed request with no cookie and no header passes through for the English rewrite", () => {
    const response = handleRequest(request("/marketplace?sort=new"), PT);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.status).toBe(200);
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
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  test("a language that is not offered is served in English", () => {
    const response = handleRequest(request("/marketplace", { "accept-language": "pt" }), LOCALES.filter((locale) => locale.code === "en"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  test("a double slash after the language cannot redirect off the site", () => {
    const response = handleRequest(request("/en//evil.com"), PT);
    expect(response.headers.get("location")).toBe("http://localhost:3000/evil.com");
  });
});

async function rewritten(path: string) {
  const rewrites = await nextConfig.rewrites!();
  if (Array.isArray(rewrites)) throw new Error("expected rewrite phases");
  for (const { source, destination } of rewrites.afterFiles ?? []) {
    const params = getPathMatch(source, { strict: true })(path);
    if (!params) continue;
    const rest = Array.isArray(params.rest) ? params.rest.join("/") : params.rest;
    return destination.replace(":first", String(params.first)).replace("/:rest*", rest ? `/${rest}` : "");
  }
  return null;
}

describe("English routing", () => {
  test("unprefixed pages are served from /en", async () => {
    expect(await rewritten("/")).toBe("/en");
    expect(await rewritten("/marketplace")).toBe("/en/marketplace");
    expect(await rewritten("/asset/starknet/0x1/2")).toBe("/en/asset/starknet/0x1/2");
    expect(await rewritten("/apiary")).toBe("/en/apiary");
  });

  test("API routes, build files and public files are left alone", async () => {
    for (const path of ["/api/proxy/v1/tokens", "/api/session", "/_next/static/chunks/a.js", "/favicon.ico", "/.well-known/webauthn"]) {
      expect(await rewritten(path)).toBeNull();
    }
  });

  test("every offered language is left alone", async () => {
    for (const { code } of LOCALES) {
      expect(await rewritten(`/${code}`)).toBeNull();
      expect(await rewritten(`/${code}/marketplace`)).toBeNull();
    }
  });
});
