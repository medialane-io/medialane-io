"use client";

import { withSiwsAuth } from "@/lib/pinata-fetch";

export async function uploadImageToIpfs(file: File, siwsToken: string): Promise<string> {
  const signedRes = await fetch("/api/pinata/signed-url", withSiwsAuth(siwsToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "image" }),
  }));
  const signed = (await signedRes.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!signedRes.ok || !signed.url) {
    throw new Error(signed.error ?? "Failed to prepare the upload");
  }

  const fd = new FormData();
  fd.append("file", file, file.name);
  fd.append("network", "public");
  fd.append("name", file.name);
  const up = await fetch(signed.url, { method: "POST", body: fd });
  const data = (await up.json().catch(() => ({}))) as { data?: { cid?: string } };
  if (!up.ok || !data.data?.cid) {
    throw new Error("Image upload to IPFS failed");
  }
  return `ipfs://${data.data.cid}`;
}
