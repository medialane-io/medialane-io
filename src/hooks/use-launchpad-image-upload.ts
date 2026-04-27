"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageSelect = async (file: File) => {
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      toast.error(invalidTypeTitle, { description: invalidTypeDescription });
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error("Image too large", {
        description: `Max ${maxSizeMb} MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      });
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
      const signedRes = await fetch("/api/pinata/signed-url", { method: "POST" });
      const signedData = await signedRes.json();
      const uploadUrl = signedData?.url;
      if (!signedRes.ok || !uploadUrl) throw new Error("Failed to get upload URL");

      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("network", "public");
      formData.append("name", file.name);

      const uploadRes = await fetch(uploadUrl, { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData?.data?.cid) throw new Error("Upload failed");

      setImageUri(`ipfs://${uploadData.data.cid}`);
      toast.success(successMessage);
    } catch (error) {
      setImageUri(null);
      toast.error(failureMessage, {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setImageUploading(false);
    }
  };

  return {
    imageFile,
    imagePreview,
    imageUri,
    imageUploading,
    fileInputRef,
    setImagePreview,
    setImageUri,
    handleImageSelect,
    clearImage,
  };
}
