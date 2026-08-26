"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Package, ArrowLeft, Users, Clock, DollarSign,
  ShieldCheck, Calendar, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion-primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionDropMintButton } from "@/components/claim/collection-drop-mint-button";
import { DropCountdown, DropStatusBadge as StatusBadge, DropSupplyProgress as SupplyProgress, DropPriceDisplay as PriceDisplay } from "@medialane/ui";
import { useDropInfo, useOnChainDropState, getDropStatus } from "@/hooks/use-drops";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { ipfsToHttp } from "@/lib/utils";
import { normalizeAddress } from "@medialane/sdk";

function formatTs(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DropDetailPage({ contract }: { contract: string }) {
  const { address: walletAddress } = useWalletNativeSession();
  const { dropInfo, isLoading } = useDropInfo(contract);

  const { state: chainState } = useOnChainDropState(contract);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-10 pb-16 space-y-6">
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
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-8 text-center space-y-4">
        <Package className="h-10 w-10 text-muted-foreground/20 mx-auto" />
        <p className="text-muted-foreground">Drop not found or not yet indexed.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/launchpad/drop">← Back to drops</Link>
        </Button>
      </div>
    );
  }

  const conditions = chainState?.conditions ?? null;
  const totalMinted = chainState?.totalMinted ?? dropInfo.totalMinted;
  const status = getDropStatus(conditions, totalMinted);
  const maxSupply = chainState?.maxSupply ?? (conditions ? parseInt(conditions.maxSupply, 10) : 0);
  const imageUrl = dropInfo.image ? ipfsToHttp(dropInfo.image) : null;
  const isOwner =
    walletAddress &&
    dropInfo.owner &&
    normalizeAddress("STARKNET", walletAddress) === normalizeAddress("STARKNET", dropInfo.owner);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-16 space-y-8">

      <FadeIn>
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/launchpad/drop">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              All drops
            </Link>
          </Button>
          {isOwner && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/launchpad/drop/${contract}/manage`}>
                <Settings className="h-3.5 w-3.5" />
                Manage
              </Link>
            </Button>
          )}
        </div>
      </FadeIn>

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

      <FadeIn delay={0.08}>
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={status} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              DROP
            </span>
            {chainState?.allowlistEnabled && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-orange bg-brand-orange/10 rounded-full px-2 py-0.5">
                Presale
              </span>
            )}
          </div>
          <h1 className="text-3xl font-semibold">{dropInfo.name ?? "Unnamed Drop"}</h1>
          {dropInfo.description && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {dropInfo.description}
            </p>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.12}>
        <div className="grid grid-cols-2 gap-3">

          <div className="bento-cell p-4 col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-brand-orange" />
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

          {conditions && (
            <div className="bento-cell p-4 space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <DollarSign className="h-4 w-4 text-brand-orange" />
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

          {conditions && (
            <div className="bento-cell p-4 space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                <Clock className="h-4 w-4 text-brand-orange" />
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

          <div className="bento-cell p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-brand-orange" />
              Collectors
            </div>
            <p className="text-2xl font-black">{totalMinted.toLocaleString()}</p>
          </div>

        </div>
      </FadeIn>

      <FadeIn delay={0.18}>
        <div className="bento-cell p-5 space-y-3">
          <p className="text-sm font-semibold">Mint your token</p>
          {status === "upcoming" && conditions && (
            <DropCountdown targetTs={conditions.startTime} label={chainState?.allowlistEnabled ? "Presale opens in" : "Mint opens in"} />
          )}
          {status === "live" && conditions && conditions.endTime > 0 && (
            <DropCountdown targetTs={conditions.endTime} label="Mint closes in" />
          )}
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
            Gas is free.
          </p>
        </div>
      </FadeIn>

    </div>
  );
}
