"use client";

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
      const formData = new FormData();
      formData.append("file", file, file.name);

      const uploadRes = await fetch("/api/pinata/image", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData?.imageUri) throw new Error(uploadData?.error || "Upload failed");

      setImageUri(uploadData.imageUri);
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
