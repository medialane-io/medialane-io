// Wallet/paymaster proxy routes return { error: "<human-readable message>" }
// on failure (see medialane-backend's classifyPaymasterError and validation
// responses). Surface that text instead of a raw "<label> failed (<status>)"
// string, which is meaningless to a user and was showing up verbatim in the
// UI (e.g. "Sponsored invoke execute failed (400)").
export async function throwOnErrorResponse(res: Response, fallback: string): Promise<never> {
  const body = await res.json().catch(() => null) as { error?: string } | null;
  throw new Error(body?.error || fallback);
}
