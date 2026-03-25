"use client";

/**
 * useDominantColor — extracts the dominant color from an image URL.
 *
 * Uses fast-average-color (ref-based via useEffect, NOT URL-based).
 * Renders a hidden <img crossOrigin="anonymous"> for canvas extraction.
 * Image URL must be a gateway-resolved HTTP(S) URL (ipfsToHttp applied upstream).
 *
 * CSS variable convention: returned HSL strings are bare (no hsl() wrapper).
 * Usage: hsl(var(--dynamic-primary)), hsl(var(--dynamic-accent)), etc.
 */

import { useRef, useState, useEffect } from "react";
import { FastAverageColor } from "fast-average-color";
import { buildDynamicTheme } from "@/lib/theme-utils";
import { useTheme } from "next-themes";
import type { DynamicTheme } from "@/lib/theme-utils";

export interface DominantColorResult {
  hex: string;
  isDark: boolean;
  isReady: boolean;
  error: boolean;
  dynamicTheme: DynamicTheme | null;
  /** Attach this ref to a hidden <img> element with crossOrigin="anonymous" */
  // React's <img ref> typing expects RefObject<HTMLImageElement> (not null).
  // Internally the ref is initialized to null at runtime.
  imgRef: React.RefObject<HTMLImageElement>;
}

const fac = new FastAverageColor();

export function useDominantColor(
  imageUrl: string | null | undefined
): DominantColorResult {
  // `useRef` is null until React mounts; we cast for correct ref prop typing.
  const imgRef = useRef<HTMLImageElement>(null as unknown as HTMLImageElement);
  const { resolvedTheme } = useTheme();
  const userIsDarkMode = resolvedTheme === "dark";

  const [hex, setHex] = useState("#9333ea");
  const [isDark, setIsDark] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;
    setIsReady(false);
    setHasError(false);

    const img = imgRef.current as HTMLImageElement | null;
    if (!img) return;

    const extract = () => {
      fac
        .getColorAsync(img, { crossOrigin: "anonymous" })
        .then((color) => {
          setHex(color.hex);
          setIsDark(color.isDark);
          setIsReady(true);
        })
        .catch(() => {
          setHasError(true);
          setIsReady(false);
        });
    };

    if (img.complete && img.naturalWidth > 0) {
      extract();
    } else {
      img.addEventListener("load", extract, { once: true });
      img.addEventListener(
        "error",
        () => {
          setHasError(true);
        },
        { once: true }
      );
    }
  }, [imageUrl]);

  const dynamicTheme = isReady
    ? buildDynamicTheme(hex, isDark, userIsDarkMode)
    : null;

  return { hex, isDark, isReady, error: hasError, dynamicTheme, imgRef };
}
