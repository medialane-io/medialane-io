import "server-only";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

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

export async function getBackendSignedUrl(kind: "image" | "document" = "image"): Promise<string> {
  const res = await fetch(`${backendUrl("signed-url")}?kind=${kind}`, {
    method: "GET",
    headers: apiKeyHeaders(),
  });
  const data = (await res.json().catch(() => ({}))) as { data?: { url: string }; error?: string };
  if (!res.ok || !data.data) throw new Error(data.error ?? "Failed to create upload URL");
  return data.data.url;
}
