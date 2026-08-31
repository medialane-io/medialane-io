"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Globe, MessageCircle, Send, Twitter } from "lucide-react";
import { CreatorScoreInline } from "@/components/rewards/creator-score-inline";
import { resolveTokenImage } from "@/lib/utils";
import type { ProfileForm } from "./types";
import { profileIdentity } from "@medialane/ui";

export function ProfileLivePreview({
  form, approvedUsername, walletAddress, fallbackImage,
}: {
  form: ProfileForm;
  approvedUsername?: string | null;
  walletAddress?: string | null;

  fallbackImage?: string | null;
}) {
  const { identity, name } = profileIdentity({
    username: approvedUsername,
    name: form.name,
    walletAddress,
  });
  const heroUrl = resolveTokenImage(form.avatarImage) || fallbackImage || null;

  return (
    <div className="rounded-[24px] border border-border/60 bg-card overflow-hidden">

      <div className="px-2.5 pt-2.5">
        <div className="relative aspect-square w-full overflow-hidden rounded-[16px] bg-muted ring-1 ring-black/10 dark:ring-white/10">
          {heroUrl && <Image src={heroUrl} alt="" fill unoptimized className="object-cover" />}
          {walletAddress && (
            <div className="absolute bottom-2 right-2">
              <CreatorScoreInline address={walletAddress} />
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pt-3 pb-5 space-y-3">
        <div className="min-w-0">
          <p className="truncate text-[18px] font-bold leading-snug text-foreground">{identity}</p>
          {name ? (
            <p className="truncate text-[11px] text-muted-foreground">{name}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground/60">Add a name</p>
          )}
        </div>

        {form.bio && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{form.bio}</p>
        )}

        {(form.websiteUrl || form.twitterUrl || form.discordUrl || form.telegramUrl) && (
          <div className="flex items-center gap-2">
            {form.websiteUrl && (
              <span className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
              </span>
            )}
            {form.twitterUrl && (
              <span className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Twitter className="h-3.5 w-3.5" />
              </span>
            )}
            {form.discordUrl && (
              <span className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <MessageCircle className="h-3.5 w-3.5" />
              </span>
            )}
            {form.telegramUrl && (
              <span className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Send className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        )}

        {approvedUsername && (
          <Link
            href={`/creator/${approvedUsername}`}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            View profile
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
