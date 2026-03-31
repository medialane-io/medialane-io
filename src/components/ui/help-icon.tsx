"use client";

import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface HelpIconProps {
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

/**
 * Tap/click to reveal an explanation popover — works on mobile and desktop.
 * Place inline next to any element that needs contextual help.
 */
export function HelpIcon({ content, side = "top", className }: HelpIconProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Help"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center justify-center rounded-full text-muted-foreground/50 hover:text-muted-foreground active:text-muted-foreground transition-colors shrink-0 ${className ?? ""}`}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side={side} className="text-sm max-w-[220px] px-3 py-2.5 leading-snug">
        {content}
      </PopoverContent>
    </Popover>
  );
}
