"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Award, Users, Shield, CheckCircle2, ExternalLink, ChevronRight, Flag } from "lucide-react";
import { useToken } from "@/hooks/use-tokens";
import { useCollection } from "@/hooks/use-collections";
import { usePopClaimStatus } from "@/hooks/use-pop";
import { useSessionKey } from "@/hooks/use-session-key";
import { ipfsToHttp } from "@/lib/utils";
import { AddressDisplay } from "@/components/shared/address-display";
import { PopClaimButton } from "@/components/claim/pop-claim-button";
import { ShareButton } from "@/components/shared/share-button";
import { ReportDialog } from "@/components/report-dialog";
import { useDominantColor } from "@/hooks/use-dominant-color";
import { EXPLORER_URL } from "@/lib/constants";

export function AssetPagePop() {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  const { walletAddress } = useSessionKey();
  const { token } = useToken(contract, tokenId);
  const { collection } = useCollection(contract);
  const { claimStatus } = usePopClaimStatus(contract, walletAddress ?? null);
  const shouldReduce = useReducedMotion();

  const imageUrl = token?.metadata?.image ? ipfsToHttp(token.metadata.image) : null;
  const { imgRef, dynamicTheme } = useDominantColor(imageUrl);
  const [imgError, setImgError] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const name = token?.metadata?.name ?? collection?.name ?? `Credential #${tokenId}`;
  const description = token?.metadata?.description ?? collection?.description;
  const totalClaimed = collection?.totalSupply ?? 0;
  const creator = collection?.owner;

  return (
    <div
      style={dynamicTheme ? (dynamicTheme as React.CSSProperties) : {}}
      className="relative z-0 min-h-screen"
    >
      {imageUrl && (
        <img
          ref={imgRef}
          src={imageUrl}
          crossOrigin="anonymous"
          aria-hidden
          alt=""
          fetchPriority="high"
          style={{ display: "none" }}
        />
      )}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover opacity-20 scale-110"
            style={{ filter: "blur(60px) saturate(1.5)" }}
          />
        )}
      </div>

      <div className="container mx-auto px-4 pt-14 space-y-8 pb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          <Link href="/launchpad/pop" className="hover:text-foreground transition-colors shrink-0">
            POP Protocol
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium truncate">{name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] lg:gap-10 gap-8 items-start">
          {/* Credential image */}
          <motion.div
            initial={shouldReduce ? false : { scale: 1.0, opacity: 0 }}
            animate={{ scale: 1.02, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="overflow-hidden rounded-xl lg:sticky lg:top-16"
          >
            <div className="rounded-2xl overflow-hidden border border-border bg-muted relative">
              {imageUrl && !imgError ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  width={0}
                  height={0}
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="w-full h-auto"
                  onError={() => setImgError(true)}
                  priority
                />
              ) : (
                <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-600/20">
                  <Award className="h-24 w-24 text-emerald-500/40" />
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-emerald-400 border border-emerald-500/30">
                  <Shield className="h-3 w-3" />
                  Proof of Participation
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right column */}
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                  <Award className="h-3 w-3" />
                  POP Credential
                </span>
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold">{name}</h1>
              {description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              )}
            </div>

            {/* Claim / status box */}
            <div className="rounded-2xl border border-border p-5 space-y-4">
              {claimStatus?.hasClaimed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-500 font-semibold">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    You hold this credential
                  </div>
                  {claimStatus.tokenId && (
                    <p className="text-xs text-muted-foreground">
                      Credential #{claimStatus.tokenId} · permanently in your wallet
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This is an on-chain proof of participation. Once claimed, it lives permanently in your wallet and cannot be transferred or sold.
                  </p>
                  <PopClaimButton collectionAddress={contract} />
                </div>
              )}

              <div className="border-t border-border pt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  Non-transferable · Cannot be listed or sold
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  Gas-free claim · Verified on Starknet
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                <p className="text-2xl font-black">{totalClaimed.toLocaleString()}</p>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                  <Users className="h-3 w-3" />
                  holders
                </div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                <p className="text-2xl font-black">#{tokenId}</p>
                <p className="text-xs text-muted-foreground mt-1">credential ID</p>
              </div>
            </div>

            {/* Issuer */}
            {creator && (
              <div className="rounded-xl border border-border px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Issued by</p>
                  <Link href={`/creator/${creator}`} className="text-sm font-medium hover:text-primary transition-colors">
                    <AddressDisplay address={creator} chars={6} showCopy={false} />
                  </Link>
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex items-center gap-3 text-sm">
              <a
                href={`${EXPLORER_URL}/contract/${contract}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                Contract <ExternalLink className="h-3 w-3" />
              </a>
              <ShareButton title={name} variant="ghost" size="icon" />
              <button
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => setReportOpen(true)}
                title="Report this asset"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>

            <ReportDialog
              target={{ type: "TOKEN", contract, tokenId, name: name ?? undefined }}
              open={reportOpen}
              onOpenChange={setReportOpen}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
