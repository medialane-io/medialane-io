"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useCreatorProfile } from "@/hooks/use-profiles";
import { useMyUsernameClaim, submitUsernameClaim } from "@/hooks/use-username-claims";
import { getMedialaneClient } from "@/lib/medialane-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AtSign, CheckCircle, Clock, XCircle } from "lucide-react";

export default function ProfileSettingsPage() {
  const { getToken } = useAuth();
  const { walletAddress } = useSessionKey();
  const { profile, mutate } = useCreatorProfile(walletAddress ?? undefined);
  const { username: approvedUsername, claim, mutate: mutateClaim } = useMyUsernameClaim();
  const [saving, setSaving] = useState(false);
  const [claimInput, setClaimInput] = useState("");
  const [claiming, setClaiming] = useState(false);
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

  async function handleClaimUsername() {
    if (!claimInput.trim()) return;
    setClaiming(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const result = await submitUsernameClaim(claimInput.trim().toLowerCase(), token);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Username claim submitted — the Medialane DAO team will review it shortly.");
        setClaimInput("");
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
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await getMedialaneClient().api.updateCreatorProfile(walletAddress, form, token);
      await mutate();
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  function UsernameClaimInput({ value, onChange, onSubmit, loading, disabled }: {
    value: string; onChange: (v: string) => void;
    onSubmit: () => void; loading: boolean; disabled: boolean;
  }) {
    return (
      <div className="flex gap-2">
        <div className="relative flex-1">
          <AtSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-7 font-mono"
            placeholder="yourname"
            value={value}
            onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
            maxLength={20}
            onKeyDown={(e) => e.key === "Enter" && !loading && onSubmit()}
          />
        </div>
        <Button onClick={onSubmit} disabled={loading || disabled || value.length < 3}>
          {loading ? "Submitting…" : "Request"}
        </Button>
      </div>
    );
  }

  const field = (key: keyof typeof form, label: string, placeholder = "") => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input id={key} placeholder={placeholder} value={form[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Creator Profile</h1>

      {/* ── Username claim ── */}
      <div className="glass rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <AtSign className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Creator Username</h2>
        </div>

        {approvedUsername ? (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Your username is </span>
            <a href={`/creator/${approvedUsername}`} className="font-mono font-medium text-primary hover:underline">
              @{approvedUsername}
            </a>
          </div>
        ) : claim?.status === "PENDING" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span>
              Your claim for <span className="font-mono font-medium">@{claim.username}</span> is pending DAO review.
            </span>
            <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 bg-yellow-500/10">Pending</Badge>
          </div>
        ) : claim?.status === "REJECTED" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>
                Your claim for <span className="font-mono">@{claim.username}</span> was rejected.
                {claim.adminNotes && <span className="ml-1 italic">&ldquo;{claim.adminNotes}&rdquo;</span>}
              </span>
            </div>
            <UsernameClaimInput
              value={claimInput}
              onChange={setClaimInput}
              onSubmit={handleClaimUsername}
              loading={claiming}
              disabled={!walletAddress}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Claim a unique username to get a shareable profile URL like{" "}
              <span className="font-mono text-foreground">medialane.io/creator/yourname</span>.
              Claims are reviewed by the Medialane DAO team to prevent impersonation.
            </p>
            <UsernameClaimInput
              value={claimInput}
              onChange={setClaimInput}
              onSubmit={handleClaimUsername}
              loading={claiming}
              disabled={!walletAddress}
            />
          </div>
        )}
      </div>

      {/* ── Profile fields ── */}
      <div className="space-y-4">
        {field("displayName", "Display Name", "Your name or handle")}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} />
        </div>
        {field("avatarImage", "Avatar (IPFS URI)", "ipfs://...")}
        {field("bannerImage", "Banner (IPFS URI)", "ipfs://...")}
        {field("websiteUrl", "Website")}
        {field("twitterUrl", "Twitter / X")}
        {field("discordUrl", "Discord")}
        {field("telegramUrl", "Telegram")}
      </div>
      <Button onClick={handleSave} disabled={saving || !walletAddress}>
        {saving ? "Saving\u2026" : "Save Changes"}
      </Button>
    </div>
  );
}
