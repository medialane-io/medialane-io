import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

export type PaymasterAction = "invoke/build" | "invoke/execute" | "deploy/build" | "deploy/execute";

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
