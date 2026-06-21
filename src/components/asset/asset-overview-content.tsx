"use client";

import type { ReactNode } from "react";
import { Bot, Calendar, DollarSign, GitBranch, Globe, Percent, ShieldCheck, UserCheck } from "lucide-react";
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

/** Tidy label → value row: muted label left, bold value right, hairline divider. */
function FactRow({ icon, label, value }: { icon?: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-border/40">
      <span className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
        {icon ? <span className="text-muted-foreground/60 shrink-0">{icon}</span> : null}
        <span className="truncate">{label}</span>
      </span>
      <span className="text-sm font-semibold text-foreground text-right truncate">{value}</span>
    </div>
  );
}

/**
 * Asset Overview tab. One calm sheet: an optional IP-type block, a single
 * "Rights" summary (plain-language lead line + a scannable fact list + a quiet
 * trust footnote), then a light "Details" list. No license block in the hero,
 * no grey-box bento, no "protected worldwide" banner.
 */
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
  const registration = attr("Registration");
  const summary = licenseSummary(attributes);
  const hasLicenseData = !!(licenseType || commercialUse || derivatives || attribution);
  const displayAttributes = attributes.filter((attribute) => isDisplayAttr(attribute));

  const facts = [
    { icon: <DollarSign className="h-4 w-4" />, label: "Commercial use", value: commercialUse },
    { icon: <GitBranch className="h-4 w-4" />, label: "Derivatives", value: derivatives },
    { icon: <UserCheck className="h-4 w-4" />, label: "Attribution", value: attribution },
    { icon: <Globe className="h-4 w-4" />, label: "Territory", value: territory },
    { icon: <Bot className="h-4 w-4" />, label: "AI & data mining", value: aiPolicy },
    { icon: <ShieldCheck className="h-4 w-4" />, label: "License", value: licenseType },
    { icon: <Percent className="h-4 w-4" />, label: "Royalty", value: royalty },
    { icon: <Calendar className="h-4 w-4" />, label: "Registered", value: registration },
  ].filter((row) => !!row.value);

  return (
    <div className="mt-4 space-y-7">
      {hasTemplateData ? <IPTypeDisplay attributes={attributes} /> : null}

      {hasLicenseData ? (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rights</h3>
          {summary ? (
            <p className="text-[15px] font-medium leading-relaxed text-foreground/90">{summary}</p>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-10">
            {facts.map(({ icon, label, value }) => (
              <FactRow key={label} icon={icon} label={label} value={value} />
            ))}
          </div>
          <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground/70">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            Kept in permanent, tamper-proof storage · recognized under international copyright law
          </p>
        </section>
      ) : null}

      {displayAttributes.length > 0 ? (
        <section className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-10">
            {displayAttributes.map((attribute, index) => (
              <FactRow
                key={index}
                label={attribute.trait_type ?? "Trait"}
                value={
                  isAddressLike(attribute.value) ? (
                    <AddressDisplay address={attribute.value!} chars={4} className="text-sm font-semibold" />
                  ) : (
                    attribute.value ?? "—"
                  )
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {!hasTemplateData && !hasLicenseData && displayAttributes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No additional details available.</p>
      ) : null}
    </div>
  );
}
