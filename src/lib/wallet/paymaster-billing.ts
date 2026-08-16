import { meterBackendCall } from "./metered-call";

export type PaymasterAction = "invoke/build" | "invoke/execute" | "deploy/build" | "deploy/execute";

export function billPaymasterCall(action: PaymasterAction): Promise<boolean> {
  return meterBackendCall(`paymaster/${action}`, `paymaster:${action}`);
}
