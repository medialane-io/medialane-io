"use client";

import { CurrencyIcon } from "@/components/shared/currency-icon";
import { PriceHistoryChart } from "@/components/asset/price-history-chart";
import { RemixesTab } from "@/components/asset/remixes-tab";
import { formatDisplayPrice, timeAgo } from "@/lib/utils";
import { EXPLORER_URL } from "@/lib/constants";
import {
  ShoppingCart, Tag, HandCoins, ArrowRightLeft, X, CheckCircle,
  TrendingUp, Activity, ArrowRight, ExternalLink, Fingerprint, UserCheck,
} from "lucide-react";
import type { ApiActivity } from "@medialane/sdk";

const EVENT_STYLE: Record<string, { label: string; icon: React.ReactNode; badgeCls: string }> = {
  sale:      { label: "Sale",      icon: <ShoppingCart className="h-3.5 w-3.5" />,   badgeCls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" },
  mint:      { label: "Minted",    icon: <CheckCircle className="h-3.5 w-3.5" />,    badgeCls: "bg-teal-500/15 text-teal-500 border-teal-500/20"          },
  listing:   { label: "Listed",    icon: <Tag className="h-3.5 w-3.5" />,            badgeCls: "bg-blue-500/15 text-blue-500 border-blue-500/20"          },
  offer:     { label: "Offer",     icon: <HandCoins className="h-3.5 w-3.5" />,      badgeCls: "bg-amber-500/15 text-amber-500 border-amber-500/20"       },
  transfer:  { label: "Transfer",  icon: <ArrowRightLeft className="h-3.5 w-3.5" />, badgeCls: "bg-purple-500/15 text-purple-500 border-purple-500/20"    },
  cancelled: { label: "Cancelled", icon: <X className="h-3.5 w-3.5" />,              badgeCls: "bg-red-500/15 text-red-400 border-red-500/20"             },
};

interface AssetProvenanceTabProps {
  history: ApiActivity[];
  contract: string;
  tokenId: string;
  remixCount: number;
}

export function AssetProvenanceTab({ history, contract, tokenId, remixCount }: AssetProvenanceTabProps) {
  const sales = history.filter((e) => e.type === "sale");

  const totalVolumeParts = sales.reduce<Record<string, { amount: number; currency: string }>>((acc, e) => {
    if (!e.price?.formatted || !e.price.currency) return acc;
    const key = e.price.currency;
    const parsed = parseFloat(e.price.formatted.replace(/,/g, ""));
    if (!isNaN(parsed)) {
      acc[key] = { amount: (acc[key]?.amount ?? 0) + parsed, currency: key };
    }
    return acc;
  }, {});
  const volumeSummary = Object.values(totalVolumeParts);

  const allActors = new Set(
    history.flatMap((e) => [e.offerer, e.fulfiller, (e as any).from].filter(Boolean))
  );
  const firstEvent = history[history.length - 1];

  return (
    <div className="mt-4 space-y-6">

      {/* Onchain attestation badge */}
      <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-2.5">
        <Fingerprint className="h-4 w-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-primary">Onchain Provenance</p>
          <p className="text-xs text-muted-foreground">Every transfer and sale is immutably recorded on Starknet — this history cannot be altered.</p>
        </div>
        <a
          href={`${EXPLORER_URL}/contract/${contract}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors ml-auto"
        >
          Contract <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Stats grid */}
      {history.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
            <Activity className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{history.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Events</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
            <ShoppingCart className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{sales.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sales</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
            <TrendingUp className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            {volumeSummary.length > 0 ? (
              <div className="space-y-0.5">
                {volumeSummary.map((v) => (
                  <p key={v.currency} className="text-sm font-bold leading-tight">
                    {v.amount.toFixed(v.amount < 1 ? 4 : 2)} {v.currency}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-lg font-bold">—</p>
            )}
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Volume</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
            <UserCheck className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{allActors.size}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Participants</p>
          </div>
        </div>
      )}

      {/* Remixes section */}
      {remixCount > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remixes ({remixCount})</p>
          <RemixesTab contractAddress={contract} tokenId={tokenId} />
        </div>
      )}

      {/* Price history chart */}
      <PriceHistoryChart history={history} />

      {/* Event timeline */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          History
          {firstEvent && (
            <span className="ml-2 font-normal normal-case">
              · first activity {timeAgo(firstEvent.timestamp)}
            </span>
          )}
        </p>

        {history.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted/10 py-12 flex flex-col items-center gap-3 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline spine */}
            <div className="absolute left-[19px] top-6 bottom-6 w-px bg-border/60" />

            <div className="space-y-1">
              {history.map((event, i) => {
                const style = EVENT_STYLE[event.type] ?? {
                  label: event.type,
                  icon: <Activity className="h-3.5 w-3.5" />,
                  badgeCls: "bg-muted/60 text-muted-foreground border-border",
                };
                const actor = event.offerer ?? (event as any).from ?? "";
                const toAddr = (event as any).to as string | undefined;
                const counterpart = event.fulfiller && event.fulfiller !== actor
                  ? event.fulfiller
                  : (event.type === "transfer" || event.type === "mint") && toAddr
                  ? toAddr
                  : null;
                const amount = (event as any).amount as string | undefined;
                const txLink = event.txHash ? `${EXPLORER_URL}/tx/${event.txHash}` : null;
                const voyagerActor = actor ? `${EXPLORER_URL}/contract/${actor}` : null;

                return (
                  <div key={i} className="relative flex gap-4 group">
                    {/* Timeline dot */}
                    <div className={`relative z-10 h-10 w-10 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors group-hover:border-primary/50 ${style.badgeCls}`}>
                      {style.icon}
                    </div>

                    {/* Row content */}
                    <div
                      className={`flex-1 min-w-0 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 transition-colors group-hover:border-border group-hover:bg-card/60 ${txLink ? "cursor-pointer" : ""}`}
                      onClick={() => txLink && window.open(txLink, "_blank", "noopener,noreferrer")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${style.badgeCls}`}>
                              {style.icon}
                              {style.label}
                            </span>
                            {actor && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                {voyagerActor ? (
                                  <a
                                    href={voyagerActor}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="hover:text-foreground transition-colors font-mono"
                                  >
                                    {actor.slice(0, 6)}…{actor.slice(-4)}
                                  </a>
                                ) : (
                                  <span className="font-mono">{actor.slice(0, 6)}…{actor.slice(-4)}</span>
                                )}
                              </span>
                            )}
                            {counterpart && (
                              <>
                                <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                                <a
                                  href={`${EXPLORER_URL}/contract/${counterpart}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
                                >
                                  {counterpart.slice(0, 6)}…{counterpart.slice(-4)}
                                </a>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Price + amount + time + tx link */}
                        <div className="flex items-center gap-2 shrink-0">
                          {amount && BigInt(amount) > 1n && (
                            <span className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                              ×{amount}
                            </span>
                          )}
                          {event.price?.formatted && (
                            <span className="text-sm font-bold inline-flex items-center gap-1">
                              {formatDisplayPrice(event.price.formatted)}
                              <CurrencyIcon symbol={event.price.currency ?? ""} size={13} />
                            </span>
                          )}
                          <span
                            className="text-[11px] text-muted-foreground/60 whitespace-nowrap"
                            title={new Date(event.timestamp).toLocaleString()}
                          >
                            {timeAgo(event.timestamp)}
                          </span>
                          {txLink && (
                            <a
                              href={txLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                              title="View transaction"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
