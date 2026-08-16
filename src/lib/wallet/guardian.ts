import type { SealedOwner } from "./passkey";
import { executeSponsored } from "./sponsored-invoke";
import { walletProvider } from "./provider";
import { norm } from "./account-ops";
import {
  buildSetFirstGuardianCall,
  buildTriggerEscapeOwnerCall,
  buildCompleteEscapeOwnerCall,
  buildCancelEscapeCall,
  getGuardians as sdkGetGuardians,
  getEscape as sdkGetEscape,
  getEscapeSecurityPeriod as sdkGetEscapeSecurityPeriod,
  type GuardianInfo,
  type EscapeInfo,
} from "@medialane/sdk/starknet";

export type { GuardianInfo, EscapeInfo } from "@medialane/sdk/starknet";
export {
  buildSetFirstGuardianCall,
  buildTriggerEscapeOwnerCall,
  buildCompleteEscapeOwnerCall,
  buildCancelEscapeCall,
} from "@medialane/sdk/starknet";

export async function getGuardians(address: string, rpc?: string): Promise<GuardianInfo[]> {
  return sdkGetGuardians(walletProvider(rpc), address);
}

export async function getEscape(address: string, rpc?: string): Promise<EscapeInfo> {
  return sdkGetEscape(walletProvider(rpc), address);
}

export async function getEscapeSecurityPeriod(address: string, rpc?: string): Promise<number> {
  return sdkGetEscapeSecurityPeriod(walletProvider(rpc), address);
}

export async function setFirstGuardian(sealed: SealedOwner, guardianPubkey: string) {
  const { transactionHash } = await executeSponsored(sealed, [
    buildSetFirstGuardianCall(sealed.address, guardianPubkey),
  ]);
  return transactionHash;
}

export async function triggerEscapeOwner(
  guardianSealed: SealedOwner,
  targetAddress: string,
  newOwnerPubkey: string,
) {
  const { transactionHash } = await executeSponsored(
    guardianSealed,
    [buildTriggerEscapeOwnerCall(targetAddress, newOwnerPubkey)],
    norm(targetAddress),
  );
  return transactionHash;
}

export async function completeEscapeOwner(guardianSealed: SealedOwner, targetAddress: string) {
  const { transactionHash } = await executeSponsored(
    guardianSealed,
    [buildCompleteEscapeOwnerCall(targetAddress)],
    norm(targetAddress),
  );
  return transactionHash;
}

export async function cancelEscape(sealed: SealedOwner) {
  const { transactionHash } = await executeSponsored(sealed, [buildCancelEscapeCall(sealed.address)]);
  return transactionHash;
}
