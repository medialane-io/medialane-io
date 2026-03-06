"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface PinInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string | null;
  autoFocus?: boolean;
}

export function PinInput({
  value,
  onChange,
  placeholder = "Enter 6–12 digit PIN",
  error,
  autoFocus = false,
}: PinInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5 w-full">
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 12);
            onChange(v);
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border/60 bg-muted/30 px-4 py-3 pr-12 text-lg tracking-widest font-mono placeholder:text-muted-foreground/40 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          autoComplete="off"
          autoFocus={autoFocus}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}

export function validatePin(pin: string): string | null {
  if (!pin) return "PIN is required";
  if (!/^\d+$/.test(pin)) return "Digits only";
  if (pin.length < 6) return "Minimum 6 digits";
  return null;
}
