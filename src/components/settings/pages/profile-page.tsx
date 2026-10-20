"use client";

import { AtSign, CheckCircle2, Loader2, User } from "lucide-react";
import { Button } from "@medialane/ui/button";
import { Input } from "@medialane/ui/input";
import { Label } from "@medialane/ui/label";
import { Skeleton } from "@medialane/ui/skeleton";
import { Textarea } from "@medialane/ui/textarea";
import { ProfileLivePreview } from "@/components/settings/profile-live-preview";
import { SettingsGate, SettingsPage, SettingsSection } from "@/components/settings/settings-page";
import { UsernameClaimSection } from "@/components/settings/username-claim-section";
import type { ProfileForm } from "@/components/settings/types";
import { useProfileForm } from "@/hooks/use-profile-form";
import { useMyUsernameClaim } from "@/hooks/use-username-claims";
import { isValidUrl, URL_FIELDS } from "@/lib/settings/profile";

const URL_KEYS = new Set<string>(URL_FIELDS);

export default function ProfileSettingsPage() {
  const { address, isLoading, form, setField, saving, saveStatus, saveError, save } = useProfileForm();
  const { username: approvedUsername } = useMyUsernameClaim();

  const field = (key: keyof ProfileForm, label: string, placeholder = "") => {
    const invalid = URL_KEYS.has(key) && !isValidUrl(form[key]);
    return (
      <div className="space-y-1.5">
        <Label htmlFor={key}>{label}</Label>
        <Input
          id={key}
          placeholder={placeholder}
          value={form[key]}
          onChange={(e) => setField(key, e.target.value)}
          className={invalid ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {invalid ? <p className="text-xs text-destructive">Must start with http://, https://, or ipfs://</p> : null}
      </div>
    );
  };

  return (
    <SettingsGate>
      <SettingsPage
        title="Profile"
        subtitle="Your username, name and links."
        icon={<User className="h-4 w-4 text-white" />}
        aside={
          <ProfileLivePreview form={form} approvedUsername={approvedUsername} walletAddress={address} fallbackImage={undefined} />
        }
      >
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <SettingsSection icon={AtSign} title="Username" description="Claim a unique handle for your shareable profile URL.">
              <UsernameClaimSection />
            </SettingsSection>

            <SettingsSection title="Identity" description="Your public profile">
              {field("name", "Name", "Your name")}
              <div className="space-y-1.5">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => setField("bio", e.target.value)}
                  rows={3}
                  placeholder="Tell the world about yourself and your work…"
                />
              </div>
            </SettingsSection>

            <SettingsSection title="Links" description="Your web presence">
              {field("websiteUrl", "Website", "https://…")}
              {field("twitterUrl", "Twitter / X", "https://twitter.com/…")}
              {field("discordUrl", "Discord", "https://discord.gg/…")}
              {field("telegramUrl", "Telegram", "https://t.me/…")}
            </SettingsSection>

            <div className="flex items-center gap-3 border-t border-border pt-4">
              <Button onClick={save} disabled={saving || !address} className="w-full sm:w-auto">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
              {saveStatus === "saved" ? (
                <span className="flex items-center gap-1.5 text-sm text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" /> Saved
                </span>
              ) : null}
              {saveStatus === "error" && saveError ? <span className="text-sm text-destructive">{saveError}</span> : null}
            </div>
          </>
        )}
      </SettingsPage>
    </SettingsGate>
  );
}
