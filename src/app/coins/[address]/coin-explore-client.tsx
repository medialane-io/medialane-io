"use client";

/**
 * CoinExploreClient — io's READ-ONLY coin page. io discovers/explores coins;
 * trading happens on the per-chain app, so this shows identity + live price +
 * stats + the plain-language guarantees, and the primary CTA links out to the
 * coin's chain app (Starknet today). No swap here by design.
 */

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ExternalLink, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { getService } from "@medialane/sdk";
import { coinKind, formatCoinPrice, formatFdv } from "@medialane/ui";
import { useCollection } from "@/hooks/use-collections";
import { useCoinPrice } from "@/hooks/use-coin-price";
import { tradeHref } from "@/lib/coin-adapters";
import { ipfsToHttp, cn } from "@/lib/utils";
import { EXPLORER_URL } from "@/lib/constants";

function formatCompact(n: number): string {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

export function CoinExploreClient({ address }: { address: string }) {
  const router = useRouter();
  const { collection, isLoading } = useCollection(address);
  const { price, isLoading: priceLoading } = useCoinPrice(address);

  const isCoin = collection ? getService(collection.service)?.uiVariant === "coin" : true;
  const marketCap = useMemo(
    () => (price && collection?.totalSupply && Number(collection.totalSupply) > 0 ? price.quotePerCoin * Number(collection.totalSupply) : null),
    [price, collection?.totalSupply]
  );

  // A non-coin under /coins → send to the collection page (effect, not in render).
  useEffect(() => {
    if (!isLoading && collection && !isCoin) router.replace(`/collections/${address}`);
  }, [isLoading, collection, isCoin, address, router]);

  if (!isLoading && collection && !isCoin) return null;

  const name = collection?.name ?? "Creator Coin";
  const symbol = collection?.symbol ?? "COIN";
  const kind = coinKind(collection?.service);
  const isExternal = collection?.service === "external-erc20";
  const logoUri = collection?.profile?.image ?? collection?.image;
  const logo = logoUri ? ipfsToHttp(logoUri) : null;
  const initials = symbol.trim().slice(0, 2).toUpperCase();

  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-20 pb-12 space-y-6">
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
            <span className="rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 font-mono text-xs">{symbol}</span>
            <span className="text-xs text-muted-foreground">{kind === "creator" ? "Creator Coin" : "Memecoin"}</span>
          </div>
        </div>
      </div>

      {/* Live price */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
        <p className="mb-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">Price</p>
        {priceLoading ? (
          <div className="h-9 w-40 rounded bg-muted-foreground/20 animate-pulse" />
        ) : price ? (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums">{formatCoinPrice(price.quotePerCoin)}</span>
            <span className="text-sm text-muted-foreground">{price.quoteSymbol ?? "quote"} / {symbol}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not trading yet — no market price available.</p>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground/70">Live market price · updates every 30s</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCell label="Holders" value={collection?.holderCount || "—"} />
        <StatCell label="Supply" value={collection?.totalSupply ? Number(collection.totalSupply).toLocaleString() : "—"} />
        <StatCell label="Market Cap" value={marketCap != null ? `${formatCompact(marketCap)} ${price?.quoteSymbol ?? ""}`.trim() : "—"} />
        <StatCell label="Priced in" value={price?.quoteSymbol ?? "—"} />
      </div>

      {/* Trade CTA → per-chain app */}
      {collection && (
        <a
          href={tradeHref(collection)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl border-0 bg-gradient-to-r from-brand-blue to-brand-purple px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90"
        >
          <ArrowUpRight className="h-4 w-4" /> Trade {symbol} on the Starknet app
        </a>
      )}

      {/* How it works */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {name} is a <span className="font-medium text-foreground">Creator Coin</span> — a token you can buy, hold in
          your own wallet, and trade any time on the open market.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <BenefitTile icon={Wallet} title="You own it" text="It lives in your wallet. Medialane never holds it for you." />
          <BenefitTile icon={TrendingUp} title="Fair market price" text="The price is set by the open market, not by us." />
          {!isExternal && (
            <BenefitTile icon={ShieldCheck} title="Safe by design" text="The funds can't be pulled and no extra coins can be made." link={`${EXPLORER_URL}/contract/${address}`} />
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground/70">
        <span className="font-mono">{address.slice(0, 6)}…{address.slice(-4)}</span>
        <a href={`${EXPLORER_URL}/contract/${address}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /></a>
        {collection?.owner && (
          <Link href={`/creator/${collection.owner}`} className="hover:text-foreground">by {collection.owner.slice(0, 6)}…{collection.owner.slice(-4)}</Link>
        )}
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 px-3 py-2.5">
      <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="truncate text-base font-bold tabular-nums">{value}</p>
    </div>
  );
}

function BenefitTile({ icon: Icon, title, text, link }: { icon: typeof Wallet; title: string; text: string; link?: string }) {
  return (
    <div className="space-y-1.5 rounded-xl border border-border/50 bg-muted/20 p-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10">
        <Icon className="h-3.5 w-3.5 text-emerald-500" />
      </div>
      <p className="text-xs font-semibold">{title}</p>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{text}</p>
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
          Verify <ExternalLink className={cn("h-3 w-3")} />
        </a>
      )}
    </div>
  );
}
