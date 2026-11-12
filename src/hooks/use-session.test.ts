import { afterEach, describe, expect, test } from "bun:test";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { SWRConfig } from "swr";
import { fetchSession, useSession } from "./use-session";

const original = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = original;
});

function backend(session: unknown) {
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(`${init?.method ?? "GET"} ${input.toString()}`);
    return new Response(init?.method === "DELETE" ? null : JSON.stringify(session), { status: 200 });
  }) as unknown as typeof fetch;
  return calls;
}

const base = { accountId: "a1", publicId: "acc_1", walletAddress: "0x1", emailDeadline: null };

describe("fetchSession", () => {
  test("returns a session that has an email", async () => {
    const calls = backend({ ...base, email: "ana@example.com" });
    expect(await fetchSession()).toMatchObject({ email: "ana@example.com" });
    expect(calls).toEqual(["GET /api/session"]);
  });

  test("treats a session without an email as signed out and clears it", async () => {
    const calls = backend({ ...base, email: null });
    expect(await fetchSession()).toBeNull();
    expect(calls).toEqual(["GET /api/session", "DELETE /api/session"]);
  });

  test("is signed out when there is no session", async () => {
    const calls = backend(null);
    expect(await fetchSession()).toBeNull();
    expect(calls).toEqual(["GET /api/session"]);
  });
});

describe("useSession", () => {
  test("focus and reconnect do not ask the server again", async () => {
    const calls = backend({ ...base, email: "ana@example.com" });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(SWRConfig, { value: { provider: () => new Map(), dedupingInterval: 0, focusThrottleInterval: 0 } }, children);
    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.session).not.toBeNull());
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("online"));
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(calls).toEqual(["GET /api/session"]);
  });
});
