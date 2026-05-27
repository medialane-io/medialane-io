/**
 * Thin fetch helper for backend `/v1/*` routes that are not yet exposed via
 * `@medialane/sdk`'s `ApiClient`. Replaces seven copies of the same
 * fetch + headers + JSON parse + error-throw boilerplate across the hooks.
 *
 * Why a helper instead of pushing everything to the SDK:
 *   - Several routes here (drop conditions, pop eligibility, gated content,
 *     rewards, username claims, platform stats) are app-side endpoints whose
 *     shape may still evolve. Promoting them to the SDK locks in a public
 *     contract we'd then have to version-bump on every tweak.
 *   - The SDK methods that DO cover a route (e.g. getCollections) should
 *     still be preferred — see `lib/medialane-client.ts`'s ApiClient. This
 *     helper is only for the gaps.
 *
 * Error model:
 *   `ApiError` carries the HTTP `status`. The global SWR onError handler in
 *   `app/providers.tsx` reads it and suppresses the toast for 401/403 — auth
 *   state isn't a runtime error worth screaming at the user. Hooks that have
 *   a meaningful 403 state (e.g. `useGatedContent`'s "not_holder") can catch
 *   the ApiError locally and map.
 *
 * Headers:
 *   - `x-api-key` is injected when `MEDIALANE_API_KEY` is non-empty. In the
 *     browser the value is `""` (the BFF proxy at `/api/proxy/v1/*` injects
 *     the real key server-side). On the server the real key is included.
 *   - `Authorization: Bearer <token>` is forwarded if the caller passes
 *     `bearer` — used for Clerk-gated routes.
 *   - `Content-Type: application/json` is set automatically when a body is
 *     present.
 */
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "./constants";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Bearer token (Clerk JWT) for identity-aware routes. */
  bearer?: string | null;
  signal?: AbortSignal;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { method = "GET", body, bearer, signal } = options;
  const url = `${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (MEDIALANE_API_KEY) headers["x-api-key"] = MEDIALANE_API_KEY;
  if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    let message = text || `Request failed with HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && "error" in parsed && typeof parsed.error === "string") {
        message = parsed.error;
      }
    } catch {
      /* response wasn't JSON — keep the text as the message */
    }
    throw new ApiError(res.status, message);
  }

  // 204 No Content shows up on some PATCH/DELETE paths — return undefined as T.
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
