"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useCreatorProfile } from "@/hooks/use-profiles";
import { getMedialaneClient } from "@/lib/medialane-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ProfileSettingsPage() {
  const { getToken } = useAuth();
  const { walletAddress } = useSessionKey();
  const { profile, mutate } = useCreatorProfile(walletAddress ?? undefined);
  const [saving, setSaving] = useState(false);
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

  const field = (key: keyof typeof form, label: string, placeholder = "") => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input id={key} placeholder={placeholder} value={form[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Creator Profile</h1>
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
