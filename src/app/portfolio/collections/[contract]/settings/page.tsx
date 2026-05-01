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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  User, Image as ImageIcon, Globe, Twitter, MessageCircle, Send,
  Lock, Unlock, Sparkles, ShieldCheck, CheckCircle2, ExternalLink,
  Video, Music, Radio, FileText, Link2, Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Props { params: Promise<{ contract: string }> }

const DESC_MAX = 500;

const CONTENT_TYPES = [
  { value: "VIDEO",    label: "Video",       icon: Video,    hint: "YouTube, Vimeo, or any video URL" },
  { value: "AUDIO",    label: "Audio",        icon: Music,    hint: "Spotify, SoundCloud, MP3 link…" },
  { value: "STREAM",   label: "Live stream",  icon: Radio,    hint: "Twitch, YouTube Live, etc." },
  { value: "DOCUMENT", label: "Document",     icon: FileText, hint: "PDF, Notion, Google Doc…" },
  { value: "LINK",     label: "Link",         icon: Link2,    hint: "Any URL" },
];

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-5 space-y-4", className)}>
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  badge,
  iconClass = "text-muted-foreground",
  bgClass = "bg-muted",
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  iconClass?: string;
  bgClass?: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-1">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", bgClass)}>
        <Icon className={cn("h-4 w-4", iconClass)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {badge}
        </div>
        {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

function HelperText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>;
}

export default function CollectionSettingsPage({ params }: Props) {
  const { contract } = use(params);
  const { getToken } = useAuth();
  const { walletAddress } = useSessionKey();
  const { collection, isLoading: collectionLoading } = useCollection(contract);
  const { profile, isLoading: profileLoading, mutate } = useCollectionProfile(contract);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    displayName: "",
    description: "",
    image: "",
    bannerImage: "",
    websiteUrl: "",
    twitterUrl: "",
    discordUrl: "",
    telegramUrl: "",
    gatedEnabled: false,
    gatedContentTitle: "",
    gatedContentUrl: "",
    gatedContentType: "",
  });

  useEffect(() => {
    if (profile) {
      setForm(f => ({
        ...f,
        displayName: profile.displayName ?? "",
        description: profile.description ?? "",
        image: profile.image ?? "",
        bannerImage: profile.bannerImage ?? "",
        websiteUrl: profile.websiteUrl ?? "",
        twitterUrl: profile.twitterUrl ?? "",
        discordUrl: profile.discordUrl ?? "",
        telegramUrl: profile.telegramUrl ?? "",
        gatedEnabled: profile.hasGatedContent,
        gatedContentTitle: profile.gatedContentTitle ?? "",
      }));
    }
  }, [profile]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const isOwner = walletAddress && collection?.owner &&
    walletAddress.toLowerCase() === collection.owner.toLowerCase();

  const isLoading = collectionLoading || profileLoading;
  const descLen = form.description.length;

  if (!collectionLoading && collection && !isOwner) {
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Owner access only</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Only the collection owner can access settings. If you believe this is yours,
          visit your portfolio to claim it.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/portfolio/collections">Go to my collections</Link>
        </Button>
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const payload = {
        displayName: form.displayName || null,
        description: form.description || null,
        image: form.image || null,
        bannerImage: form.bannerImage || null,
        websiteUrl: form.websiteUrl || null,
        twitterUrl: form.twitterUrl || null,
        discordUrl: form.discordUrl || null,
        telegramUrl: form.telegramUrl || null,
        gatedContentTitle: form.gatedEnabled ? (form.gatedContentTitle || null) : null,
        gatedContentUrl: form.gatedEnabled ? (form.gatedContentUrl || null) : null,
        gatedContentType: form.gatedEnabled ? (form.gatedContentType || null) : null,
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

  const selectedContentType = CONTENT_TYPES.find(t => t.value === form.gatedContentType);

  return (
    <div className="space-y-6 max-w-2xl pb-16">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold">Collection Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize how your collection appears on Medialane and manage exclusive content for your community.
        </p>
        {collection && (
          <Link
            href={`/collections/${contract}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            View collection page
          </Link>
        )}
      </div>

      {/* ── Identity ── */}
      <SectionCard>
        <SectionHeader
          icon={User}
          title="Identity"
          description="Your collection's public name and description. A complete profile builds trust with collectors."
          badge={
            profile?.displayName ? (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-1 text-emerald-500 border-emerald-500/30">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Named
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-1 text-amber-500 border-amber-500/30">
                <Info className="h-2.5 w-2.5" />
                Add a name
              </Badge>
            )
          }
        />
        <div className="space-y-4 pt-1 border-t border-border">
          <FieldRow>
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              placeholder={collection?.name ?? "My Collection"}
              value={form.displayName}
              onChange={set("displayName")}
              disabled={isLoading}
            />
            <HelperText>
              Shown on your collection page and search results. Uses the on-chain name by default.
            </HelperText>
          </FieldRow>
          <FieldRow>
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <span className={cn("text-[10px] tabular-nums", descLen > DESC_MAX ? "text-destructive" : "text-muted-foreground")}>
                {descLen}/{DESC_MAX}
              </span>
            </div>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => {
                if (e.target.value.length <= DESC_MAX) set("description")(e);
              }}
              rows={4}
              placeholder="Tell collectors what makes this collection special — the story, the art style, the community…"
              disabled={isLoading}
            />
          </FieldRow>
        </div>
      </SectionCard>

      {/* ── Media ── */}
      <SectionCard>
        <SectionHeader
          icon={ImageIcon}
          title="Media"
          description="Images shown on your collection page. Use IPFS URIs (ipfs://Qm…) or direct HTTPS URLs."
        />
        <div className="space-y-4 pt-1 border-t border-border">
          <FieldRow>
            <Label htmlFor="image">Cover image</Label>
            <Input
              id="image"
              placeholder="ipfs://Qm… or https://…"
              value={form.image}
              onChange={set("image")}
              disabled={isLoading}
            />
            <HelperText>Square or portrait image shown on collection cards across the marketplace.</HelperText>
          </FieldRow>
          <FieldRow>
            <Label htmlFor="bannerImage">Banner image</Label>
            <Input
              id="bannerImage"
              placeholder="ipfs://Qm… or https://…"
              value={form.bannerImage}
              onChange={set("bannerImage")}
              disabled={isLoading}
            />
            <HelperText>Wide image displayed as the hero banner at the top of your collection page. Recommended 1500×500 px.</HelperText>
          </FieldRow>
        </div>
      </SectionCard>

      {/* ── Links ── */}
      <SectionCard>
        <SectionHeader
          icon={Globe}
          title="Links"
          description="Social and community links shown to collectors visiting your page."
        />
        <div className="space-y-4 pt-1 border-t border-border">
          {([
            { key: "websiteUrl" as const,  icon: Globe,          label: "Website",    placeholder: "https://myproject.xyz" },
            { key: "twitterUrl" as const,  icon: Twitter,        label: "Twitter / X", placeholder: "https://twitter.com/…" },
            { key: "discordUrl" as const,  icon: MessageCircle,  label: "Discord",    placeholder: "https://discord.gg/…" },
            { key: "telegramUrl" as const, icon: Send,           label: "Telegram",   placeholder: "https://t.me/…" },
          ] as const).map(({ key, icon: Icon, label, placeholder }) => (
            <FieldRow key={key}>
              <Label htmlFor={key} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                {label}
              </Label>
              <Input
                id={key}
                placeholder={placeholder}
                value={form[key]}
                onChange={set(key)}
                disabled={isLoading}
              />
            </FieldRow>
          ))}
        </div>
      </SectionCard>

      {/* ── Token-Gated Content ── */}
      <SectionCard className={form.gatedEnabled ? "border-emerald-500/30 bg-emerald-500/[0.03]" : ""}>
        <SectionHeader
          icon={Lock}
          title="Token-Gated Content"
          description="Reward your holders with exclusive content — only wallets that own a token from this collection can access it."
          iconClass={form.gatedEnabled ? "text-emerald-500" : "text-muted-foreground"}
          bgClass={form.gatedEnabled ? "bg-emerald-500/15" : "bg-muted"}
          badge={
            form.gatedEnabled ? (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-1 text-emerald-500 border-emerald-500/30">
                <Unlock className="h-2.5 w-2.5" />
                Active
              </Badge>
            ) : undefined
          }
        />

        <div className="pt-1 border-t border-border space-y-5">

          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {form.gatedEnabled ? "Exclusive content is enabled" : "Enable exclusive content"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {form.gatedEnabled
                  ? `Holders see an "Exclusive" tab on your collection page.`
                  : "Turn on to add a holder-only section to your collection page."}
              </p>
            </div>
            <Switch
              checked={form.gatedEnabled}
              onCheckedChange={(v) => setForm(f => ({ ...f, gatedEnabled: v }))}
              disabled={isLoading}
            />
          </div>

          {form.gatedEnabled && (
            <div className="space-y-4">

              <FieldRow>
                <Label htmlFor="gatedContentTitle">Content title</Label>
                <Input
                  id="gatedContentTitle"
                  placeholder="e.g. Exclusive Track, Behind the Scenes, Holders Chat…"
                  value={form.gatedContentTitle}
                  onChange={set("gatedContentTitle")}
                />
                <HelperText>
                  Displayed publicly as a teaser on your collection page — this title is visible to everyone,
                  but the actual content is only accessible to verified holders.
                </HelperText>
              </FieldRow>

              <FieldRow>
                <Label htmlFor="gatedContentUrl">Content URL</Label>
                <Input
                  id="gatedContentUrl"
                  placeholder="https://…"
                  value={form.gatedContentUrl}
                  onChange={set("gatedContentUrl")}
                />
                <HelperText>
                  The link holders will receive. This is kept private by the backend and never exposed publicly.
                  Works with any URL — video, audio, document, community link, etc.
                </HelperText>
              </FieldRow>

              <FieldRow>
                <Label>Content type</Label>
                <Select
                  value={form.gatedContentType}
                  onValueChange={(v) => setForm(f => ({ ...f, gatedContentType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="What kind of content is this?" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(({ value, label, icon: Icon }) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedContentType && (
                  <HelperText>{selectedContentType.hint}</HelperText>
                )}
              </FieldRow>

              {/* Preview of what holders see */}
              {form.gatedContentTitle && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1.5">
                  <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">
                    Preview — what holders see
                  </p>
                  <p className="text-sm font-semibold">{form.gatedContentTitle || "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    Verified holders can access this content by visiting the Exclusive tab on your collection page.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* What it means */}
          {!form.gatedEnabled && (
            <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">How it works</p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <Sparkles className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                  Set a URL — a private video, Discord invite, audio file, or any link.
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                  Medialane verifies on-chain ownership before granting access. No spoofing.
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                  The content URL is never exposed publicly — only verified holders receive it.
                </li>
              </ul>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Collection Claim ── */}
      {!collectionLoading && collection && !collection.claimedBy && (
        <SectionCard className="border-amber-500/20 bg-amber-500/[0.03]">
          <SectionHeader
            icon={ShieldCheck}
            title="Claim your collection"
            description="Claim ownership to unlock profile editing, gated content, and verified creator status across Medialane."
            iconClass="text-amber-500"
            bgClass="bg-amber-500/15"
            badge={
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-1 text-amber-500 border-amber-500/30">
                Unclaimed
              </Badge>
            }
          />
          <div className="pt-1 border-t border-border space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              You're editing this collection because you&apos;re the on-chain owner, but it hasn't been
              officially claimed yet. Claiming ties your creator profile to this collection and unlocks
              additional creator tools.
            </p>
            <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-500" asChild>
              <Link href="/portfolio/collections">
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                Claim in my portfolio
              </Link>
            </Button>
          </div>
        </SectionCard>
      )}

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={saving || isLoading || descLen > DESC_MAX}
          className="min-w-[120px]"
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {descLen > DESC_MAX && (
          <p className="text-xs text-destructive">Description is too long.</p>
        )}
      </div>
    </div>
  );
}
