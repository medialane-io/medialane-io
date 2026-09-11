"use client";

import { uploadToSignedUrl } from "@/lib/signed-upload";

export async function uploadImageToIpfs(file: File): Promise<string> {
  return uploadToSignedUrl(file, "image", "Image upload to IPFS failed");
}
