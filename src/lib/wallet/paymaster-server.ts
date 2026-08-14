import { PaymasterRpc } from "starknet";

export const AVNU_PAYMASTER_URL = "https://starknet.paymaster.avnu.fi";

export function paymaster(): PaymasterRpc {
  const apiKey = process.env.AVNU_PAYMASTER_API_KEY;
  if (!apiKey) throw new Error("AVNU_PAYMASTER_API_KEY is not set");
  return new PaymasterRpc({
    nodeUrl: AVNU_PAYMASTER_URL,
    headers: { "x-paymaster-api-key": apiKey },
  });
}
