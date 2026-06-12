"use client";

/** Uploads an image to IPFS via a Pinata signed upload URL.
 *
 *  Two-step: the Clerk-gated /api/pinata/signed-url route issues a short-lived
 *  signed URL, then the browser uploads the file STRAIGHT to Pinata — the bytes
 *  never touch our server. Vercel 413s request bodies over ~4.5 MB, so the old
 *  direct-proxy routes silently broke for larger images.
 *
 *  Resolves to the ipfs:// URI. */
export async function uploadImageToIpfs(file: File): Promise<string> {
  const signedRes = await fetch("/api/pinata/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "image" }),
  });
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
