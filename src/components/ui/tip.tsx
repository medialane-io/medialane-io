"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ReactNode } from "react";

interface TipProps {
  /** Tooltip label — keep under ~60 chars */
  content: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * Thin wrapper around shadcn Tooltip.
 * Usage: <Tip content="Add to cart"><button>...</button></Tip>
 */
export function Tip({ content, children, side = "top" }: TipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}
