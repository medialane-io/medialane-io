"use client";

import { useEffect, useRef } from "react";

/** Runs `effect` after mount and whenever `value` changes, always using the latest `effect`. */
export function useWhenChanged(value: unknown, effect: () => void): void {
  const latest = useRef(effect);
  latest.current = effect;
  useEffect(() => {
    latest.current();
  }, [value]);
}
