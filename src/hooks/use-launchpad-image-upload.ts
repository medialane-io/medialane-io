"use client";

import { uploadImageToIpfs } from "@/lib/upload-image";
import { useEffect, useRef, useState } from "react";

interface UseLaunchpadImageUploadOptions {
  allowedTypes?: string[];
  maxSizeMb?: number;
  successMessage: string;
  failureMessage?: string;
  invalidTypeTitle?: string;
  invalidTypeDescription?: string;
}

export function useLaunchpadImageUpload({
  allowedTypes,
  maxSizeMb = 10,
  successMessage,
  failureMessage = "Image upload failed",
  invalidTypeTitle = "Unsupported format",
  invalidTypeDescription,
}: UseLaunchpadImageUploadOptions) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUri(null);
    setUploadError(null);
    setUploadSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageSelect = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    if (allowedTypes && !allowedTypes.includes(file.type)) {
      setUploadError(
        invalidTypeDescription
          ? `${invalidTypeTitle}: ${invalidTypeDescription}`
          : invalidTypeTitle
      );
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      setUploadError(`Image too large — max ${maxSizeMb} MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`);
      return;
    }

    setImageFile(file);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);

    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setImagePreview(objectUrl);
    setImageUri(null);
    setImageUploading(true);

    try {
      // Signed-url upload — straight to Pinata, bypasses Vercel's ~4.5 MB body cap.
      // IPFS pinning is an external service with occasional slow spells — cap the
      // wait so the user gets a retry prompt instead of an endless spinner.
      const uri = await Promise.race([
        uploadImageToIpfs(file),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("the image service is slow right now — please try again")), 60_000),
        ),
      ]);

      setImageUri(uri);
      setUploadSuccess(successMessage);
    } catch (error) {
      setImageUri(null);
      const msg = error instanceof Error ? error.message : undefined;
      setUploadError(msg ? `${failureMessage}: ${msg}` : failureMessage);
    } finally {
      setImageUploading(false);
    }
  };

  return {
    imageFile,
    imagePreview,
    imageUri,
    imageUploading,
    uploadError,
    uploadSuccess,
    fileInputRef,
    setImagePreview,
    setImageUri,
    handleImageSelect,
    clearImage,
  };
}
