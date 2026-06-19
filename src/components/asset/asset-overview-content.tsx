"use client";

import { Bot, Calendar, DollarSign, GitBranch, Globe, Percent, Shield, UserCheck } from "lucide-react";
import { IPTypeDisplay } from "@medialane/ui";
import { AddressDisplay } from "@/components/shared/address-display";
import { licenseSummary } from "@/lib/license-summary";

type AssetAttribute = { trait_type?: string; value?: string };

interface AssetOverviewContentProps {
  attributes: AssetAttribute[];
  hasTemplateData: boolean;
  isDisplayAttr: (attribute: AssetAttribute) => boolean;
}

const isAddressLike = (v?: string): boolean => !!v && /^0x[0-9a-fA-F]{16,}$/.test(v.trim());

/**
 * Overview tab (standard asset page). Story-first: a one-line plain-language
 * license summary leads, the Berne banner + license bento are the receipts
 * beneath, then a refined attributes grid (copyable address-like values, no
 * rarity). io-local fork of the @medialane/ui component.
 */
export function AssetOverviewContent({ attributes, hasTemplateData, isDisplayAttr }: AssetOverviewContentProps) {
  const attr = (trait: string) => attributes.find((a) => a.trait_type === trait)?.value;
  const licenseType = attr("License");
  const commercialUse = attr("Commercial Use");
  const derivatives = attr("Derivatives");
  const attribution = attr("Attribution");
  const territory = attr("Territory");
  const aiPolicy = attr("AI Policy");
  const royalty = attr("Royalty");
  const standard = attr("Standard");
  const registration = attr("Registration");

  const hasLicenseData = Boolean(licenseType || commercialUse || derivatives || attribution);
  const summary = licenseSummary(attributes);
  const displayAttributes = attributes.filter((a) => isDisplayAttr(a));

  const rows = [
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
      {/* Story-fied license: one human line leads. */}
      {summary ? (
        <p className="text-base text-foreground/90 leading-relaxed">{summary}</p>
      ) : null}

      {hasTemplateData ? <IPTypeDisplay attributes={attributes} /> : null}

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

      {/* Refined attributes — left-aligned, varied radius, copyable address values, no rarity. */}
      {displayAttributes.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Attributes</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {displayAttributes.map((attribute, index) => (
              <div
                key={index}
                className={`border border-border/60 bg-muted/20 px-3 py-2.5 overflow-hidden transition hover:border-border hover:bg-muted/40 ${
                  index % 3 === 0 ? "rounded-2xl" : "rounded-xl"
                }`}
              >
                <p
                  className="text-[10px] uppercase tracking-wider text-muted-foreground truncate"
                  title={attribute.trait_type ?? "Trait"}
                >
                  {attribute.trait_type ?? "Trait"}
                </p>
                {isAddressLike(attribute.value) ? (
                  <AddressDisplay address={attribute.value!} chars={4} className="text-sm font-semibold mt-0.5" />
                ) : (
                  <p className="text-sm font-semibold mt-0.5 truncate" title={attribute.value ?? "—"}>
                    {attribute.value ?? "—"}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!hasTemplateData && !hasLicenseData && displayAttributes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No additional details available.</p>
      ) : null}
    </div>
  );
}
