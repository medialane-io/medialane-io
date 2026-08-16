import { meterBackendCall } from "./metered-call";

export type SwapAction = "quote" | "build";

export function billSwapCall(action: SwapAction): Promise<boolean> {
  return meterBackendCall(`swap/${action}/meter`, `swap:${action}`);
}
