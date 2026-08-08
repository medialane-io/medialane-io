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

/**
 * The single implementation of "create/resume a passkey wallet, deploy it
 * via AVNU's sponsored paymaster, and sign in with SIWS" — used by both
 * /wallet-onboarding (fresh account) and the settings "generate a new
 * wallet" / "finish setup" paths (existing account, stranded local key).
 * Duplicating this per call site is exactly what let them drift out of
 * sync before (2026-08-07).
 *
 * Resumes an existing local sealed owner if present instead of creating a
 * new one — creating a fresh key here would orphan a stranded one with no
 * way to ever recover its signing key. Pass `forceNew: true` for the
 * deliberate "replace my wallet" escape hatch (settings), where a fresh
 * key is the point — callers doing that must authenticate as the
 * *current* wallet before calling this, since it overwrites the local
 * signer immediately, before any backend confirmation.
 */
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
  // Deploy MUST complete before SIWS — SIWS verify rejects counterfactual
  // (not-yet-deployed) accounts.
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
  // SIWS verify itself rejects counterfactual (undeployed) accounts, so
  // reaching this point proves the deploy is confirmed on-chain — the
  // safest point to tell useWalletNativeSession() to recheck isDeployed.
  // Without this, nothing invalidates that stale "not deployed" reading
  // from before this call started, and UndeployedWalletRedirect sends the
  // user right back here in a loop even after a genuinely successful setup.
  notifyWalletChange();

  return { sealed, siwsToken };
}
