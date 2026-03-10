"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, useRef } from "react";

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
  const [hint, setHint] = useState<string | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <div className="space-y-1.5 w-full">
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const raw = e.target.value;
            const stripped = raw.replace(/\D/g, "").slice(0, 12);
            if (raw.length > stripped.length) {
              // Non-digit or over-length characters were stripped — show a brief hint
              if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
              setHint("Digits only (0–9)");
              hintTimerRef.current = setTimeout(() => setHint(null), 1500);
            }
            onChange(stripped);
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
      {(error || hint) && (
        <p
          className="text-xs font-medium"
          style={{ color: error ? "var(--color-destructive)" : "var(--color-muted-foreground)" }}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function validatePin(pin: string): string | null {
  if (!pin) return "PIN is required";
  if (!/^\d+$/.test(pin)) return "Digits only";
  if (pin.length < 6) return "Minimum 6 digits";
  if (pin.length > 12) return "Maximum 12 digits";
  return null;
}
