import { resolveAppFeeConfig } from "@medialane/sdk";

export { buildFeeCall } from "@medialane/sdk/starknet";

export const feeConfig = resolveAppFeeConfig({
  NEXT_PUBLIC_FEE_ENABLED: process.env.NEXT_PUBLIC_FEE_ENABLED,
  NEXT_PUBLIC_FEE_FUND_ADDRESS: process.env.NEXT_PUBLIC_FEE_FUND_ADDRESS,
  NEXT_PUBLIC_FEE_MARKETPLACE_BPS: process.env.NEXT_PUBLIC_FEE_MARKETPLACE_BPS,
  NEXT_PUBLIC_FEE_LAUNCHPAD_BPS: process.env.NEXT_PUBLIC_FEE_LAUNCHPAD_BPS,
});
