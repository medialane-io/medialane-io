"use client";

import type { ReactNode } from "react";
import { Bot, Calendar, DollarSign, GitBranch, Globe, Percent, UserCheck } from "lucide-react";
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

/** A standard bento square: a brand-tinted icon, an uppercase label, a bold value.
 *  `wide` stretches it across two columns for an emphasized detail. */
function Cell({
  icon,
  label,
  value,
  wide,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`flex flex-col justify-between gap-2 rounded-xl bg-muted/25 ring-1 ring-border/40 p-3.5 ${
        wide ? "col-span-2" : ""
      }`}
    >
      {icon ? <span className="text-primary/70">{icon}</span> : null}
      <div className="space-y-0.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate" title={label}>
          {label}
        </p>
        <div className="text-sm font-bold text-foreground truncate">{value}</div>
      </div>
    </div>
  );
}

/**
 * Asset Overview tab, as a Bento 2.0 grid: an asymmetrical lattice of rounded
 * compartments on a soft brand light-leak, uniform gaps throughout. The license
 * summary is the emphasized cell (stretched 2×2, brand-gradient wash + license
 * stamp); each right is a standard square; Details follow. Uses only design-system
 * tokens (brand-* / primary / aurora).
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
    { icon: <Percent className="h-4 w-4" />, label: "Royalty", value: royalty },
    { icon: <Calendar className="h-4 w-4" />, label: "Registered", value: registration },
  ].filter((row) => !!row.value);

  return (
    <div className="mt-4 space-y-7">
      {hasTemplateData ? <IPTypeDisplay attributes={attributes} /> : null}

      {hasLicenseData ? (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rights</h3>
          <div className="relative">
            {/* soft brand light-leak behind the lattice */}
            <div
              aria-hidden
              className="aurora-purple pointer-events-none"
              style={{ position: "absolute", width: 260, height: 260, top: -40, left: "30%" }}
            />
            <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 [grid-auto-flow:dense] auto-rows-[minmax(6rem,auto)]">
              {/* emphasized cell — the license summary, stretched 2×2 */}
              <div className="col-span-2 sm:row-span-2 flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 ring-1 ring-primary/15 p-5">
                {licenseType ? (
                  <span className="pill-badge self-start text-[10px] uppercase tracking-wider">{licenseType}</span>
                ) : null}
                {summary ? (
                  <p className="text-base sm:text-lg font-semibold leading-snug text-foreground">{summary}</p>
                ) : null}
              </div>

              {facts.map(({ icon, label, value }) => (
                <Cell key={label} icon={icon} label={label} value={value} />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground/70">
            Kept in permanent, tamper-proof storage · recognized under international copyright law
          </p>
        </section>
      ) : null}

      {displayAttributes.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 [grid-auto-flow:dense] auto-rows-[minmax(6rem,auto)]">
            {displayAttributes.map((attribute, index) => (
              <Cell
                key={index}
                label={attribute.trait_type ?? "Trait"}
                wide={isAddressLike(attribute.value)}
                value={
                  isAddressLike(attribute.value) ? (
                    <AddressDisplay address={attribute.value!} chars={4} className="text-sm font-bold" />
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
