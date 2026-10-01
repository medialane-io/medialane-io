import { typedData as starknetTypedData } from "starknet";
import { computeOwnerGuid, ownerAliveTypedData, signWithPrivateKey } from "@medialane/sdk/starknet";
import { getMedialaneClient } from "@/lib/medialane-client";
import { createOwnerKey, type CreatedOwner, type SealedOwner } from "./passkey";
import { saveSealedOwner, notifyWalletChange } from "./store";

const PROOF_TTL_SECONDS = 600;

type SetupParams = Parameters<ReturnType<typeof getMedialaneClient>["api"]["setupWalletKey"]>[0];

export interface WalletKeySetupDeps {
  createOwnerKey(): Promise<CreatedOwner>;
  setup(params: SetupParams): Promise<{ walletAddress: string }>;
  save(sealed: SealedOwner): void;
  now(): number;
}

const browserDeps: WalletKeySetupDeps = {
  createOwnerKey,
  setup: (params) => getMedialaneClient().api.setupWalletKey(params),
  save: (sealed) => {
    saveSealedOwner(sealed);
    notifyWalletChange();
  },
  now: () => Math.floor(Date.now() / 1000),
};

/** Creates the user's passkey and makes it the only owner of their account's wallet. */
export async function setupWalletKey(walletAddress: string, deps: WalletKeySetupDeps = browserDeps): Promise<void> {
  const { sealed, privateKeyHex } = await deps.createOwnerKey();
  const expiration = deps.now() + PROOF_TTL_SECONDS;
  const message = ownerAliveTypedData(computeOwnerGuid(sealed.ownerPubKey), expiration, "SN_MAIN");
  const signature = signWithPrivateKey(privateKeyHex, starknetTypedData.getMessageHash(message as never, walletAddress));

  const result = await deps.setup({ newOwnerPubkey: sealed.ownerPubKey, signature, expiration });
  deps.save({ ...sealed, address: result.walletAddress });
}
