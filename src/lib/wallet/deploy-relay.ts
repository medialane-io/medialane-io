import { Account, stark } from "starknet";
import { walletProvider } from "./provider";

/**
 * Deploys a new wallet gaslessly via AVNU's sponsored paymaster — replaces
 * the old relayer+UDC deploy (see design spec
 * 2026-08-05-medialane-io-wallet-native-frictionless-design.md §3.3, the
 * 2026-08-07 correction, for why). Two round-trips to io's own API routes
 * (never AVNU directly — the API key stays server-side) bracket one local
 * signature: build the sponsored transaction, sign it with the
 * passkey-derived key, execute it.
 */
export async function deployWalletSponsored(
  ownerAddress: string,
  ownerPubkey: string,
  privateKeyHex: string,
  salt = "0x0",
): Promise<{ transactionHash: string }> {
  const buildRes = await fetch("/api/wallet/deploy-sponsored/build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerPubkey, ownerAddress, salt }),
  });
  if (!buildRes.ok) throw new Error(`Sponsored deploy build failed (${buildRes.status})`);
  const { typedData, deployment } = (await buildRes.json()) as { typedData: object; deployment: object };

  const account = new Account({
    provider: walletProvider(),
    address: ownerAddress,
    signer: privateKeyHex,
    cairoVersion: "1",
  });
  const rawSignature = await account.signMessage(typedData as never);
  // signMessage() can return either a plain string array or a
  // WeierstrassSignatureType object ({r, s, ...}) depending on the signer —
  // a raw-private-key signer returns the latter. Array.from() over that
  // silently yields [] with no error (reproduced live 2026-08-07). Use
  // starknet.js's own signatureToHexArray, which handles both shapes.
  const signature = stark.signatureToHexArray(rawSignature);

  const executeRes = await fetch("/api/wallet/deploy-sponsored/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerAddress, typedData, signature, deployment }),
  });
  if (!executeRes.ok) throw new Error(`Sponsored deploy execute failed (${executeRes.status})`);
  const { transactionHash } = (await executeRes.json()) as { transactionHash: string };
  return { transactionHash };
}
