"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@medialane/ui/button";
import { useT } from "@medialane/ui/i18n";

export function CopyLinkButton({ url, label = "Copy link" }: { url: string; label?: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
      {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
      {copied ? t("Copied") : label}
    </Button>
  );
}
