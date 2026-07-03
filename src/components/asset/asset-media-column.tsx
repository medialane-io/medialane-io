"use client";

import { motion } from "framer-motion";

interface AssetMediaColumnProps {
  shouldReduce: boolean;
  image: string | null;
  imageAlt: string;
  imgError: boolean;
  onImageError: () => void;
  fallback: React.ReactNode;
  /** Opens the full-screen lightbox (wired in B3). */
  onZoom?: () => void;
}

/**
 * Story-first asset media — borderless, respects the work's real aspect ratio
 * (no forced 1:1), capped to the viewport so it always fits on screen. Click
 * opens the lightbox. Replaces the framed `@medialane/ui` media column on the
 * standard asset page (foundations §III: image leads, no border clutter).
 */
export function AssetMediaColumn({
  shouldReduce,
  image,
  imageAlt,
  imgError,
  onImageError,
  fallback,
  onZoom,
}: AssetMediaColumnProps) {
  if (!image || imgError) {
    return <div className="w-full overflow-hidden rounded-2xl">{fallback}</div>;
  }

  return (
    <motion.button
      type="button"
      onClick={onZoom}
      aria-label="View full image"
      initial={shouldReduce ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="group block w-full cursor-zoom-in focus:outline-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt={imageAlt}
        crossOrigin="anonymous"
        onError={onImageError}
        className="w-full h-auto max-h-[80vh] object-contain rounded-2xl
                   transition duration-300 group-hover:opacity-95 group-active:scale-[0.99]"
      />
    </motion.button>
  );
}
