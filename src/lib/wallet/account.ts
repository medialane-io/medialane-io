import { getCoordinates } from "@medialane/sdk";
import { computeAccountAddress, ownerConstructorCalldata } from "@medialane/sdk/starknet";

// The account class hash + address derivation + constructor calldata are
// protocol facts owned by @medialane/sdk's chains.ts coordinate registry —
// never re-hardcode: a hand-copied factory class hash already drifted from
// source once (see the 2026-08-02 media-wallet audit, H1).
export const MEDIAWALLET_CLASS_HASH = getCoordinates("STARKNET").mediaWalletClassHash!;
export const computeWalletAddress = computeAccountAddress;
export { ownerConstructorCalldata };

// Third-party-pays-gas deploy (for a relayer deploying on a user's behalf,
// e.g. io's zero-funds onboarding) does NOT need a custom Medialane-declared
// factory contract. Starknet ships a standard Universal Deployer Contract
// (UDC), live on mainnet, verified 2026-08-06 at
// 0x041a78e741e5af2fec34b695679bc6891742439f7afb8484ecd7766661ad02bf
// (starknet.js's own `constants.UDC.ADDRESS`). Use `Account.deployContract`
// directly — it already wraps the UDC:
//
//   relayerAccount.deployContract({
//     classHash: MEDIAWALLET_CLASS_HASH,
//     constructorCalldata: ownerConstructorCalldata(ownerPubkey),
//     salt,
//   });
