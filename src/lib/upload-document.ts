"use client";

import { uploadFileToIpfs } from "@medialane/ui";

export async function uploadDocumentToIpfs(file: File): Promise<string> {
  return (await uploadFileToIpfs(file, "document")).uri;
}
