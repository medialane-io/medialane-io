"use client";

import { useEffect, useState } from "react";
import type { IPType } from "@/types/ip";
import { IP_TEMPLATES, type TemplateField } from "@/lib/ip-templates";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IPTypeFieldsProps {
  ipType: IPType | null;
  onChange: (fields: Record<string, string>) => void;
}

export function IPTypeFields({ ipType, onChange }: IPTypeFieldsProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  // Reset all field values when the IP type changes
  useEffect(() => {
    setValues({});
    onChange({});
  }, [ipType]); // eslint-disable-line react-hooks/exhaustive-deps

  const template = ipType ? IP_TEMPLATES[ipType] : null;

  // Don't render for null, undefined, or Custom (no predefined fields)
  if (!template || template.fields.length === 0) return null;

  const handleChange = (key: string, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    onChange(next);
  };

  return (
    <div className="space-y-4 rounded-xl border border-border p-5">
      <div className="flex items-center gap-2">
        <template.icon className={`h-4 w-4 ${template.color.text}`} />
        <p className="text-sm font-semibold">{template.label} Details</p>
        <span className="text-xs text-muted-foreground ml-auto">Optional · Embedded in metadata</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {template.fields.map((field: TemplateField) => (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{field.label}</Label>

            {field.inputType === "select" && field.options ? (
              <Select
                value={values[field.key] ?? ""}
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
                value={values[field.key] ?? ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="h-9 text-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
