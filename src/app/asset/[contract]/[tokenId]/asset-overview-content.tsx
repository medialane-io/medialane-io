"use client";

import type { ReactNode } from "react";
import { IPTypeDisplay } from "@/components/ip-type-display";
import { Bot, Calendar, DollarSign, GitBranch, Globe, Percent, Shield, UserCheck } from "lucide-react";

interface AssetAttribute {
  trait_type?: string;
  value?: string;
}

interface AssetOverviewContentProps {
  attributes: AssetAttribute[];
  hasTemplateData: boolean;
  isDisplayAttr: (attribute: AssetAttribute) => boolean;
}

export function AssetOverviewContent({
  attributes,
  hasTemplateData,
  isDisplayAttr,
}: AssetOverviewContentProps) {
  const attr = (trait: string) => attributes.find((attribute) => attribute.trait_type === trait)?.value;
  const licenseType = attr("License");
  const commercialUse = attr("Commercial Use");
  const derivatives = attr("Derivatives");
  const attribution = attr("Attribution");
  const territory = attr("Territory");
  const aiPolicy = attr("AI Policy");
  const royalty = attr("Royalty");
  const standard = attr("Standard");
  const registration = attr("Registration");
  const hasLicenseData = licenseType || commercialUse || derivatives || attribution;
  const displayAttributes = attributes.filter((attribute) => isDisplayAttr(attribute));

  const rows: { icon: ReactNode; label: string; value: string | undefined }[] = [
    { icon: <Shield className="h-4 w-4" />, label: "License", value: licenseType },
    { icon: <DollarSign className="h-4 w-4" />, label: "Commercial Use", value: commercialUse },
    { icon: <GitBranch className="h-4 w-4" />, label: "Derivatives", value: derivatives },
    { icon: <UserCheck className="h-4 w-4" />, label: "Attribution", value: attribution },
    { icon: <Globe className="h-4 w-4" />, label: "Territory", value: territory },
    { icon: <Bot className="h-4 w-4" />, label: "AI & Data Mining", value: aiPolicy },
    { icon: <Percent className="h-4 w-4" />, label: "Royalty", value: royalty },
    { icon: <Calendar className="h-4 w-4" />, label: "Registration", value: registration },
  ].filter((row) => !!row.value);

  return (
    <div className="mt-4 space-y-6">
      {hasTemplateData ? (
        <IPTypeDisplay attributes={attributes} />
      ) : null}

      {hasLicenseData ? (
        <div className="space-y-3">
          {standard ? (
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs font-semibold text-primary">{standard} Compliant</p>
                <p className="text-xs text-muted-foreground">
                  Licensing terms are immutably embedded in IPFS metadata and compliant with international copyright law.
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {rows.map(({ icon, label, value }) => (
              <div key={label} className="rounded-lg border border-border bg-muted/20 p-3 text-center overflow-hidden">
                <div className="flex justify-center text-muted-foreground mb-1">{icon}</div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{label}</p>
                <p className="text-sm font-semibold mt-0.5 truncate" title={value}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {displayAttributes.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Attributes</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {displayAttributes.map((attribute, index) => (
              <div key={index} className="rounded-lg border border-border bg-muted/20 p-3 text-center overflow-hidden">
                <p
                  className="text-[10px] uppercase tracking-wider text-muted-foreground truncate"
                  title={attribute.trait_type ?? "Trait"}
                >
                  {attribute.trait_type ?? "Trait"}
                </p>
                <p
                  className="text-sm font-semibold mt-0.5 truncate"
                  title={attribute.value ?? "—"}
                >
                  {attribute.value ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!hasTemplateData && displayAttributes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No additional details available.</p>
      ) : null}
    </div>
  );
}
