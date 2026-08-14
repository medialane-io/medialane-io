import { typedData as starknetTypedData } from "starknet";
import { requestSiwsToken } from "@medialane/sdk/starknet";
import { createOwnerKey, signWith, signWithPrivateKey, unlockOwnerKey, type SealedOwner } from "./passkey";
import { loadSealedOwner, saveSealedOwner, notifyWalletChange } from "./store";
import { deployWalletSponsored } from "./deploy-relay";

export type DeploymentStep = "creating-passkey" | "deploying" | "signing-in";

export interface CompleteWalletDeploymentResult {
  sealed: SealedOwner;
  siwsToken: string;
}

export async function completeWalletDeployment(
  onStep: (step: DeploymentStep) => void,
  options: { forceNew?: boolean } = {},
): Promise<CompleteWalletDeploymentResult> {
  let sealed: SealedOwner | null = options.forceNew ? null : loadSealedOwner();
  let freshPrivateKey: string | null = null;
  if (!sealed) {
    onStep("creating-passkey");
    const created = await createOwnerKey();
    sealed = created.sealed;
    freshPrivateKey = created.privateKeyHex;
    saveSealedOwner(sealed);
  }

  onStep("deploying");

  await deployWalletSponsored(
    sealed.address,
    sealed.ownerPubKey,
    freshPrivateKey ?? (await unlockOwnerKey(sealed)),
  );

  onStep("signing-in");
  const siwsToken = await requestSiwsToken({
    backendUrl: "/api/proxy",
    walletAddress: sealed.address,
    signer: {
      signMessage: async (td) => {
        const msgHash = starknetTypedData.getMessageHash(td, sealed!.address);
        return freshPrivateKey
          ? signWithPrivateKey(freshPrivateKey, msgHash)
          : signWith(sealed!, msgHash);
      },
    },
  });

  notifyWalletChange();

  return { sealed, siwsToken };
}
