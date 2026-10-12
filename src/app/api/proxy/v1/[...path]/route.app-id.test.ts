import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";
import { NextRequest } from "next/server";

const realFetch = globalThis.fetch;
let forwarded: Headers | undefined;
let forwardedUrl: string | undefined;
let POST: (req: Request, ctx: { params: Promise<{ path: string[] }> }) => Promise<Response>;
let GET: (req: Request, ctx: { params: Promise<{ path: string[] }> }) => Promise<Response>;

beforeAll(async () => {
  process.env.MEDIALANE_API_KEY = "test-key";
  globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
    forwardedUrl = String(url);
    forwarded = new Headers(init?.headers);
    return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  ({ GET, POST } = await import("./route"));
});

beforeEach(() => {
  forwarded = undefined;
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

const params = (...path: string[]) => ({ params: Promise.resolve({ path }) });

test("the gateway names its app and ignores an app id sent by the browser", async () => {
  const res = await GET(new Request("http://localhost/api/proxy/v1/orders", { headers: { "x-app-id": "MEDIALANE_DAO" } }), params("orders"));
  expect(res.status).toBe(200);
  expect(forwarded?.get("x-app-id")).toBe("MEDIALANE_IO");
  expect(forwarded?.get("x-api-key")).toBe("test-key");
});

test("the gateway forwards the account session cookie as x-account-session", async () => {
  const req = new NextRequest("http://localhost/api/proxy/v1/users/me");
  req.cookies.set("ml_account_session", "acct-123");
  await GET(req, params("users", "me"));
  expect(forwarded?.get("x-account-session")).toBe("acct-123");
});

test("the gateway ignores an x-account-session header sent by the browser", async () => {
  await GET(new Request("http://localhost/api/proxy/v1/users/me", { headers: { "x-account-session": "forged" } }), params("users", "me"));
  expect(forwarded?.has("x-account-session")).toBe(false);
});

test("rpc, paymaster and swap quote calls go through the gateway with the session", async () => {
  for (const path of [["rpc"], ["paymaster", "invoke", "build"], ["paymaster", "deploy", "execute"], ["swap", "quote"]]) {
    const req = new NextRequest(`http://localhost/api/proxy/v1/${path.join("/")}`, { method: "POST", body: "{}" });
    req.cookies.set("ml_account_session", "s1");
    const res = await POST(req, params(...path));
    expect(res.status).toBe(200);
    expect(forwardedUrl).toEndWith(`/v1/${path.join("/")}`);
    expect(forwarded?.get("x-account-session")).toBe("s1");
  }
});
