"use client";

import { useEffect, useRef } from "react";

export function useWhenChanged(value: unknown, effect: () => void): void {
  const latest = useRef(effect);
  latest.current = effect;
  useEffect(() => {
    latest.current();
  }, [value]);
}
