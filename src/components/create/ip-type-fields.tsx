"use client";

import { useEffect, useMemo, useState } from "react";
import type { IPType } from "@/types/ip";
import { IP_TEMPLATES, type TemplateField } from "@/lib/ip-templates";
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
import { Plus, Trash2 } from "lucide-react";

export type MetadataField = {
  traitType: string;
  value: string;
};

type CustomTraitDraft = MetadataField & {
  id: string;
};

const createTraitId = () =>
  globalThis.crypto?.randomUUID?.() ?? `trait-${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface IPTypeFieldsProps {
  ipType: IPType | null;
  onChange: (fields: MetadataField[]) => void;
}

export function IPTypeFields({ ipType, onChange }: IPTypeFieldsProps) {
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const [customTraits, setCustomTraits] = useState<CustomTraitDraft[]>([]);

  const template = ipType ? IP_TEMPLATES[ipType] : null;
  const hasSuggestedFields = !!template && template.fields.length > 0;

  const metadataFields = useMemo(() => {
    const fields: MetadataField[] = [];
    const seen = new Set<string>();
    const suggestedKeys = new Set(template?.fields.map((field) => field.key) ?? []);
    const addField = (traitType: string, value: string) => {
      const cleanTraitType = traitType.trim();
      const cleanValue = value.trim();
      const key = cleanTraitType.toLowerCase();
      if (!cleanTraitType || !cleanValue || seen.has(key)) return;
      seen.add(key);
      fields.push({ traitType: cleanTraitType, value: cleanValue });
    };

    Object.entries(templateValues).forEach(([traitType, value]) => {
      if (suggestedKeys.has(traitType)) addField(traitType, value);
    });
    customTraits.forEach((trait) => {
      const cleanTraitType = trait.traitType.trim();
      const cleanValue = trait.value.trim();
      if (cleanTraitType && cleanValue) fields.push({ traitType: cleanTraitType, value: cleanValue });
    });

    return fields;
  }, [template?.fields, templateValues, customTraits]);

  useEffect(() => {
    onChange(metadataFields);
  }, [metadataFields, onChange]);

  // Suggested fields are tied to the selected IP type. Custom traits stay in place.
  useEffect(() => {
    setTemplateValues({});
  }, [ipType]);

  const handleChange = (key: string, value: string) => {
    setTemplateValues((current) => ({ ...current, [key]: value }));
  };

  const addCustomTrait = () => {
    setCustomTraits((current) => [
      ...current,
      { id: createTraitId(), traitType: "", value: "" },
    ]);
  };

  const updateCustomTrait = (id: string, patch: Partial<MetadataField>) => {
    setCustomTraits((current) =>
      current.map((trait) => (trait.id === id ? { ...trait, ...patch } : trait))
    );
  };

  const removeCustomTrait = (id: string) => {
    setCustomTraits((current) => current.filter((trait) => trait.id !== id));
  };

  return (
    <div className="space-y-4 rounded-xl border border-border p-5">
      {template && (
        <div className="flex items-center gap-2">
          <template.icon className={`h-4 w-4 ${template.color.text}`} />
          <p className="text-sm font-semibold">{template.label} Details</p>
          <span className="text-xs text-muted-foreground ml-auto">Optional · Embedded in metadata</span>
        </div>
      )}

      {hasSuggestedFields && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {template.fields.map((field: TemplateField) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{field.label}</Label>

              {field.inputType === "select" && field.options ? (
                <Select
                  value={templateValues[field.key] ?? ""}
                  onValueChange={(v) => handleChange(field.key, v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.inputType}
                  placeholder={field.placeholder ?? ""}
                  value={templateValues[field.key] ?? ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="h-9 text-sm"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 border-t border-border/60 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Custom traits</p>
            <p className="text-xs text-muted-foreground">Trait name + value pairs</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addCustomTrait}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add trait
          </Button>
        </div>

        {customTraits.length > 0 && (
          <div className="space-y-2">
            {customTraits.map((trait) => (
              <div key={trait.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr,1fr,2.25rem]">
                <Input
                  value={trait.traitType}
                  onChange={(e) => updateCustomTrait(trait.id, { traitType: e.target.value })}
                  placeholder="Trait"
                  className="h-9 text-sm"
                  maxLength={64}
                />
                <Input
                  value={trait.value}
                  onChange={(e) => updateCustomTrait(trait.id, { value: e.target.value })}
                  placeholder="Value"
                  className="h-9 text-sm"
                  maxLength={512}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive sm:self-end"
                  onClick={() => removeCustomTrait(trait.id)}
                  aria-label="Remove trait"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
