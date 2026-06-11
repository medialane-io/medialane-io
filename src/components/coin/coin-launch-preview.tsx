"use client";

/**
 * Live preview for the Creator Coin launch studio — builds the coin in front
 * of the creator as they type. Mirrors the coin's eventual discovery card so
 * what they design is what their fans will see.
 */

import Image from "next/image";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CoinPreviewData {
  name: string;
  symbol: string;
  description: string;
  /** Local object URL or resolved IPFS URL for the feature image */
  imageUrl: string | null;
  /** Human supply (already validated) or null while typing */
  supplyHuman: number | null;
  quoteSymbol: string;
  teamPct: number;
}

const LAUNCH_PRICE = 0.01; // fixed, quote per coin

export function CoinLaunchPreview({ data, className }: { data: CoinPreviewData; className?: string }) {
  const { name, symbol, description, imageUrl, supplyHuman, quoteSymbol, teamPct } = data;
  const marketCap = supplyHuman != null ? supplyHuman * LAUNCH_PRICE : null;
  const yourCoins = supplyHuman != null ? supplyHuman * (teamPct / 100) : null;

  return (
    <div className={cn("rounded-2xl border border-pink-500/25 bg-card overflow-hidden", className)}>
      <div className="px-4 pt-3 pb-2 border-b border-border/40">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
          Live preview
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Identity */}
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-pink-500/25 to-rose-500/10 flex items-center justify-center">
            {imageUrl ? (
              <Image src={imageUrl} alt="" fill sizes="56px" className="object-cover" unoptimized />
            ) : (
              <TrendingUp className="h-6 w-6 text-pink-400/70" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("font-bold text-lg truncate", !name && "text-muted-foreground/50")}>
              {name || "Your coin"}
            </p>
            <p className="text-sm text-muted-foreground">{symbol ? `$${symbol}` : "$SYMBOL"}</p>
          </div>
        </div>

        {description ? (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{description}</p>
        ) : null}

        {/* Economics */}
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/30 p-3 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Launch price</p>
            <p className="font-semibold">{LAUNCH_PRICE} {quoteSymbol}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Market cap</p>
            <p className="font-semibold">{marketCap != null ? `${marketCap.toLocaleString()} ${quoteSymbol}` : "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Your share</p>
            <p className="font-semibold">{yourCoins != null ? `${teamPct}% · ${yourCoins.toLocaleString()}` : `${teamPct}%`}</p>
          </div>
        </div>

        {/* Allocation split bar */}
        <div className="space-y-1.5">
          <div className="flex h-2.5 rounded-full overflow-hidden bg-muted/40">
            {teamPct > 0 && (
              <div className="bg-gradient-to-r from-pink-500 to-rose-500" style={{ width: `${teamPct}%` }} />
            )}
            <div className="flex-1 bg-muted-foreground/20" />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span className="font-medium text-pink-400">You {teamPct}%</span>
            <span>Community {100 - teamPct}%</span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/70">
          Liquidity is locked forever — nobody can pull it, including us.
        </p>
      </div>
    </div>
  );
}
