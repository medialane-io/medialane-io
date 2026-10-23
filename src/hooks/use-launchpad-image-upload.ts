"use client";

import { uploadSizeError } from "@medialane/sdk";
import { requireSignedIn } from "@/lib/account-gate";
import { uploadImageToIpfs } from "@/lib/upload-image";
import { useSession } from "@/hooks/use-session";
import { useEffect, useRef, useState } from "react";

interface UseLaunchpadImageUploadOptions {
  allowedTypes?: string[];
  successMessage: string;
  failureMessage?: string;
  invalidTypeTitle?: string;
  invalidTypeDescription?: string;
}

export function useLaunchpadImageUpload({
  allowedTypes,
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
  const { session } = useSession();

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

    const sizeError = uploadSizeError(file, "image");
    if (sizeError) {
      setUploadError(sizeError);
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
      requireSignedIn(session);

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
