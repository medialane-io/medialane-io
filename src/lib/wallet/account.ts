import { CallData, num, type BigNumberish, type Call } from "starknet";
import { getCoordinates } from "@medialane/sdk";
import { computeAccountAddress, ownerConstructorCalldata } from "@medialane/sdk/starknet";

// The account class hash + address derivation + constructor calldata are
// protocol facts owned by @medialane/sdk's chains.ts coordinate registry —
// never re-hardcode: a hand-copied factory class hash already drifted from
// source once (see the 2026-08-02 media-wallet audit, H1).
export const MEDIAWALLET_CLASS_HASH = getCoordinates("STARKNET").mediaWalletClassHash!;
export const computeWalletAddress = computeAccountAddress;
export { ownerConstructorCalldata };

/**
 * The permissionless `MediaWalletFactory.deploy_wallet(ownerPubkey, salt)`
 * call. `@medialane/sdk`'s starknet/business-provisioning module gained this
 * exact helper (`buildDeployWalletCall`) in the same migration this file is
 * part of, but that SDK change isn't published to npm yet — io's installed
 * `@medialane/sdk` predates it. Defined locally for now; replace this with
 * the SDK re-export once a new SDK version ships (same encoding, so the
 * swap is a no-op for every caller).
 */
export function buildDeployWalletCall(
  factoryAddress: string,
  ownerPubkey: BigNumberish,
  salt: BigNumberish = 0,
): Call {
  return {
    contractAddress: factoryAddress,
    entrypoint: "deploy_wallet",
    calldata: CallData.compile([num.toHex(ownerPubkey), num.toHex(salt)]),
  };
}
