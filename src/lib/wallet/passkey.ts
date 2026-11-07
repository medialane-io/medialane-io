import type { RecoveryKey } from "@medialane/sdk/starknet";
import { passkeyOwner } from "./client";

export type { SealedOwner } from "@medialane/sdk/starknet";

export const createOwnerKey = () => passkeyOwner.createOwnerKey();
export const unlockOwnerKey = (sealed: Parameters<typeof passkeyOwner.unlockOwnerKey>[0]) =>
  passkeyOwner.unlockOwnerKey(sealed);
export const sealImportedOwnerKey = (recovery: RecoveryKey) => passkeyOwner.sealImportedOwnerKey(recovery);
