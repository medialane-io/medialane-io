"use client";

import type { ReactNode } from "react";
import { Bot, DollarSign, GitBranch, Globe } from "lucide-react";
import { licenseSummary } from "@/lib/license-summary";

type AssetAttribute = { trait_type?: string; value?: string };

/**
 * Human-first license callout for the asset hero column. Leads with one
 * plain-language sentence (the same one the metadata implies), then a row of
 * glanceable fact pills — so a buyer understands the rights at a glance without
 * digging into the Overview tab. The detailed receipts (full license bento +
 * Berne banner) still live in the Overview tab. Renders nothing when the asset
 * carries no license data.
 */
export function AssetLicenseSummary({ attributes }: { attributes: AssetAttribute[] }) {
  const summary = licenseSummary(attributes);
  if (!summary) return null;

  const get = (key: string) =>
    attributes.find((a) => a.trait_type?.toLowerCase() === key.toLowerCase())?.value;

  const commercialRaw = get("Commercial Use");
  const derivatives = (get("Derivatives") ?? "").toLowerCase();
  const ai = (get("AI Policy") ?? get("AI & Data Mining") ?? "").toLowerCase();
  const territory = get("Territory");

  const pills: { icon: ReactNode; label: string }[] = [];
  if (commercialRaw) {
    pills.push({
      icon: <DollarSign className="h-3.5 w-3.5" />,
      label: commercialRaw.toLowerCase() === "yes" ? "Commercial use" : "Non-commercial",
    });
  }
  if (derivatives) {
    pills.push({
      icon: <GitBranch className="h-3.5 w-3.5" />,
      label: derivatives === "not allowed" ? "No remixing" : "Remixable",
    });
  }
  if (ai) {
    pills.push({
      icon: <Bot className="h-3.5 w-3.5" />,
      label: ai.includes("not") ? "No AI training" : "AI allowed",
    });
  }
  if (territory) {
    pills.push({ icon: <Globe className="h-3.5 w-3.5" />, label: territory });
  }

  return (
    <div className="space-y-3">
      <p className="text-[15px] leading-relaxed text-foreground/90">{summary}</p>
      {pills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {pills.map((pill) => (
            <span
              key={pill.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-medium text-foreground/80"
            >
              {pill.icon}
              {pill.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
