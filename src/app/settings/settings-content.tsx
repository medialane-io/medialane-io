"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useCreatorProfile } from "@/hooks/use-profiles";
import { useMyUsernameClaim, submitUsernameClaim, checkUsernameAvailability } from "@/hooks/use-username-claims";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useUserOrders } from "@/hooks/use-orders";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { useRewards } from "@/hooks/use-rewards";
import { AssetPicker, ServiceFormShell, LevelBadge, type OwnedAsset } from "@medialane/ui";
import { CreatorScoreInline } from "@/components/rewards/creator-score-inline";
import { getMedialaneClient } from "@/lib/medialane-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AtSign, CheckCircle2, Clock, XCircle, Loader2, LogOut, Settings as SettingsIcon,
  Globe, Twitter, MessageCircle, Send, ArrowUpRight, Gem, Tag, LayoutGrid, Trophy,
} from "lucide-react";
import { cn, resolveTokenImage } from "@/lib/utils";

type CheckState = "idle" | "checking" | "available" | "taken";

type ProfileForm = {
  displayName: string;
  bio: string;
  avatarImage: string;
  bannerImage: string;
  websiteUrl: string;
  twitterUrl: string;
  discordUrl: string;
  telegramUrl: string;
};

const CARD_FRAME_GRADIENT = "linear-gradient(135deg, #3b7bff, #8a5cf6 38%, #f6608f 70%, #fb8b46)";

function UsernameClaimInput({
  value, onChange, onCheck, onSubmit, checkState, checkReason, loading, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onCheck: () => void;
  onSubmit: () => void;
  checkState: CheckState;
  checkReason?: string;
  loading: boolean;
  disabled: boolean;
}) {
  const isAvailable = checkState === "available";
  const isChecking = checkState === "checking";

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <AtSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-7 tabular-nums"
            placeholder="yourname"
            value={value}
            onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
            maxLength={20}
            disabled={loading || isChecking}
            onKeyDown={(e) => e.key === "Enter" && !loading && !isChecking && (isAvailable ? onSubmit() : onCheck())}
          />
        </div>
        {isAvailable ? (
          <Button
            onClick={onSubmit}
            disabled={loading || disabled}
            className="bg-green-600 hover:bg-green-700 text-white shrink-0"
          >
            {loading ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Submitting…</> : `Claim @${value}`}
          </Button>
        ) : (
          <Button
            onClick={onCheck}
            disabled={isChecking || disabled || value.length < 3}
            variant="outline"
            className="shrink-0"
          >
            {isChecking ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Checking…</> : "Check"}
          </Button>
        )}
      </div>
      {checkState === "taken" && (
        <p className="text-xs text-destructive">{checkReason ?? "That username is not available."}</p>
      )}
      {checkState === "available" && (
        <p className="text-xs text-green-600 dark:text-green-500 font-medium">@{value} is available!</p>
      )}
    </div>
  );
}

/**
 * The creator profile as a Medialane collectible card — same brand-spectrum
 * frame + foil material + sheen as `MedialaneCollectionCard` (the live
 * preview on every mint form). Content mirrors the real `/creator/[username]`
 * hero exactly: a plain hero image (banner, falling back to avatar, then the
 * first owned asset — same priority the real page uses), no avatar circle
 * (io's hero doesn't render one either), name + level badge, bio, and all
 * four link icons. Vertical, self-contained, pure presentation — Save lives
 * with the form, not here.
 */
function ProfileLivePreview({
  form, approvedUsername, walletAddress, fallbackImage,
}: {
  form: ProfileForm;
  approvedUsername?: string | null;
  walletAddress?: string | null;
  /** First owned asset's image — the real page's last-resort hero fallback. */
  fallbackImage?: string | null;
}) {
  const displayName = form.displayName || "Your name";
  const heroUrl = resolveTokenImage(form.bannerImage) || resolveTokenImage(form.avatarImage) || fallbackImage || null;

  return (
    <div style={{ perspective: "1000px" }}>
      <div
        className="rounded-[24px] p-[1.5px] shadow-[0_16px_40px_-16px_rgba(91,76,230,0.45)]"
        style={{ background: CARD_FRAME_GRADIENT }}
      >
        <div className="ml-card-material relative rounded-[22.5px] overflow-hidden text-[#0a0e1f] dark:text-white ring-1 ring-inset ring-black/[0.06] dark:ring-white/[0.06]">
          <p className="relative px-5 pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a0e1f]/45 dark:text-white/45">
            Public preview
          </p>

          {/* Hero — same image + fallback priority as the real creator page */}
          <div className="px-2.5 pt-2.5">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[16px] ring-1 ring-black/10 dark:ring-white/10">
              {heroUrl ? (
                <Image src={heroUrl} alt="" fill unoptimized className="object-cover" />
              ) : (
                <div className="h-full w-full" style={{ background: CARD_FRAME_GRADIENT, opacity: 0.9 }} />
              )}
            </div>
          </div>

          {/* Holographic sheen — same as the mint preview card */}
          <div
            aria-hidden
            className="ml-card-sheen pointer-events-none absolute inset-0 opacity-40"
          />

          <div className="relative px-5 pt-3 pb-5 space-y-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="truncate text-[18px] font-bold leading-snug">{displayName}</p>
                {walletAddress && <CreatorScoreInline address={walletAddress} />}
              </div>
              {approvedUsername ? (
                <p className="text-[11px] tabular-nums text-[#0a0e1f]/55 dark:text-white/55">@{approvedUsername}</p>
              ) : (
                <p className="text-[11px] text-[#0a0e1f]/40 dark:text-white/40">No username yet</p>
              )}
            </div>

            {form.bio && (
              <p className="text-xs text-[#0a0e1f]/60 dark:text-white/60 leading-relaxed line-clamp-2">{form.bio}</p>
            )}

            {(form.websiteUrl || form.twitterUrl || form.discordUrl || form.telegramUrl) && (
              <div className="flex items-center gap-2">
                {form.websiteUrl && (
                  <span className="h-7 w-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#0a0e1f]/60 dark:text-white/60">
                    <Globe className="h-3.5 w-3.5" />
                  </span>
                )}
                {form.twitterUrl && (
                  <span className="h-7 w-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#0a0e1f]/60 dark:text-white/60">
                    <Twitter className="h-3.5 w-3.5" />
                  </span>
                )}
                {form.discordUrl && (
                  <span className="h-7 w-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#0a0e1f]/60 dark:text-white/60">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </span>
                )}
                {form.telegramUrl && (
                  <span className="h-7 w-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#0a0e1f]/60 dark:text-white/60">
                    <Send className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            )}

            <div className="my-1 h-px bg-black/10 dark:bg-white/10" />

            <div className="flex items-center gap-2">
              <span aria-hidden className="h-3.5 w-3.5 rounded-full shrink-0" style={{ background: CARD_FRAME_GRADIENT }} />
              <span className="text-[9px] font-bold tracking-[0.18em] text-[#0a0e1f]/50 dark:text-white/50">MEDIALANE</span>
              {approvedUsername && (
                <Link
                  href={`/creator/${approvedUsername}`}
                  className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-[#0a0e1f]/70 dark:text-white/70 hover:underline"
                >
                  View profile
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SnapshotStat({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  return (
    <div className="flex-1 min-w-0 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground/70">
        <Icon className="h-3 w-3" />
      </div>
      <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[10.5px] text-muted-foreground">{label}</p>
    </div>
  );
}

/** Portfolio at a glance — same three counts the portfolio pages track, so this stays a quick pulse-check rather than a second portfolio surface. */
function PortfolioSnapshot({ assets, listings, collections }: { assets: number; listings: number; collections: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Portfolio</p>
        <p className="mt-0.5 text-xs text-muted-foreground/70">What you own on Medialane</p>
      </div>
      <div className="flex items-center border-t border-border/60 pt-4">
        <SnapshotStat icon={Gem} value={assets} label="Assets" />
        <SnapshotStat icon={Tag} value={listings} label="Listed" />
        <SnapshotStat icon={LayoutGrid} value={collections} label="Collections" />
      </div>
      <Link
        href="/portfolio"
        className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        View portfolio
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/** Rewards at a glance — mirrors the same level/XP data the portfolio header and /rewards page read from `useRewards`. */
function RewardsSnapshot({ address }: { address?: string | null }) {
  const { data: rewards } = useRewards(address);
  if (!rewards) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rewards</p>
          <p className="mt-0.5 text-xs text-muted-foreground/70">Your creator journey</p>
        </div>
        <Trophy className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <div className="border-t border-border/60 pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <LevelBadge level={rewards.currentLevel} name={rewards.currentLevelName} badgeColor={rewards.badgeColor} />
          <span className="text-xs tabular-nums text-muted-foreground">{rewards.totalXp.toLocaleString()} XP</span>
        </div>
        <div className="h-2 rounded-full bg-muted-foreground/15 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${rewards.progressPct}%`, background: CARD_FRAME_GRADIENT }}
          />
        </div>
        {rewards.nextLevel && (
          <p className="text-[10.5px] text-muted-foreground">
            {rewards.nextLevel.xpRequired - rewards.totalXp} XP to Lv.{rewards.nextLevel.level} {rewards.nextLevel.name}
          </p>
        )}
      </div>
      <Link
        href="/rewards"
        className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        View rewards
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

export default function SettingsContent() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { walletAddress } = useSessionKey();
  const { profile, isLoading: profileLoading, mutate } = useCreatorProfile(walletAddress ?? undefined);
  const { username: approvedUsername, claim, mutate: mutateClaim } = useMyUsernameClaim();
  const { tokens: ownedTokens, isLoading: assetsLoading } = useTokensByOwner(walletAddress ?? null, 1, 100);
  const { orders } = useUserOrders(walletAddress ?? null);
  const { collections } = useCollectionsByOwner(walletAddress ?? null);
  const ownedAssets: OwnedAsset[] = ownedTokens.map((t) => ({
    contractAddress: t.contractAddress,
    tokenId: t.tokenId,
    name: t.metadata?.name ?? `Token #${t.tokenId}`,
    image: resolveTokenImage(t.metadata?.image),
  }));
  const activeListings = orders.filter((o) => o.status === "ACTIVE" && o.offer.itemType !== "ERC20");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [claimInput, setClaimInput] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<"idle" | "success" | "error">("idle");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [checkReason, setCheckReason] = useState<string | undefined>();
  const [form, setForm] = useState<ProfileForm>({
    displayName: "", bio: "", avatarImage: "", bannerImage: "",
    websiteUrl: "", twitterUrl: "", discordUrl: "", telegramUrl: "",
  });

  useEffect(() => {
    if (profile) setForm({
      displayName: profile.displayName ?? "",
      bio: profile.bio ?? "",
      avatarImage: profile.avatarImage ?? "",
      bannerImage: profile.bannerImage ?? "",
      websiteUrl: profile.websiteUrl ?? "",
      twitterUrl: profile.twitterUrl ?? "",
      discordUrl: profile.discordUrl ?? "",
      telegramUrl: profile.telegramUrl ?? "",
    });
  }, [profile]);

  async function handleCheckUsername() {
    if (!claimInput.trim()) return;
    setCheckState("checking");
    setCheckReason(undefined);
    try {
      const result = await checkUsernameAvailability(claimInput);
      setCheckState(result.available ? "available" : "taken");
      if (!result.available) setCheckReason(result.reason);
    } catch {
      setCheckState("idle");
      setClaimError("Could not check username availability");
    }
  }

  async function handleClaimUsername() {
    if (!claimInput.trim()) return;
    setClaiming(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const notifyEmail = user?.primaryEmailAddress?.emailAddress;
      const result = await submitUsernameClaim(claimInput.trim().toLowerCase(), token, notifyEmail);
      if (result.error) {
        setClaimStatus("error");
        setClaimError(result.error);
      } else {
        setClaimStatus("success");
        setClaimInput("");
        setCheckState("idle");
        setCheckReason(undefined);
        await mutateClaim();
      }
    } catch {
      setClaimStatus("error");
      setClaimError("Failed to submit claim");
    } finally {
      setClaiming(false);
    }
  }

  async function handleSave() {
    if (!walletAddress) return;
    const urlFields = ["websiteUrl", "twitterUrl", "discordUrl", "telegramUrl"] as const;
    const hasInvalidUrl = urlFields.some((k) => !isValidUrl(form[k]));
    if (hasInvalidUrl) {
      setSaveStatus("error");
      setSaveError("All URL fields must start with http://, https://, or ipfs://");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      // Backend Zod schema rejects empty strings for URL fields — send null to clear them
      const payload = {
        displayName: form.displayName || null,
        bio: form.bio || null,
        avatarImage: form.avatarImage || null,
        bannerImage: form.bannerImage || null,
        websiteUrl: form.websiteUrl || null,
        twitterUrl: form.twitterUrl || null,
        discordUrl: form.discordUrl || null,
        telegramUrl: form.telegramUrl || null,
      };
      // The SDK return type is the success shape; the backend can still send
      // an error object on validation failure, hence the inline union.
      const result = await getMedialaneClient().api.updateCreatorProfile(walletAddress, payload, token) as
        | { walletAddress: string }
        | { error?: string };
      if (!("walletAddress" in result) || !result.walletAddress) {
        throw new Error(("error" in result && result.error) ? result.error : "Save failed — please try again");
      }
      await mutate(undefined, { revalidate: true });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (e: unknown) {
      setSaveStatus("error");
      setSaveError(e instanceof Error ? e.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  const URL_KEYS = new Set(["websiteUrl", "twitterUrl", "discordUrl", "telegramUrl"]);
  const isValidUrl = (v: string) =>
    !v || v.startsWith("http://") || v.startsWith("https://") || v.startsWith("ipfs://");

  const field = (
    key: keyof ProfileForm,
    label: string,
    placeholder = "",
    helper?: string
  ) => {
    const isUrl = URL_KEYS.has(key);
    const invalid = isUrl && !isValidUrl(form[key]);
    return (
      <div className="space-y-1.5">
        <Label htmlFor={key}>{label}</Label>
        <Input
          id={key}
          placeholder={placeholder}
          value={form[key]}
          onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
          className={invalid ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {invalid && <p className="text-xs text-destructive">Must start with http://, https://, or ipfs://</p>}
        {!invalid && helper && <p className="text-xs text-muted-foreground">{helper}</p>}
      </div>
    );
  };

  const headerProps = {
    icon: <SettingsIcon className="h-4 w-4 text-white" />,
    title: "Profile Settings",
    subtitle: "Manage your public creator identity.",
  };

  if (profileLoading || (walletAddress && !profile && profileLoading !== false)) {
    return (
      <ServiceFormShell {...headerProps}>
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </ServiceFormShell>
    );
  }

  return (
    <ServiceFormShell
      {...headerProps}
      aside={
        <div className="space-y-4">
          <ProfileLivePreview
            form={form}
            approvedUsername={approvedUsername}
            walletAddress={walletAddress}
            fallbackImage={ownedAssets[0]?.image}
          />
          <PortfolioSnapshot
            assets={ownedAssets.length}
            listings={activeListings.length}
            collections={collections.length}
          />
          <RewardsSnapshot address={walletAddress} />
        </div>
      }
    >
      <div className="space-y-8">
        {/* Username claim */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <AtSign className="h-4 w-4" />
              Creator Username
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Claim a unique handle for your shareable profile URL.
            </p>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            {/* Approved */}
            {approvedUsername && (
              <div className={cn(
                "rounded-xl border border-green-500/40 bg-green-500/5 p-4 flex items-start gap-3"
              )}>
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Username active</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Your profile is live at{" "}
                    <a
                      href={`/creator/${approvedUsername}`}
                      className="tabular-nums font-medium text-primary hover:underline"
                    >
                      medialane.io/creator/{approvedUsername}
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* Pending review */}
            {!approvedUsername && claim?.status === "PENDING" && (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">Claim under review</p>
                    <Badge variant="outline" className="border-yellow-500/40 text-yellow-700 dark:text-yellow-400 bg-yellow-500/10 text-[10px]">
                      Pending
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    <span className="tabular-nums font-medium text-foreground">@{claim.username}</span> is awaiting DAO review. You&apos;ll be notified by email once processed.
                  </p>
                </div>
              </div>
            )}

            {/* Rejected — allow retry */}
            {!approvedUsername && claim?.status === "REJECTED" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
                  <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Claim rejected</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      <span className="tabular-nums text-foreground">@{claim.username}</span> was not approved.
                      {claim.adminNotes && <span className="ml-1 italic">&ldquo;{claim.adminNotes}&rdquo;</span>}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">You can submit a new claim below.</p>
                  </div>
                </div>
                <UsernameClaimInput
                  value={claimInput}
                  onChange={(v) => { setClaimInput(v); setCheckState("idle"); setCheckReason(undefined); setClaimStatus("idle"); setClaimError(null); }}
                  onCheck={handleCheckUsername}
                  onSubmit={handleClaimUsername}
                  checkState={checkState}
                  checkReason={checkReason}
                  loading={claiming}
                  disabled={!walletAddress}
                />
                {claimStatus === "success" && (
                  <p className="text-sm text-emerald-500 mt-2">✓ Claim submitted — the Medialane DAO team will review it shortly.</p>
                )}
                {claimStatus === "error" && claimError && (
                  <p className="text-sm text-destructive mt-2">{claimError}</p>
                )}
              </div>
            )}

            {/* No claim yet */}
            {!approvedUsername && !claim && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Get a shareable URL like{" "}
                  <span className="tabular-nums text-foreground">medialane.io/creator/yourname</span>.
                  Claims are reviewed by the Medialane DAO team to prevent impersonation.
                </p>
                <UsernameClaimInput
                  value={claimInput}
                  onChange={(v) => { setClaimInput(v); setCheckState("idle"); setCheckReason(undefined); setClaimStatus("idle"); setClaimError(null); }}
                  onCheck={handleCheckUsername}
                  onSubmit={handleClaimUsername}
                  checkState={checkState}
                  checkReason={checkReason}
                  loading={claiming}
                  disabled={!walletAddress}
                />
                {claimStatus === "success" && (
                  <p className="text-sm text-emerald-500 mt-2">✓ Claim submitted — the Medialane DAO team will review it shortly.</p>
                )}
                {claimStatus === "error" && claimError && (
                  <p className="text-sm text-destructive mt-2">{claimError}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Identity */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Identity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Your public creator profile</p>
          </div>
          <div className="border-t border-border pt-4 space-y-4">
            {field("displayName", "Display name", "Your name or handle")}
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                placeholder="Tell the world about yourself and your work…"
              />
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Media</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Images for your creator profile</p>
          </div>
          <div className="border-t border-border pt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Avatar &amp; app theme</Label>
              <p className="text-xs text-muted-foreground">
                Pick one of your NFTs. It becomes your avatar and a subtle background theme across Medialane.
              </p>
              <AssetPicker
                assets={ownedAssets}
                isLoading={assetsLoading}
                selected={ownedAssets.find((a) => a.image === form.avatarImage) ?? null}
                onSelect={(asset) => setForm((f) => ({ ...f, avatarImage: asset.image ?? "" }))}
                emptyStateHref="/launchpad/single-editions"
                emptyStateLabel="Mint one"
              />
              <Link
                href="/launchpad/single-editions"
                className="inline-block text-xs font-medium text-foreground underline underline-offset-2"
              >
                Mint a new NFT to use as your theme
              </Link>
            </div>
            {field("bannerImage", "Banner image", "ipfs://Qm…", "IPFS or HTTPS URL, displayed at the top of your profile page")}
          </div>
        </div>

        {/* Links */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Links</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Your web presence</p>
          </div>
          <div className="border-t border-border pt-4 space-y-4">
            {field("websiteUrl", "Website", "https://…")}
            {field("twitterUrl", "Twitter / X", "https://twitter.com/…")}
            {field("discordUrl", "Discord", "https://discord.gg/…")}
            {field("telegramUrl", "Telegram", "https://t.me/…")}
          </div>
        </div>

        {/* Save — attached to the form, not the preview rail */}
        <div className="pt-4 border-t border-border flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving || !walletAddress || profileLoading} className="w-full sm:w-auto">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save changes"}
          </Button>
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-500">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
          {saveStatus === "error" && saveError && (
            <span className="text-sm text-destructive">{saveError}</span>
          )}
        </div>

        {/* Sign out */}
        <div className="space-y-4 pt-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Account</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your session</p>
          </div>
          <div className="border-t border-border pt-4">
            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={() => signOut({ redirectUrl: "/" })}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </ServiceFormShell>
  );
}
