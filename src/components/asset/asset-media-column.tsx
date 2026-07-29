"use client";

import { motion } from "framer-motion";
import { useIntersectionActive } from "@medialane/ui";

interface AssetMediaColumnProps {
  shouldReduce: boolean;
  image: string | null;
  imageAlt: string;
  imgError: boolean;
  onImageError: () => void;
  fallback: React.ReactNode;
  /** Opens the full-screen lightbox (wired in B3). */
  onZoom?: () => void;
  /** Resolved animation_url — the live on-chain renderer, if any. */
  animationUrl?: string | null;
  /** Caller-computed eligibility for the living-render treatment. */
  live?: boolean;
}

/**
 * Story-first asset media — borderless, respects the work's real aspect ratio
 * (no forced 1:1), capped to the viewport so it always fits on screen. Click
 * opens the lightbox. Replaces the framed `@medialane/ui` media column on the
 * standard asset page (foundations §III: image leads, no border clutter).
 *
 * `live`-eligible tokens (a small partner allowlist, see @medialane/ui's
 * living-render-collections) swap the static image for a sandboxed iframe of
 * the token's own on-chain animation_url once the media scrolls into view —
 * see medialane-core/docs/specs/2026-07-28-gol-starknet-living-render-design.md.
 */
export function AssetMediaColumn({
  shouldReduce,
  image,
  imageAlt,
  imgError,
  onImageError,
  fallback,
  onZoom,
  animationUrl,
  live = false,
}: AssetMediaColumnProps) {
  const [ref, isVisible] = useIntersectionActive<HTMLDivElement>();
  const showLive = live && !!animationUrl && isVisible;

  return (
    <div ref={ref} className="w-full">
      {showLive ? (
        <div className="w-full overflow-hidden rounded-3xl aspect-square">
          <iframe
            src={animationUrl!}
            title={imageAlt}
            sandbox="allow-scripts"
            loading="lazy"
            className="w-full h-full border-0"
          />
        </div>
      ) : !image || imgError ? (
        <div className="w-full overflow-hidden rounded-3xl">{fallback}</div>
      ) : (
        <motion.button
          type="button"
          onClick={onZoom}
          aria-label="View full image"
          initial={shouldReduce ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="group block w-full overflow-hidden rounded-3xl cursor-zoom-in focus:outline-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={imageAlt}
            crossOrigin="anonymous"
            onError={onImageError}
            className="w-full h-auto max-h-[80vh] object-contain
                       transition duration-300 group-hover:opacity-95 group-active:scale-[0.99]"
          />
        </motion.button>
      )}
    </div>
  );
}
