"use client";

import { use, useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useCollection } from "@/hooks/use-collections";
import { useCollectionProfile } from "@/hooks/use-profiles";
import { getMedialaneClient } from "@/lib/medialane-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock } from "lucide-react";
import { toast } from "sonner";

interface Props { params: Promise<{ contract: string }> }

export default function CollectionSettingsPage({ params }: Props) {
  const { contract } = use(params);
  const { getToken } = useAuth();
  const { walletAddress } = useSessionKey();
  const { collection, isLoading: collectionLoading } = useCollection(contract);
  const { profile, isLoading: profileLoading, mutate } = useCollectionProfile(contract);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: "", description: "", image: "", bannerImage: "",
    websiteUrl: "", twitterUrl: "", discordUrl: "", telegramUrl: "",
    gatedContentTitle: "", gatedContentUrl: "", gatedContentType: "" as string,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName ?? "",
        description: profile.description ?? "",
        image: profile.image ?? "",
        bannerImage: profile.bannerImage ?? "",
        websiteUrl: profile.websiteUrl ?? "",
        twitterUrl: profile.twitterUrl ?? "",
        discordUrl: profile.discordUrl ?? "",
        telegramUrl: profile.telegramUrl ?? "",
        gatedContentTitle: "",
        gatedContentUrl: "",
        gatedContentType: "",
      });
    }
  }, [profile]);

  const isOwner = walletAddress && collection?.owner &&
    walletAddress.toLowerCase() === collection.owner.toLowerCase();

  if (!collectionLoading && collection && !isOwner) {
    return (
      <div className="py-8">
        <p className="text-muted-foreground">You don&apos;t have permission to edit this collection.</p>
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const payload = {
        ...form,
        gatedContentType: form.gatedContentType || null,
        gatedContentUrl: form.gatedContentUrl || null,
        gatedContentTitle: form.gatedContentTitle || null,
      };
      await getMedialaneClient().api.updateCollectionProfile(contract, payload, token);
      await mutate();
      toast.success("Collection profile updated");
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  const field = (
    key: keyof typeof form,
    label: string,
    placeholder = "",
    helper?: string
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
      />
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Collection Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Update your collection profile and links.</p>
      </div>

      {/* Identity */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Identity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Basic information about your collection</p>
        </div>
        <div className="border-t border-border pt-4 space-y-4">
          {field("displayName", "Display name", collection?.name ?? "Collection name")}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              placeholder="Tell people about your collection…"
            />
          </div>
        </div>
      </div>

      {/* Media */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Media</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Images for your collection</p>
        </div>
        <div className="border-t border-border pt-4 space-y-4">
          {field("image", "Cover image", "ipfs://Qm…", "IPFS or HTTPS URL, e.g. ipfs://Qm…")}
          {field("bannerImage", "Banner image", "ipfs://Qm…", "IPFS or HTTPS URL, displayed at the top of your collection page")}
        </div>
      </div>

      {/* Links */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Links</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Your collection&apos;s web presence</p>
        </div>
        <div className="border-t border-border pt-4 space-y-4">
          {field("websiteUrl", "Website", "https://…")}
          {field("twitterUrl", "Twitter / X", "https://twitter.com/…")}
          {field("discordUrl", "Discord", "https://discord.gg/…")}
          {field("telegramUrl", "Telegram", "https://t.me/…")}
        </div>
      </div>

      {/* Gated Content */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Token-Gated Content</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 ml-6">
            Exclusive content unlocked only for holders of this collection.
          </p>
        </div>
        <div className="border-t border-border pt-4 space-y-4">
          {field("gatedContentTitle", "Content title", "e.g. Exclusive Track, Behind the Scenes…", "Shown to holders on your collection page")}
          {field("gatedContentUrl", "Content URL", "https://…", "Direct link to the content — video, audio, stream, document, or any URL. Leave blank to disable.")}
          <div className="space-y-1.5">
            <Label>Content type</Label>
            <Select
              value={form.gatedContentType || ""}
              onValueChange={(v) => setForm(f => ({ ...f, gatedContentType: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIDEO">Video</SelectItem>
                <SelectItem value="AUDIO">Audio</SelectItem>
                <SelectItem value="STREAM">Live stream</SelectItem>
                <SelectItem value="DOCUMENT">Document</SelectItem>
                <SelectItem value="LINK">Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving || collectionLoading || profileLoading}>
        {saving ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  );
}
