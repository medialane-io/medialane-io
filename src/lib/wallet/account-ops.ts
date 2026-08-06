import { Account, validateAndParseAddress, type Call } from "starknet";
import { normalizeAddress, getTokenBySymbol } from "@medialane/sdk";
import { MEDIAWALLET_CLASS_HASH, ownerConstructorCalldata } from "./account";
import { unlockOwnerKey, type SealedOwner } from "./passkey";
import { walletProvider } from "./provider";

export const norm = (address: string): string => normalizeAddress("STARKNET", address);

export function isValidStarknetAddress(address: string): boolean {
  try {
    validateAndParseAddress(address.trim());
    return true;
  } catch {
    return false;
  }
}

const tokenAddress = (symbol: string): string => getTokenBySymbol(symbol)!.address;

export const STRK_TOKEN = tokenAddress("STRK");
export const ETH_TOKEN = tokenAddress("ETH");
export const USDC_TOKEN = tokenAddress("USDC");

export async function accountFor(sealed: SealedOwner, rpc?: string): Promise<Account> {
  const signer = await unlockOwnerKey(sealed);
  // starknet@6.24.1's Account constructor is positional, not object-form —
  // media-wallet's starknet@10 uses `new Account({ provider, address, signer,
  // cairoVersion })`; io's installed major version does not accept that shape.
  return new Account(walletProvider(rpc), sealed.address, signer, "1");
}

export async function isDeployed(address: string, rpc?: string): Promise<boolean> {
  try {
    await walletProvider(rpc).getClassHashAt(norm(address));
    return true;
  } catch {
    return false;
  }
}

export async function deploySelf(sealed: SealedOwner, rpc?: string) {
  const account = await accountFor(sealed, rpc);
  return account.deployAccount({
    classHash: MEDIAWALLET_CLASS_HASH,
    constructorCalldata: ownerConstructorCalldata(sealed.ownerPubKey),
    addressSalt: 0,
    contractAddress: sealed.address,
  });
}

export async function execute(sealed: SealedOwner, calls: Call[], rpc?: string) {
  const account = await accountFor(sealed, rpc);
  return account.execute(calls);
}
