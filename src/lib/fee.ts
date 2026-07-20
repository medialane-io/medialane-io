import { resolveFeeConfig } from "@medialane/sdk";
import { buildFeeCall } from "@medialane/sdk/starknet";

export const ioFeeConfig = resolveFeeConfig({
  enabled: process.env.NEXT_PUBLIC_FEE_ENABLED !== "false",
  fundAddress: process.env.NEXT_PUBLIC_FEE_FUND_ADDRESS || undefined,
  marketplaceBps: process.env.NEXT_PUBLIC_FEE_MARKETPLACE_BPS
    ? Number(process.env.NEXT_PUBLIC_FEE_MARKETPLACE_BPS)
    : 100,
  launchpadBps: process.env.NEXT_PUBLIC_FEE_LAUNCHPAD_BPS
    ? Number(process.env.NEXT_PUBLIC_FEE_LAUNCHPAD_BPS)
    : 100,
});

export { buildFeeCall };
