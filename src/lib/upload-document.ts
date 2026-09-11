"use client";

import { uploadToSignedUrl } from "@/lib/signed-upload";

export async function uploadDocumentToIpfs(file: File): Promise<string> {
  return uploadToSignedUrl(file, "document", "Document upload to IPFS failed");
}
