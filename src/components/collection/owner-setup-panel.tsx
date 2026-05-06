"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiCollectionProfile } from "@medialane/sdk";

interface SetupItem {
  label: string;
  done: boolean;
}

interface OwnerSetupPanelProps {
  contract: string;
  profile: ApiCollectionProfile | null;
}

export function OwnerSetupPanel({ contract, profile }: OwnerSetupPanelProps) {
  const items: SetupItem[] = [
    { label: "Display name",      done: !!profile?.displayName },
    { label: "Description",       done: !!profile?.description },
    { label: "Cover image",       done: !!profile?.image },
    { label: "Banner image",      done: !!profile?.bannerImage },
    { label: "Social links",      done: !!(profile?.twitterUrl || profile?.discordUrl || profile?.websiteUrl) },
    { label: "Exclusive content", done: !!profile?.hasGatedContent },
  ];

  const doneCount = items.filter((i) => i.done).length;

  if (doneCount === items.length) return null;

  return (
    <div className="mx-4 sm:mx-6 mt-3 rounded-2xl border border-border bg-card/80 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Set up your collection</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {doneCount}/{items.length} complete
        </span>
      </div>

      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full btn-border-animated transition-all duration-500"
          style={{ width: `${(doneCount / items.length) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {items.map(({ label, done }) => (
          <div key={label} className="flex items-center gap-1.5">
            {done ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            )}
            <span className={cn("text-xs", done ? "text-muted-foreground line-through" : "text-foreground")}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <Link
        href={`/portfolio/collections/${contract}/settings`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <Sparkles className="h-3 w-3" />
        Complete your collection profile
      </Link>
    </div>
  );
}
