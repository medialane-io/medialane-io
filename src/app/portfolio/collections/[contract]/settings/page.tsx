"use client";

import { use, useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useCollection } from "@/hooks/use-collections";
import { useCollectionProfile } from "@/hooks/use-profiles";
import { client } from "@/lib/medialane-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      });
    }
  }, [profile]);

  const isOwner = walletAddress && collection?.claimedBy &&
    walletAddress.toLowerCase() === collection.claimedBy.toLowerCase();

  if (!collectionLoading && collection && !isOwner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">You don&apos;t have permission to edit this collection.</p>
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await client.updateCollectionProfile(contract, form, token);
      await mutate();
      toast.success("Collection profile updated");
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
      <h1 className="text-2xl font-bold">Collection Settings</h1>
      <div className="space-y-4">
        {field("displayName", "Display Name", collection?.name ?? "")}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
        </div>
        {field("image", "Cover Image (IPFS URI)", "ipfs://...")}
        {field("bannerImage", "Banner Image (IPFS URI)", "ipfs://...")}
        {field("websiteUrl", "Website", "https://...")}
        {field("twitterUrl", "Twitter / X")}
        {field("discordUrl", "Discord")}
        {field("telegramUrl", "Telegram")}
      </div>
      <Button onClick={handleSave} disabled={saving || collectionLoading || profileLoading}>
        {saving ? "Saving\u2026" : "Save Changes"}
      </Button>
    </div>
  );
}
