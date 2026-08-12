"use client";

import { CreatorScoreInline as CreatorScoreInlineBase } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";

interface CreatorScoreInlineProps {
  address: string | null | undefined;
  size?: "sm" | "md" | "lg";
  showBadges?: boolean;
  maxBadges?: number;
  className?: string;
}

export function CreatorScoreInline(props: CreatorScoreInlineProps) {
  return <CreatorScoreInlineBase getClient={getMedialaneClient} {...props} />;
}
