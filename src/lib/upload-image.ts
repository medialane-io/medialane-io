"use client";

import { uploadFileToIpfs } from "@medialane/ui";

export async function uploadImageToIpfs(file: File): Promise<string> {
  return (await uploadFileToIpfs(file, "image")).uri;
}
