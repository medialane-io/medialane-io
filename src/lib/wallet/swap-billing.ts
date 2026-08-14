import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

export type SwapAction = "quote" | "build";

export async function billSwapCall(action: SwapAction): Promise<boolean> {
  if (!MEDIALANE_API_KEY) {
    console.error(`[swap:${action}] MEDIALANE_API_KEY is not configured — refusing to bill/forward`);
    return false;
  }
  try {
    const res = await fetch(`${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}/v1/swap/${action}/meter`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": MEDIALANE_API_KEY },
    });
    return res.ok;
  } catch (err) {
    console.error(`[swap:${action}] billing call failed`, { err: err instanceof Error ? err.message : String(err) });
    return false;
  }
}
