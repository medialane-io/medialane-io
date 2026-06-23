"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Generic back: returns to wherever the user came from (launchpad card,
 *  /claim hub, etc.), falling back to the claims hub on a cold load. */
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
