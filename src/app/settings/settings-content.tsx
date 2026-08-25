"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { useCreatorProfile } from "@/hooks/use-profiles";
import { useMyUsernameClaim, submitUsernameClaim, checkUsernameAvailability } from "@/hooks/use-username-claims";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useUserOrders } from "@/hooks/use-orders";
import { useCollectionsByOwner } from "@/hooks/use-collections";
import { useRewards } from "@/hooks/use-rewards";
import { useMediaWallet } from "@/components/media-wallet/media-wallet-overlay";
import { AssetPicker, AddressDisplay, ServiceFormShell, LevelBadge, type OwnedAsset } from "@medialane/ui";
import { FastMint } from "@/components/launchpad/fast-mint";
import { EXPLORER_URL } from "@/lib/constants";
import { CreatorScoreInline } from "@/components/rewards/creator-score-inline";
import { getMedialaneClient } from "@/lib/medialane-client";
import { completeWalletDeployment } from "@/lib/wallet/complete-deployment";
import { WalletDeploymentDialog } from "@/components/wallet/wallet-deployment-dialog";
import { EmailVerifyDialog } from "@/components/settings/email-verify-dialog";
import { GuardianRecoverySection } from "@/components/settings/guardian-recovery-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AtSign, CheckCircle2, Clock, XCircle, Loader2, Settings as SettingsIcon,
  Globe, Twitter, MessageCircle, Send, ArrowUpRight, Gem, Tag, LayoutGrid, Trophy, Wallet,
  Mail, User, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { cn, resolveTokenImage } from "@/lib/utils";
import { friendlyErrorMessage } from "@/lib/friendly-error";

type CheckState = "idle" | "checking" | "available" | "taken";

const EMAIL_GATE_ERROR = "Verify your email to claim a username.";

function ClaimError({ error, onVerifyEmail }: { error: string; onVerifyEmail: () => void }) {
  if (error === EMAIL_GATE_ERROR) {
    return (
      <p className="text-sm text-destructive mt-2">
        {error}{" "}
        <button type="button" onClick={onVerifyEmail} className="underline font-medium hover:text-foreground">
          Verify email
        </button>
      </p>
    );
  }
  return <p className="text-sm text-destructive mt-2">{error}</p>;
}

type ProfileForm = {
  displayName: string;
  bio: string;
  avatarImage: string;
  websiteUrl: string;
  twitterUrl: string;
  discordUrl: string;
  telegramUrl: string;
};

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

function ProfileLivePreview({
  form, approvedUsername, walletAddress, fallbackImage,
}: {
  form: ProfileForm;
  approvedUsername?: string | null;
  walletAddress?: string | null;

  fallbackImage?: string | null;
}) {
  const displayName = form.displayName || "Your name";
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
          <p className="truncate text-[18px] font-bold leading-snug text-foreground">{displayName}</p>
          {approvedUsername ? (
            <p className="text-[11px] tabular-nums text-muted-foreground">@{approvedUsername}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground/60">No username yet</p>
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
            style={{ width: `${rewards.progressPct}%`, backgroundColor: rewards.badgeColor }}
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
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "account" ? "account" : "profile";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { address: walletAddress, hasWallet, isDeployed } = useWalletNativeSession();
  const { open: openWalletPanel } = useMediaWallet();
  const { getValidToken, signIn } = useSiwsToken();
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
    displayName: "", bio: "", avatarImage: "",
    websiteUrl: "", twitterUrl: "", discordUrl: "", telegramUrl: "",
  });
  const [emailStatus, setEmailStatus] = useState<{ email: string | null; verified: boolean } | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailDialogSkipInitialSend, setEmailDialogSkipInitialSend] = useState(false);
  const [emailEditOpen, setEmailEditOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailChangeStatus, setEmailChangeStatus] = useState<"idle" | "saving" | "error">("idle");
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);
  const [generatingWallet, setGeneratingWallet] = useState(false);
  const [generateWalletError, setGenerateWalletError] = useState<string | null>(null);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [fastMintOpen, setFastMintOpen] = useState(false);

  const [oldWalletToken, setOldWalletToken] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;
    (async () => {
      const token = getValidToken() ?? (await signIn());
      if (!token) return;
      const result = await getMedialaneClient().api.getMyWallet(token);
      if (result) setEmailStatus({ email: result.email ?? null, verified: result.emailVerified ?? false });
    })();
  }, [walletAddress, getValidToken, signIn]);


  useEffect(() => {
    if (profile) setForm({
      displayName: profile.displayName ?? "",
      bio: profile.bio ?? "",
      avatarImage: profile.avatarImage ?? "",
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
      const token = getValidToken() ?? (await signIn());
      if (!token) throw new Error("Not authenticated");
      const result = await submitUsernameClaim(claimInput.trim().toLowerCase(), token);
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
      const token = getValidToken() ?? (await signIn());
      if (!token) throw new Error("Not authenticated");

      const payload = {
        displayName: form.displayName || null,
        bio: form.bio || null,
        avatarImage: form.avatarImage || null,
        websiteUrl: form.websiteUrl || null,
        twitterUrl: form.twitterUrl || null,
        discordUrl: form.discordUrl || null,
        telegramUrl: form.telegramUrl || null,
      };

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
      setSaveError(friendlyErrorMessage(e, "Failed to save changes"));
    } finally {
      setSaving(false);
    }
  }

  async function handleEmailVerified(emailVerificationToken: string) {
    const token = getValidToken() ?? (await signIn());
    if (!token) throw new Error("Not authenticated");
    await getMedialaneClient().api.upsertMyWallet(token, { emailVerificationToken });
    setEmailStatus((s) => (s ? { ...s, verified: true } : s));
  }

  async function handleChangeEmail() {
    const email = emailInput.trim();
    if (!email) return;
    setEmailChangeStatus("saving");
    setEmailChangeError(null);
    try {
      const token = getValidToken() ?? (await signIn());
      if (!token) throw new Error("Not authenticated");
      const result = await getMedialaneClient().api.changeMyEmail(email, token);
      setEmailStatus({ email: result.email, verified: result.emailVerified });
      setEmailEditOpen(false);
      setEmailInput("");
      setEmailChangeStatus("idle");
      setEmailDialogSkipInitialSend(true);
      setEmailDialogOpen(true);
    } catch (err) {
      setEmailChangeStatus("error");
      setEmailChangeError(friendlyErrorMessage(err, "Failed to update email"));
    }
  }

  async function attachNewWallet(newWalletSiwsToken: string, authToken: string) {
    const res = await fetch("/api/proxy/v1/users/me/generate-wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ newWalletSiwsToken }),
    });
    if (!res.ok) throw new Error("Failed to switch to the new wallet");
    window.location.reload();
  }

  async function handleGenerateNewWallet() {
    setGeneratingWallet(true);
    setGenerateWalletError(null);

    let authToken: string | null = null;
    try {
      authToken = getValidToken() ?? (await signIn());
      if (!authToken) throw new Error("Not authenticated");
    } catch {
      setGenerateWalletError("Something went wrong. Please try again.");
      setGeneratingWallet(false);
      return;
    }
    setOldWalletToken(authToken);

    try {
      const { siwsToken: newWalletSiwsToken } = await completeWalletDeployment(() => {}, { forceNew: true });
      await attachNewWallet(newWalletSiwsToken, authToken);
    } catch {

      setResumeDialogOpen(true);
    } finally {
      setGeneratingWallet(false);
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
    title: "Settings",
    subtitle: "Your public profile and your account.",
  };

  if (!hasWallet) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-24 text-center space-y-4">
        <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">Secure your account</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Secure your account to manage your creator settings.
        </p>
        <div className="btn-border-animated inline-block p-[1px] rounded-lg">
          <Button
            asChild
            className="bg-transparent text-white rounded-[7px] hover:bg-transparent hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Link href="/connect?redirect_url=/settings">Get started</Link>
          </Button>
        </div>
      </div>
    );
  }

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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-8 mt-0">

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
                  <ClaimError error={claimError} onVerifyEmail={() => setActiveTab("account")} />
                )}
              </div>
            )}

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
                  <ClaimError error={claimError} onVerifyEmail={() => setActiveTab("account")} />
                )}
              </div>
            )}
          </div>
        </div>

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
                onMintClick={() => setFastMintOpen(true)}
              />
            </div>
          </div>
        </div>

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
        </TabsContent>

        <TabsContent value="account" className="space-y-8 mt-0">

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                Email
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Used for account notices and signing back in.
              </p>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              {emailEditOpen ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input
                      type="email"
                      value={emailInput}
                      onChange={(e) => { setEmailInput(e.target.value); setEmailChangeStatus("idle"); setEmailChangeError(null); }}
                      placeholder="you@example.com"
                      disabled={emailChangeStatus === "saving"}
                      className="max-w-xs"
                      onKeyDown={(e) => e.key === "Enter" && emailInput.trim() && void handleChangeEmail()}
                    />
                    <Button onClick={handleChangeEmail} disabled={!emailInput.trim() || emailChangeStatus === "saving"} size="sm">
                      {emailChangeStatus === "saving" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEmailEditOpen(false); setEmailInput(""); setEmailChangeStatus("idle"); setEmailChangeError(null); }}
                      disabled={emailChangeStatus === "saving"}
                    >
                      Cancel
                    </Button>
                  </div>
                  {emailChangeStatus === "error" && emailChangeError && (
                    <p className="text-sm text-destructive">{emailChangeError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">You&apos;ll need to verify the new email.</p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {emailStatus?.email ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-foreground truncate">{emailStatus.email}</span>
                      {emailStatus.verified ? (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px] gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-yellow-500/40 text-yellow-700 dark:text-yellow-400 bg-yellow-500/10 text-[10px] gap-1">
                          <Clock className="h-3 w-3" /> Not verified
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No email on this account yet.</p>
                  )}
                  <div className="flex items-center gap-2">
                    {emailStatus?.email && !emailStatus.verified && (
                      <Button onClick={() => { setEmailDialogSkipInitialSend(false); setEmailDialogOpen(true); }} variant="outline" size="sm">
                        Verify email
                      </Button>
                    )}
                    <Button onClick={() => { setEmailEditOpen(true); setEmailInput(emailStatus?.email ?? ""); }} variant="ghost" size="sm">
                      {emailStatus?.email ? "Change email" : "Add email"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Wallet className="h-4 w-4" />
                Wallet
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Your self-custody Starknet wallet</p>
            </div>
            <div className="border-t border-border pt-4 space-y-4">
              {walletAddress && (
                <>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <AddressDisplay address={walletAddress} chars={6} showCopy />
                    {isDeployed === false ? (
                      <Badge variant="outline" className="border-yellow-500/40 text-yellow-700 dark:text-yellow-400 bg-yellow-500/10 text-[10px] gap-1">
                        <ShieldAlert className="h-3 w-3" /> Deploying
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px] gap-1">
                        <ShieldCheck className="h-3 w-3" /> Deployed
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <Button onClick={() => openWalletPanel()} variant="outline" size="sm">
                      <Wallet className="mr-1.5 h-3.5 w-3.5" />
                      Open wallet
                    </Button>
                    <a
                      href={`${EXPLORER_URL}/contract/${walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      View on Voyager
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>
                </>
              )}
            </div>
            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                If this account&apos;s wallet isn&apos;t one you set up yourself, you can create a new one.
              </p>
              {generateWalletError && <p className="text-sm text-destructive">{generateWalletError}</p>}
              <Button onClick={handleGenerateNewWallet} disabled={generatingWallet} variant="outline" size="sm">
                {generatingWallet ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Generate a new wallet
              </Button>
            </div>
          </div>

          {walletAddress && <GuardianRecoverySection walletAddress={walletAddress} />}
        </TabsContent>
      </Tabs>

      {emailStatus?.email && (
        <EmailVerifyDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          email={emailStatus.email}
          onVerified={handleEmailVerified}
          skipInitialSend={emailDialogSkipInitialSend}
        />
      )}

      <FastMint
        presentation="dialog"
        open={fastMintOpen}
        onClose={() => setFastMintOpen(false)}
        mediaKindLock="image"
        onMinted={(asset) => {
          setForm((f) => ({ ...f, avatarImage: asset.image ?? "" }));
          setFastMintOpen(false);
        }}
      />

      <WalletDeploymentDialog
        open={resumeDialogOpen}
        onOpenChange={setResumeDialogOpen}
        onComplete={async ({ siwsToken }) => {
          if (!oldWalletToken) return;
          await attachNewWallet(siwsToken, oldWalletToken);
        }}
      />
    </ServiceFormShell>
  );
}
