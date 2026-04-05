"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package, ArrowLeft, Users, Clock, DollarSign,
  ShieldCheck, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionDropMintButton } from "@/components/claim/collection-drop-mint-button";
import { useDropInfo, getDropStatus, type DropConditions } from "@/hooks/use-drops";
import { ipfsToHttp } from "@/lib/utils";
import { getListableTokens } from "@medialane/sdk";
import { cn } from "@/lib/utils";

function getTokenByAddress(address: string) {
  return (
    getListableTokens().find(
      (t) => t.address.toLowerCase() === address.toLowerCase()
    ) ?? null
  );
}

function formatTs(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function SupplyProgress({ minted, max }: { minted: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (minted / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{minted.toLocaleString()} minted</span>
        <span>of {max.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-orange-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{pct.toFixed(1)}% claimed</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ReturnType<typeof getDropStatus> }) {
  const map = {
    live:     { label: "Live",     cls: "text-green-400 bg-green-500/10"     },
    upcoming: { label: "Upcoming", cls: "text-blue-400 bg-blue-500/10"       },
    ended:    { label: "Ended",    cls: "text-muted-foreground bg-muted"     },
    sold_out: { label: "Sold out", cls: "text-orange-400 bg-orange-500/10"   },
  } as const;
  const { label, cls } = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest rounded-full px-3 py-1",
        cls
      )}
    >
      {status === "live" && (
        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
      )}
      {label}
    </span>
  );
}

function PriceDisplay({ conditions }: { conditions: DropConditions }) {
  if (conditions.price === "0" || conditions.paymentToken === "0x0") {
    return (
      <div className="flex items-center gap-1.5 text-sm font-semibold text-green-500">
        <DollarSign className="h-4 w-4" />
        Free mint
      </div>
    );
  }
  const token = getTokenByAddress(conditions.paymentToken);
  const decimals = token?.decimals ?? 18;
  const priceNum = Number(BigInt(conditions.price) * 10000n / BigInt(10 ** decimals)) / 10000;
  return (
    <div className="flex items-center gap-1.5 text-sm font-semibold">
      <DollarSign className="h-4 w-4 text-orange-500" />
      {priceNum} {token?.symbol ?? "tokens"} per token
    </div>
  );
}

export default function DropDetailPage({
  params,
}: {
  params: Promise<{ contract: string }>;
}) {
  const { contract } = use(params);
  const { dropInfo, isLoading } = useDropInfo(contract);

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 pt-10 pb-16 space-y-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!dropInfo) {
    return (
      <div className="container max-w-2xl mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <Package className="h-10 w-10 text-muted-foreground/20 mx-auto" />
        <p className="text-muted-foreground">Drop not found or not yet indexed.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/launchpad/drop">← Back to drops</Link>
        </Button>
      </div>
    );
  }

  const { conditions, totalMinted } = dropInfo;
  const status = getDropStatus(conditions, totalMinted);
  const maxSupply = conditions ? parseInt(conditions.maxSupply, 10) : 0;
  const imageUrl = dropInfo.image ? ipfsToHttp(dropInfo.image) : null;

  return (
    <div className="container max-w-2xl mx-auto px-4 pt-10 pb-16 space-y-8">

      {/* Back */}
      <FadeIn>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/launchpad/drop">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            All drops
          </Link>
        </Button>
      </FadeIn>

      {/* Hero image */}
      {imageUrl && (
        <FadeIn delay={0.04}>
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-muted">
            <Image
              src={imageUrl}
              alt={dropInfo.name ?? "Drop"}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </FadeIn>
      )}

      {/* Header */}
      <FadeIn delay={0.08}>
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={status} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              DROP
            </span>
          </div>
          <h1 className="text-3xl font-black">{dropInfo.name ?? "Unnamed Drop"}</h1>
          {dropInfo.description && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {dropInfo.description}
            </p>
          )}
        </div>
      </FadeIn>

      {/* Stats grid */}
      <FadeIn delay={0.12}>
        <div className="grid grid-cols-2 gap-3">

          {/* Supply */}
          <div className="bento-cell p-4 col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-orange-500" />
              Supply
            </div>
            {maxSupply > 0 ? (
              <SupplyProgress minted={totalMinted} max={maxSupply} />
            ) : (
              <p className="text-sm text-muted-foreground">
                {totalMinted.toLocaleString()} minted
              </p>
            )}
          </div>

          {/* Price */}
          {conditions && (
            <div className="bento-cell p-4 space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <DollarSign className="h-4 w-4 text-orange-500" />
                Price
              </div>
              <PriceDisplay conditions={conditions} />
              {conditions.maxPerWallet !== "0" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Max {conditions.maxPerWallet} per wallet
                </p>
              )}
            </div>
          )}

          {/* Time window */}
          {conditions && (
            <div className="bento-cell p-4 space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Mint window
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 shrink-0" />
                  Opens: {formatTs(conditions.startTime)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 shrink-0" />
                  Closes: {formatTs(conditions.endTime)}
                </div>
              </div>
            </div>
          )}

          {/* Holders */}
          <div className="bento-cell p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-orange-500" />
              Collectors
            </div>
            <p className="text-2xl font-black">{totalMinted.toLocaleString()}</p>
          </div>

        </div>
      </FadeIn>

      {/* Mint */}
      <FadeIn delay={0.18}>
        <div className="bento-cell p-5 space-y-3">
          <p className="text-sm font-semibold">Mint your token</p>
          {status === "upcoming" && (
            <p className="text-xs text-muted-foreground">
              Minting opens {conditions ? formatTs(conditions.startTime) : "soon"}.
            </p>
          )}
          {status === "ended" && (
            <p className="text-xs text-muted-foreground">This drop has ended.</p>
          )}
          {status === "sold_out" && (
            <p className="text-xs text-muted-foreground">
              All tokens have been claimed. Check secondary markets.
            </p>
          )}
          {status === "live" && (
            <CollectionDropMintButton
              collectionAddress={contract}
              conditions={conditions ?? undefined}
            />
          )}
          {status !== "live" && (
            <Button variant="outline" size="lg" className="w-full" disabled>
              Minting {status === "upcoming" ? "not yet open" : "closed"}
            </Button>
          )}
          <p className="text-xs text-center text-muted-foreground">
            Gas is free. Your PIN signs the transaction.
          </p>
        </div>
      </FadeIn>

    </div>
  );
}
