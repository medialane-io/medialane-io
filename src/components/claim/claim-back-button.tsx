"use client";

import { useRouter } from "@medialane/ui/router";
import { ArrowLeft } from "lucide-react";
import { useT } from "@medialane/ui/i18n";

export function ClaimBackButton() {
  const t = useT();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/claim"))}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {t("Back")}
    </button>
  );
}
