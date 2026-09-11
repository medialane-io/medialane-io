"use client";

export type SignedUploadKind = "image" | "document" | "media";

export async function uploadToSignedUrl(
  file: File,
  kind: SignedUploadKind,
  failureMessage: string,
): Promise<string> {
  const signedRes = await fetch(`/api/proxy/v1/metadata/signed-url?kind=${kind}`);
  const signed = (await signedRes.json().catch(() => ({}))) as {
    data?: { url?: string };
    error?: string;
  };
  const url = signed.data?.url;
  if (!signedRes.ok || !url) {
    throw new Error(signed.error ?? "Failed to prepare the upload");
  }

  const fd = new FormData();
  fd.append("file", file, file.name);
  fd.append("network", "public");
  fd.append("name", file.name);
  const up = await fetch(url, { method: "POST", body: fd });
  const data = (await up.json().catch(() => ({}))) as { data?: { cid?: string } };
  if (!up.ok || !data.data?.cid) {
    throw new Error(failureMessage);
  }
  return `ipfs://${data.data.cid}`;
}
