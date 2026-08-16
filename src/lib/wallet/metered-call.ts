import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

export async function meterBackendCall(path: string, logLabel: string): Promise<boolean> {
  if (!MEDIALANE_API_KEY) {
    console.error(`[${logLabel}] MEDIALANE_API_KEY is not configured — refusing to bill/forward`);
    return false;
  }
  try {
    const res = await fetch(`${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}/v1/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": MEDIALANE_API_KEY },
    });
    return res.ok;
  } catch (err) {
    console.error(`[${logLabel}] billing call failed`, { err: err instanceof Error ? err.message : String(err) });
    return false;
  }
}
