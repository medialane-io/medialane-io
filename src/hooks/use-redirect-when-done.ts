"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@medialane/ui/router";

const CELEBRATION_MS = 1600;

export function useRedirectWhenDone(target: string) {
  const router = useRouter();
  const [celebrated, setCelebrated] = useState<boolean | null>(null);

  useEffect(() => {
    if (celebrated === null) return;
    const timer = setTimeout(() => router.replace(target), celebrated ? CELEBRATION_MS : 0);
    return () => clearTimeout(timer);
  }, [celebrated, router, target]);

  return useCallback((result: { celebrated: boolean }) => setCelebrated(result.celebrated), []);
}
