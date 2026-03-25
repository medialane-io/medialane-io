"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useCreatorProfile } from "@/hooks/use-profiles";
import { useMyUsernameClaim, submitUsernameClaim, checkUsernameAvailability } from "@/hooks/use-username-claims";
import { getMedialaneClient } from "@/lib/medialane-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AtSign, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckState = "idle" | "checking" | "available" | "taken";

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
            className="pl-7 font-mono"
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

export default function ProfileSettingsPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { walletAddress } = useSessionKey();
  const { profile, mutate } = useCreatorProfile(walletAddress ?? undefined);
  const { username: approvedUsername, claim, mutate: mutateClaim } = useMyUsernameClaim();
  const [saving, setSaving] = useState(false);
  const [claimInput, setClaimInput] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [checkReason, setCheckReason] = useState<string | undefined>();
  const [form, setForm] = useState({
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
      toast.error("Could not check username availability");
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
        toast.error(result.error);
      } else {
        toast.success("Username claim submitted — the Medialane DAO team will review it shortly.");
        setClaimInput("");
        setCheckState("idle");
        setCheckReason(undefined);
        await mutateClaim();
      }
    } catch {
      toast.error("Failed to submit claim");
    } finally {
      setClaiming(false);
    }
  }

  async function handleSave() {
    if (!walletAddress) return;
    const urlFields = ["websiteUrl", "twitterUrl", "discordUrl", "telegramUrl"] as const;
    const hasInvalidUrl = urlFields.some((k) => !isValidUrl(form[k]));
    if (hasInvalidUrl) {
      toast.error("All URL fields must start with http://, https://, or ipfs://");
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await getMedialaneClient().api.updateCreatorProfile(walletAddress, form, token);
      await mutate(undefined, { revalidate: true });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  const URL_KEYS = new Set(["websiteUrl", "twitterUrl", "discordUrl", "telegramUrl"]);
  const isValidUrl = (v: string) =>
    !v || v.startsWith("http://") || v.startsWith("https://") || v.startsWith("ipfs://");

  const field = (
    key: keyof typeof form,
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

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Profile Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your public creator identity.</p>
      </div>

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
                    className="font-mono font-medium text-primary hover:underline"
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
                  <span className="font-mono font-medium text-foreground">@{claim.username}</span> is awaiting DAO review. You&apos;ll be notified by email once processed.
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
                    <span className="font-mono text-foreground">@{claim.username}</span> was not approved.
                    {claim.adminNotes && <span className="ml-1 italic">&ldquo;{claim.adminNotes}&rdquo;</span>}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">You can submit a new claim below.</p>
                </div>
              </div>
              <UsernameClaimInput
                value={claimInput}
                onChange={(v) => { setClaimInput(v); setCheckState("idle"); setCheckReason(undefined); }}
                onCheck={handleCheckUsername}
                onSubmit={handleClaimUsername}
                checkState={checkState}
                checkReason={checkReason}
                loading={claiming}
                disabled={!walletAddress}
              />
            </div>
          )}

          {/* No claim yet */}
          {!approvedUsername && !claim && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Get a shareable URL like{" "}
                <span className="font-mono text-foreground">medialane.io/creator/yourname</span>.
                Claims are reviewed by the Medialane DAO team to prevent impersonation.
              </p>
              <UsernameClaimInput
                value={claimInput}
                onChange={(v) => { setClaimInput(v); setCheckState("idle"); setCheckReason(undefined); }}
                onCheck={handleCheckUsername}
                onSubmit={handleClaimUsername}
                checkState={checkState}
                checkReason={checkReason}
                loading={claiming}
                disabled={!walletAddress}
              />
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
          {field("avatarImage", "Avatar image", "ipfs://Qm…", "IPFS or HTTPS URL")}
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

      <Button onClick={handleSave} disabled={saving || !walletAddress}>
        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Changes"}
      </Button>
    </div>
  );
}
