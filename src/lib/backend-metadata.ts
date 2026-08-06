import "server-only";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

/**
 * Server-only calls to medialane-backend's `/v1/metadata/*` — the metered
 * Pinata upload path. io holds no Pinata credential of its own; every
 * upload goes through here so it's tracked against the tenant API key,
 * same as every other write in the app.
 */

function backendUrl(path: string): string {
  return `${MEDIALANE_BACKEND_URL.replace(/\/$/, "")}/v1/metadata/${path}`;
}

function apiKeyHeaders(extra?: Record<string, string>): Record<string, string> {
  return { "x-api-key": MEDIALANE_API_KEY, ...extra };
}

export interface BackendUploadResult {
  cid: string;
  uri: string;
}

/** POST /v1/metadata/upload — pin an arbitrary JSON object, returns its ipfs:// URI. */
export async function uploadJsonToBackend(json: unknown): Promise<BackendUploadResult> {
  const res = await fetch(backendUrl("upload"), {
    method: "POST",
    headers: apiKeyHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(json),
  });
  const data = (await res.json().catch(() => ({}))) as { data?: { cid: string; url: string }; error?: string };
  if (!res.ok || !data.data) throw new Error(data.error ?? "Metadata upload failed");
  return { cid: data.data.cid, uri: data.data.url };
}

/** POST /v1/metadata/upload-file — pin a single media file, returns its ipfs:// URI. */
export async function uploadFileToBackend(file: File): Promise<BackendUploadResult> {
  const form = new FormData();
  form.append("file", file, file.name);
  const res = await fetch(backendUrl("upload-file"), {
    method: "POST",
    headers: apiKeyHeaders(),
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as { data?: { cid: string; url: string }; error?: string };
  if (!res.ok || !data.data) throw new Error(data.error ?? "File upload failed");
  return { cid: data.data.cid, uri: data.data.url };
}

/** POST /v1/metadata/upload-directory — pin named JSON files together under one folder CID. */
export async function uploadDirectoryToBackend(
  files: { name: string; content: unknown }[],
): Promise<{ cid: string; baseUri: string }> {
  const res = await fetch(backendUrl("upload-directory"), {
    method: "POST",
    headers: apiKeyHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ files }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    data?: { cid: string; baseUri: string };
    error?: string;
  };
  if (!res.ok || !data.data) throw new Error(data.error ?? "Directory pin failed");
  return data.data;
}

/** GET /v1/metadata/signed-url — a short-lived signed Pinata upload URL for large files. */
export async function getBackendSignedUrl(kind: "image" | "document" = "image"): Promise<string> {
  const res = await fetch(`${backendUrl("signed-url")}?kind=${kind}`, {
    method: "GET",
    headers: apiKeyHeaders(),
  });
  const data = (await res.json().catch(() => ({}))) as { data?: { url: string }; error?: string };
  if (!res.ok || !data.data) throw new Error(data.error ?? "Failed to create upload URL");
  return data.data.url;
}
