import { num, type Call } from "starknet";
import { norm } from "./account-ops";
import type { SealedOwner } from "./passkey";
import { walletProvider } from "./provider";
import { executeSponsored } from "./sponsored-invoke";

const SIGNER_TYPE_NAMES = ["Starknet", "Secp256k1", "Secp256r1"] as const;
type SignerTypeName = (typeof SIGNER_TYPE_NAMES)[number];

export interface GuardianInfo {
  type: SignerTypeName;
  guid: string;
  storedValue: string;
}

function encodeFeltArray(items: string[]): string[] {
  return [num.toHex(items.length), ...items];
}

function encodeStarknetSigner(pubkey: string): string[] {
  return ["0x0", num.toHex(pubkey)];
}

function encodeStarknetSignerArray(pubkeys: string[]): string[] {
  return [num.toHex(pubkeys.length), ...pubkeys.flatMap(encodeStarknetSigner)];
}

export function buildSetFirstGuardianCall(address: string, guardianPubkey: string): Call {
  return {
    contractAddress: norm(address),
    entrypoint: "change_guardians",
    calldata: [...encodeFeltArray([]), ...encodeStarknetSignerArray([guardianPubkey])],
  };
}

export function buildTriggerEscapeOwnerCall(targetAddress: string, newOwnerPubkey: string): Call {
  return {
    contractAddress: norm(targetAddress),
    entrypoint: "trigger_escape_owner",
    calldata: encodeStarknetSigner(newOwnerPubkey),
  };
}

export function buildCompleteEscapeOwnerCall(targetAddress: string): Call {
  return { contractAddress: norm(targetAddress), entrypoint: "escape_owner", calldata: [] };
}

export function buildCancelEscapeCall(address: string): Call {
  return { contractAddress: norm(address), entrypoint: "cancel_escape", calldata: [] };
}

export function decodeGuardiansInfo(res: string[]): GuardianInfo[] {
  const len = Number(res[0]);
  const out: GuardianInfo[] = [];
  for (let i = 0; i < len; i++) {
    const base = 1 + i * 3;
    out.push({
      type: SIGNER_TYPE_NAMES[Number(res[base])] ?? "Starknet",
      guid: res[base + 1],
      storedValue: res[base + 2],
    });
  }
  return out;
}

export type EscapeTypeName = "None" | "Guardian" | "Owner";
export type EscapeStatusName = "None" | "NotReady" | "Ready" | "Expired";
const ESCAPE_TYPE_NAMES: EscapeTypeName[] = ["None", "Guardian", "Owner"];
const ESCAPE_STATUS_NAMES: EscapeStatusName[] = ["None", "NotReady", "Ready", "Expired"];

export interface EscapeInfo {
  readyAt: number;
  escapeType: EscapeTypeName;
  status: EscapeStatusName;
}

export function decodeEscapeAndStatus(res: string[]): EscapeInfo {
  const readyAt = Number(res[0]);
  const escapeType = ESCAPE_TYPE_NAMES[Number(res[1])] ?? "None";
  const optionTag = Number(res[2]);
  const statusIndex = optionTag === 0 ? 5 : 3;
  const status = ESCAPE_STATUS_NAMES[Number(res[statusIndex])] ?? "None";
  return { readyAt, escapeType, status };
}

export async function getGuardians(address: string, rpc?: string): Promise<GuardianInfo[]> {
  const res = await walletProvider(rpc).callContract({
    contractAddress: norm(address),
    entrypoint: "get_guardians_info",
    calldata: [],
  });
  return decodeGuardiansInfo(res);
}

export async function getEscape(address: string, rpc?: string): Promise<EscapeInfo> {
  const res = await walletProvider(rpc).callContract({
    contractAddress: norm(address),
    entrypoint: "get_escape_and_status",
    calldata: [],
  });
  return decodeEscapeAndStatus(res);
}

export async function getEscapeSecurityPeriod(address: string, rpc?: string): Promise<number> {
  const res = await walletProvider(rpc).callContract({
    contractAddress: norm(address),
    entrypoint: "get_escape_security_period",
    calldata: [],
  });
  return Number(res[0]);
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
