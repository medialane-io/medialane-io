"use client";

import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface AssetLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: string | null;
  alt: string;
}

export function AssetLightbox({ open, onOpenChange, image, alt }: AssetLightboxProps) {
  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="max-w-[96vw] w-fit max-h-none overflow-visible border-0 bg-transparent p-0 shadow-none"
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={alt}
            crossOrigin="anonymous"
            style={{ maxHeight: "92svh", maxWidth: "96vw" }}
            className="block h-auto w-auto object-contain rounded-2xl"
          />
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/55 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/75 hover:text-white hover:bg-black/80 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
