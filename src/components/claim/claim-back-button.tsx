"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function ClaimBackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/claim"))}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back
    </button>
  );
}
