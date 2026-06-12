"use client";

/** Uploads an IP-type document file to IPFS via the Clerk-gated Pinata route.
 *  Resolves to the ipfs:// URI stored as the "Document File" trait. */
export async function uploadDocumentToIpfs(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file, file.name);
  const res = await fetch("/api/pinata/file", { method: "POST", body: fd });
  const data = (await res.json().catch(() => ({}))) as { uri?: string; error?: string };
  if (!res.ok || !data.uri) throw new Error(data.error ?? "Document upload failed");
  return data.uri;
}
