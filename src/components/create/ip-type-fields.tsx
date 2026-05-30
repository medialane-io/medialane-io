"use client";

import { useEffect, useMemo, useState } from "react";
import type { IPType } from "@/types/ip";
import {
  IP_TEMPLATES,
  EMBED_PLATFORM_META,
  SOCIAL_PLATFORM_META,
  type TraitSuggestion,
} from "@/lib/ip-templates";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Plus, Trash2 } from "lucide-react";

export type MetadataField = {
  traitType: string;
  value: string;
};

type TraitRow = {
  id: string;
  key: string;
  value: string;
  options?: string[];
};

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `trait-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const looksLikeUrl = (v: string) => /^https?:\/\/\S+/i.test(v.trim());

interface IPTypeFieldsProps {
  ipType: IPType | null;
  onChange: (fields: MetadataField[]) => void;
}

export function IPTypeFields({ ipType, onChange }: IPTypeFieldsProps) {
  const template = ipType ? IP_TEMPLATES[ipType] : null;

  // URL inputs keyed by their stored trait_type (e.g. "Spotify URL", "X").
  const [embedValues, setEmbedValues] = useState<Record<string, string>>({});
  const [socialValues, setSocialValues] = useState<Record<string, string>>({});
  // One unified, ordered list of traits (suggestions pre-fill rows; custom = blank).
  const [traits, setTraits] = useState<TraitRow[]>([]);

  // Embeds & socials are type-specific — reset them when the IP type changes.
  // Trait rows are generic key/value and persist across type switches.
  useEffect(() => {
    setEmbedValues({});
    setSocialValues({});
  }, [ipType]);

  const metadataFields = useMemo(() => {
    const fields: MetadataField[] = [];
    const seen = new Set<string>();
    const add = (traitType: string, value: string) => {
      const t = traitType.trim();
      const v = value.trim();
      const k = t.toLowerCase();
      if (!t || !v || seen.has(k)) return;
      seen.add(k);
      fields.push({ traitType: t, value: v });
    };
    Object.entries(embedValues).forEach(([key, value]) => add(key, value));
    Object.entries(socialValues).forEach(([key, value]) => add(key, value));
    traits.forEach((row) => add(row.key, row.value));
    return fields;
  }, [embedValues, socialValues, traits]);

  useEffect(() => {
    onChange(metadataFields);
  }, [metadataFields, onChange]);

  const addedKeys = useMemo(
    () => new Set(traits.map((t) => t.key.trim().toLowerCase())),
    [traits]
  );

  const addSuggestion = (s: TraitSuggestion) => {
    setTraits((cur) => [
      ...cur,
      { id: createId(), key: s.key, value: "", options: s.options },
    ]);
  };
  const addCustomTrait = () =>
    setTraits((cur) => [...cur, { id: createId(), key: "", value: "" }]);
  const updateTrait = (id: string, patch: Partial<TraitRow>) =>
    setTraits((cur) => cur.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const removeTrait = (id: string) =>
    setTraits((cur) => cur.filter((t) => t.id !== id));

  if (!template) return null;

  const Icon = template.icon;

  return (
    <div className="space-y-5 rounded-xl border border-border p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${template.color.text}`} />
        <p className="text-sm font-semibold">{template.label} Details</p>
        <span className="ml-auto text-xs text-muted-foreground">Optional · Embedded in metadata</span>
      </div>

      {/* ── Embeds (inline players) ─────────────────────────────── */}
      {template.embeds && template.embeds.length > 0 && (
        <section className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Embeds</p>
          {template.embeds.map((platform) => {
            const meta = EMBED_PLATFORM_META[platform];
            const PIcon = meta.icon;
            const value = embedValues[meta.traitKey] ?? "";
            return (
              <div key={platform} className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <PIcon className="h-3.5 w-3.5" />
                  {meta.label}
                  {looksLikeUrl(value) && (
                    <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-400">
                      <Check className="h-3 w-3" /> connected
                    </span>
                  )}
                </Label>
                <Input
                  type="url"
                  inputMode="url"
                  placeholder={meta.placeholder}
                  value={value}
                  onChange={(e) =>
                    setEmbedValues((cur) => ({ ...cur, [meta.traitKey]: e.target.value }))
                  }
                  className="h-10 text-sm"
                />
              </div>
            );
          })}
        </section>
      )}

      {/* ── Social links (icon chips on the asset page) ─────────── */}
      {template.socials && template.socials.length > 0 && (
        <section className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Social links</p>
          {template.socials.map((platform) => {
            const meta = SOCIAL_PLATFORM_META[platform];
            const PIcon = meta.icon;
            const value = socialValues[meta.traitKey] ?? "";
            return (
              <div key={platform} className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <PIcon className="h-3.5 w-3.5" />
                  {meta.label}
                </Label>
                <Input
                  type="url"
                  inputMode="url"
                  placeholder={meta.placeholder}
                  value={value}
                  onChange={(e) =>
                    setSocialValues((cur) => ({ ...cur, [meta.traitKey]: e.target.value }))
                  }
                  className="h-10 text-sm"
                />
              </div>
            );
          })}
        </section>
      )}

      {/* ── Traits ───────────────────────────────────────────────── */}
      <section className="space-y-3 border-t border-border/60 pt-4">
        <div>
          <p className="text-sm font-semibold">Traits</p>
          <p className="text-xs text-muted-foreground">
            Add descriptive trait pairs — used across your profile and for discovery filters.
          </p>
        </div>

        {/* Suggestion chips */}
        {template.traitSuggestions && template.traitSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {template.traitSuggestions
              .filter((s) => !addedKeys.has(s.key.toLowerCase()))
              .map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => addSuggestion(s)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  {s.key}
                </button>
              ))}
          </div>
        )}

        {/* Trait rows — one trait per card, inputs stacked (mobile-first) */}
        {traits.length > 0 && (
          <div className="space-y-2">
            {traits.map((row) => (
              <div
                key={row.id}
                className="flex items-start gap-2 rounded-lg border border-border/60 p-2.5"
              >
                <div className="flex-1 space-y-2">
                  <Input
                    value={row.key}
                    onChange={(e) => updateTrait(row.id, { key: e.target.value })}
                    placeholder="Trait name"
                    className="h-9 text-sm"
                    maxLength={64}
                  />
                  {row.options ? (
                    <Select
                      value={row.value}
                      onValueChange={(v) => updateTrait(row.id, { value: v })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select value" />
                      </SelectTrigger>
                      <SelectContent>
                        {row.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={row.value}
                      onChange={(e) => updateTrait(row.id, { value: e.target.value })}
                      placeholder="Value"
                      className="h-9 text-sm"
                      maxLength={512}
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeTrait(row.id)}
                  aria-label="Remove trait"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button type="button" variant="outline" size="sm" onClick={addCustomTrait}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add custom trait
        </Button>
      </section>
    </div>
  );
}
