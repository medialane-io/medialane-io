export async function deployWalletViaRelay(
  ownerPubkey: string,
  salt: string = "0x0",
): Promise<{ address: string; alreadyDeployed: boolean }> {
  const res = await fetch("/api/proxy/v1/wallet/deploy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerPubkey, salt }),
  });
  if (!res.ok) {
    throw new Error(`Wallet deploy failed (${res.status})`);
  }
  const body = (await res.json()) as { data: { address: string; alreadyDeployed: boolean } };
  return body.data;
}
