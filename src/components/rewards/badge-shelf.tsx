"use client";

import dynamicImport from "next/dynamic";
import type { LucideProps } from "lucide-react";
import type { BadgeSummary } from "@/hooks/use-rewards";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Lazily resolve lucide icons by name at runtime
const iconCache = new Map<string, React.ComponentType<LucideProps>>();

function BadgeIcon({ name, color, className }: { name: string; color: string; className?: string }) {
  const [Icon, setIcon] = React.useState<React.ComponentType<LucideProps> | null>(
    () => iconCache.get(name) ?? null
  );

  React.useEffect(() => {
    if (iconCache.has(name)) {
      setIcon(() => iconCache.get(name)!);
      return;
    }
    import("lucide-react").then((mod) => {
      const C = (mod as Record<string, unknown>)[name] as React.ComponentType<LucideProps> | undefined;
      if (C) {
        iconCache.set(name, C);
        setIcon(() => C);
      }
    });
  }, [name]);

  if (!Icon) return <span className={cn("h-5 w-5 rounded-full", className)} style={{ backgroundColor: color }} />;
  return <Icon className={cn("h-5 w-5", className)} style={{ color }} />;
}

import React from "react";

interface BadgeShelfProps {
  badges: BadgeSummary[];
  className?: string;
}

export function BadgeShelf({ badges, className }: BadgeShelfProps) {
  if (badges.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-wrap gap-2", className)}>
        {badges.map((badge) => (
          <Tooltip key={badge.key}>
            <TooltipTrigger asChild>
              <div
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-full border cursor-default select-none"
                style={{
                  borderColor: `${badge.color}60`,
                  backgroundColor: `${badge.color}14`,
                }}
              >
                <BadgeIcon name={badge.icon} color={badge.color} className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs font-semibold" style={{ color: badge.color }}>
                  {badge.name}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px] text-center text-xs">
              {badge.description}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
