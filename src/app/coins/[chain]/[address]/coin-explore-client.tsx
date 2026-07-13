"use client";

/**
 * CoinExploreClient — io's READ-ONLY coin page. io discovers/explores coins;
 * trading happens on the per-chain app, so this shows identity + live price +
 * stats, and the primary CTA links out to the coin's chain app (Starknet
 * today). No swap here by design.
 */

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { coinKind, formatCoinPrice } from "@medialane/ui";
import { useCoinPrice } from "@/hooks/use-coin-price";
import { useCoinSupply } from "@/hooks/use-coin-supply";
import { tradeHref, useCoin } from "@/lib/coin-adapters";
import { collectionHref } from "@/lib/routes";
import { ipfsToHttp, cn } from "@/lib/utils";
import { EXPLORER_URL } from "@/lib/constants";

function formatCompact(n: number): string {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

export function CoinExploreClient({ address }: { address: string }) {
  const router = useRouter();
  const { coin, isLoading } = useCoin(address);
  const { price, isLoading: priceLoading } = useCoinPrice(address);
  const { supply } = useCoinSupply(address, coin?.decimals ?? 18);

  const marketCap = useMemo(
    () => (price && supply != null && supply > 0 ? price.quotePerCoin * supply : null),
    [price, supply]
  );

  // Not a coin under /coins (e.g. an NFT collection address) → send to the
  // collection page (effect, not in render).
  useEffect(() => {
    if (!isLoading && !coin) router.replace(collectionHref("STARKNET", address));
  }, [isLoading, coin, address, router]);

  if (!isLoading && !coin) return null;

  const name = coin?.name ?? "Creator Coin";
  const symbol = coin?.symbol ?? "COIN";
  const kind = coinKind(coin?.service);
  const logoUri = coin?.image;
  const logo = logoUri ? ipfsToHttp(logoUri) : null;
  const initials = symbol.trim().slice(0, 2).toUpperCase();

  // Only render stats that resolve — no empty placeholder boxes.
  const stats: { label: string; value: string }[] = [];
  if (supply != null && supply > 0) stats.push({ label: "Supply", value: formatCompact(supply) });
  if (marketCap != null) stats.push({ label: "Market Cap", value: `${formatCompact(marketCap)} ${price?.quoteSymbol ?? ""}`.trim() });
  if (price?.quoteSymbol) stats.push({ label: "Priced in", value: price.quoteSymbol });

  return (
    <div className="relative z-0 min-h-screen">
      {/* Atmospheric blur background — same settings as the asset pages. */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {logo && (
          <Image
            src={logo}
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className="absolute inset-0 w-full h-full object-cover opacity-30 scale-110"
            style={{ filter: "blur(60px) saturate(1.5)" }}
            unoptimized
          />
        )}
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-20 pb-12 space-y-6">
        {/* Identity */}
        <div className="flex items-center gap-4">
          {logo ? (
            <Image src={logo} alt={symbol} width={64} height={64} unoptimized className="h-16 w-16 rounded-full object-cover border border-border/60 shrink-0" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple">
              <span className="text-xl font-bold text-white">{initials}</span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-3xl sm:text-4xl font-bold leading-tight">{name}</h1>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-xs">{symbol}</span>
              <span className="text-xs text-muted-foreground">{kind === "creator" ? "Creator Coin" : "Memecoin"}</span>
            </div>
          </div>
        </div>

        {/* Live price */}
        <Panel className="p-5">
          <p className="mb-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">Price</p>
          {priceLoading ? (
            <div className="h-9 w-40 rounded bg-muted-foreground/20 animate-pulse" />
          ) : price ? (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-brand-orange">{formatCoinPrice(price.quotePerCoin)}</span>
              <span className="text-sm text-muted-foreground">{price.quoteSymbol ?? "quote"} / {symbol}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not trading yet — no market price available.</p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground/70">Live market price · updates every 30s</p>
        </Panel>

        {/* Stats — only those that resolve */}
        {stats.length > 0 && (
          <div className={cn("grid gap-3", stats.length === 1 ? "grid-cols-1" : stats.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
            {stats.map((s) => <StatCell key={s.label} label={s.label} value={s.value} />)}
          </div>
        )}

        {/* Trade CTA → per-chain app */}
        {coin && (
          <div className="btn-border-animated p-[1px] rounded-2xl">
            <a
              href={tradeHref({ chain: coin.chain, contractAddress: coin.contractAddress })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-[15px] bg-brand-blue px-4 py-3 font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <ArrowUpRight className="h-4 w-4" /> Trade {symbol} on the Starknet app
            </a>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground/70">
          <span>{address.slice(0, 6)}…{address.slice(-4)}</span>
          <a href={`${EXPLORER_URL}/contract/${address}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /></a>
          {coin?.creator && (
            <Link href={`/creator/${coin.creator}`} className="hover:text-foreground">by {coin.creator.slice(0, 6)}…{coin.creator.slice(-4)}</Link>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Auxiliary panel — card surface with a subtle brand gradient fill (Primary
 * gradient, blue→purple) layered over the base, per the design system.
 */
function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm", className)}>
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-blue/12 via-brand-purple/8 to-transparent" />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <Panel className="rounded-xl px-3 py-2.5">
      <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="truncate text-base font-bold tabular-nums">{value}</p>
    </Panel>
  );
}
