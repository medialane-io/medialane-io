import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

export type PaymasterAction = "invoke/build" | "invoke/execute" | "deploy/build" | "deploy/execute";

/**
 * Bills this app's credit balance for an upcoming AVNU-paymaster-sponsored
 * call, via the backend's metered POST /v1/paymaster/<action>
 * (medialane-backend/src/api/routes/paymaster-meter.ts). The paymaster call
 * itself still goes straight to AVNU with this app's own key below — this
 * only makes it a credited action instead of a free bypass. Mirrors
 * billRpcCall in /api/rpc/route.ts.
 *
 * Returns false (caller must refuse to forward to AVNU) on insufficient
 * credits or any billing failure — a sponsored call this app can't account
 * for must not run.
 */
export async function billPaymasterCall(action: PaymasterAction): Promise<boolean> {
  if (!MEDIALANE_API_KEY) {
    console.error(`[paymaster:${action}] MEDIALANE_API_KEY is not configured — refusing to bill/forward`);
    return false;
  }
  try {
    const res = await fetch(`${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}/v1/paymaster/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": MEDIALANE_API_KEY },
    });
    return res.ok;
  } catch (err) {
    console.error(`[paymaster:${action}] billing call failed`, { err: err instanceof Error ? err.message : String(err) });
    return false;
  }
}
