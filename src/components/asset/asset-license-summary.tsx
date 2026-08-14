"use client";

import type { ReactNode } from "react";
import { Bot, DollarSign, GitBranch, Globe } from "lucide-react";
import { licenseSummary } from "@/lib/license-summary";

type AssetAttribute = { trait_type?: string; value?: string };

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
    <div className="space-y-2.5">
      <p className="text-[10px] font-medium text-muted-foreground">License</p>
      <p className="text-[15px] font-medium leading-relaxed text-foreground/90">{summary}</p>
      {pills.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-0.5">
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
