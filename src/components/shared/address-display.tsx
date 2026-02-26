"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { shortenAddress } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AddressDisplayProps {
  address: string;
  className?: string;
  chars?: number;
  showCopy?: boolean;
}

export function AddressDisplay({ address, className, chars = 4, showCopy = true }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className={cn("inline-flex items-center gap-1 font-mono text-sm", className)}>
      {shortenAddress(address, chars)}
      {showCopy && (
        <button
          onClick={handleCopy}
          className="opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Copy address"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
        </button>
      )}
    </span>
  );
}
