"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
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
  Video, Music, Radio, FileText, Link2, Info, Gem,
} from "lucide-react";
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

function SectionCard({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={cn("bg-card border border-border rounded-xl p-5 space-y-4", className)}>
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

function CollectionSlugClaimSection({
  contract,
  profile,
}: {
  contract: string;
  profile: { slug?: string | null } | null;
}) {
  const { getToken } = useAuth();
  const [slugInput, setSlugInput] = useState("");
  const [checkState, setCheckState] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [checkReason, setCheckReason] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      try {
        const token = await getToken({ template: "chipipay" });
        if (!token) return;
        const { claims } = await getMedialaneClient().api.getMyCollectionSlugClaims(token);
        const match = claims.find(
          (c) => c.contractAddress.toLowerCase() === contract.toLowerCase() && c.status === "PENDING"
        );
        if (match) setPendingSlug(match.slug);
      } catch {}
    })();
  }, [contract, getToken]);

  const handleCheck = async () => {
    const slug = slugInput.toLowerCase().trim();
    if (!slug) return;
    setCheckState("checking");
    setCheckReason(null);
    try {
      const result = await getMedialaneClient().api.checkCollectionSlugAvailability(slug);
      setCheckState(result.available ? "available" : "taken");
      if (!result.available) setCheckReason(result.reason ?? "That slug is not available.");
    } catch {
      setCheckState("invalid");
      setCheckReason("Unable to check availability. Try again.");
    }
  };

  const handleSubmit = async () => {
    const slug = slugInput.toLowerCase().trim();
    if (!slug || checkState !== "available") return;
    setSubmitState("submitting");
    setSubmitError(null);
    try {
      const token = await getToken({ template: "chipipay" });
      if (!token) throw new Error("Not authenticated");
      const { claim } = await getMedialaneClient().api.submitCollectionSlugClaim(contract, slug, token);
      setPendingSlug(claim.slug);
      setSubmitState("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit claim.";
      setSubmitError(msg);
      setSubmitState("error");
    }
  };

  if (profile?.slug) {
    return (
      <SectionCard className="border-emerald-500/20 bg-emerald-500/[0.02]">
        <SectionHeader
          icon={Gem}
          title="Collection URL"
          description={`medialane.io/collection/${profile.slug}`}
          iconClass="text-emerald-500"
          bgClass="bg-emerald-500/15"
          badge={
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-emerald-600 border-emerald-500/30">
              Active
            </Badge>
          }
        />
        <div className="pt-1 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Your collection is accessible at{" "}
            <span className="font-mono text-foreground">medialane.io/collection/{profile.slug}</span>
          </p>
        </div>
      </SectionCard>
    );
  }

  if (pendingSlug) {
    return (
      <SectionCard className="border-primary/20 bg-primary/[0.02]">
        <SectionHeader
          icon={Gem}
          title="Claim your collection URL"
          description={`medialane.io/collection/${pendingSlug}`}
          iconClass="text-primary"
          bgClass="bg-primary/15"
          badge={
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-amber-600 border-amber-500/30">
              Pending review
            </Badge>
          }
        />
        <div className="pt-1 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Your claim for{" "}
            <span className="font-mono text-foreground">medialane.io/collection/{pendingSlug}</span> is under
            review. You&apos;ll be notified once it&apos;s approved.
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard className="border-primary/20 bg-primary/[0.02]">
      <SectionHeader
        icon={Gem}
        title="Claim your collection URL"
        description="Reserve a unique URL — medialane.io/collection/your-name"
        iconClass="text-primary"
        bgClass="bg-primary/15"
      />
      <div className="pt-3 border-t border-border space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center rounded-lg border border-border bg-muted/40 px-3 py-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              medialane.io/collection/
            </span>
            <input
              type="text"
              className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/50 min-w-0"
              placeholder="your-name"
              value={slugInput}
              onChange={(e) => {
                setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""));
                setCheckState("idle");
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleCheck(); }}
              maxLength={20}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheck}
            disabled={!slugInput.trim() || checkState === "checking"}
            className="shrink-0"
          >
            {checkState === "checking" ? "Checking…" : "Check"}
          </Button>
        </div>

        {checkState === "available" && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-emerald-600 font-medium truncate">
              ✓ Available — <span className="font-mono">medialane.io/collection/{slugInput}</span>
            </p>
            <Button size="sm" onClick={handleSubmit} disabled={submitState === "submitting"} className="shrink-0">
              {submitState === "submitting" ? "Claiming…" : "Claim this URL"}
            </Button>
          </div>
        )}

        {(checkState === "taken" || checkState === "invalid") && (
          <p className="text-xs text-destructive">{checkReason ?? "That slug is not available."}</p>
        )}

        {submitState === "error" && (
          <p className="text-xs text-destructive">{submitError}</p>
        )}

        <p className="text-xs text-muted-foreground">
          3–20 characters, lowercase letters, numbers, underscores or hyphens. Claims are reviewed before
          going live.
        </p>
      </div>
    </SectionCard>
  );
}

export default function CollectionSettingsPage({ params }: Props) {
  const { contract } = use(params);
  const { getToken } = useAuth();
  const { walletAddress } = useSessionKey();
  const { collection, isLoading: collectionLoading } = useCollection(contract);
  const { profile, isLoading: profileLoading, mutate } = useCollectionProfile(contract);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

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
    setSaveError(null);
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
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (e) {
      setSaveStatus("error");
      setSaveError(e instanceof Error ? e.message : "Failed to save changes");
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
      <SectionCard id="identity">
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
      <SectionCard id="media">
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

      {/* ── Exclusive Content ── */}
      <SectionCard id="exclusive" className={form.gatedEnabled ? "border-emerald-500/30 bg-emerald-500/[0.03]" : ""}>
        <SectionHeader
          icon={Lock}
          title="Exclusive Content"
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
                  ? "Holders will see and unlock your exclusive content on the collection page."
                  : "Add exclusive content that only token holders can access — video, audio, links, or documents."}
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
                    Verified holders can access this content on your collection page.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* How it works */}
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

      {/* ── Links ── */}
      <SectionCard id="links">
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

      {/* ── Claim your collection URL ── */}
      <CollectionSlugClaimSection contract={contract} profile={profile} />

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={saving || isLoading || descLen > DESC_MAX}
          className="min-w-[120px]"
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {saveStatus === "saved" && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-500">
            <CheckCircle2 className="h-4 w-4" /> Saved
          </span>
        )}
        {saveStatus === "error" && (
          <span className="text-sm text-destructive">{saveError}</span>
        )}
        {descLen > DESC_MAX && (
          <p className="text-xs text-destructive">Description is too long.</p>
        )}
      </div>
    </div>
  );
}
