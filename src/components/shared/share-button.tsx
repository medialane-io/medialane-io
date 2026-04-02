"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  url?: string;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
}

export function ShareButton({ title, url, variant = "outline", size = "sm", className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
      } catch {
        // User cancelled — ignore
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleShare} className={className}>
      {copied
        ? <Check className="h-3.5 w-3.5 text-emerald-500" />
        : <Share2 className="h-3.5 w-3.5" />
      }
      {size !== "icon" && (
        <span className="ml-1.5">{copied ? "Copied" : "Share"}</span>
      )}
    </Button>
  );
}
