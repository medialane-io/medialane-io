"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface AssetLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: string | null;
  alt: string;
}

/**
 * Full-screen view of the asset's original image. Borderless, object-contain,
 * closes on overlay click / Esc (shadcn Dialog defaults).
 */
export function AssetLightbox({ open, onOpenChange, image, alt }: AssetLightboxProps) {
  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-fit border-0 bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={alt}
          crossOrigin="anonymous"
          className="max-h-[92vh] max-w-[96vw] h-auto w-auto object-contain rounded-xl"
        />
      </DialogContent>
    </Dialog>
  );
}
