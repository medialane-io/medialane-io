"use client";

import { AtSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CheckState } from "./types";

export const EMAIL_GATE_ERROR = "Verify your email to claim a username.";

export function ClaimError({ error, onVerifyEmail }: { error: string; onVerifyEmail: () => void }) {
  if (error === EMAIL_GATE_ERROR) {
    return (
      <p className="text-sm text-destructive mt-2">
        {error}{" "}
        <button type="button" onClick={onVerifyEmail} className="underline font-medium hover:text-foreground">
          Verify email
        </button>
      </p>
    );
  }
  return <p className="text-sm text-destructive mt-2">{error}</p>;
}

export function UsernameClaimInput({
  value, onChange, onCheck, onSubmit, checkState, checkReason, loading, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onCheck: () => void;
  onSubmit: () => void;
  checkState: CheckState;
  checkReason?: string;
  loading: boolean;
  disabled: boolean;
}) {
  const isAvailable = checkState === "available";
  const isChecking = checkState === "checking";

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <AtSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-7 tabular-nums"
            placeholder="yourname"
            value={value}
            onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
            maxLength={20}
            disabled={loading || isChecking}
            onKeyDown={(e) => e.key === "Enter" && !loading && !isChecking && (isAvailable ? onSubmit() : onCheck())}
          />
        </div>
        {isAvailable ? (
          <Button
            onClick={onSubmit}
            disabled={loading || disabled}
            className="bg-green-600 hover:bg-green-700 text-white shrink-0"
          >
            {loading ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Submitting…</> : `Claim @${value}`}
          </Button>
        ) : (
          <Button
            onClick={onCheck}
            disabled={isChecking || disabled || value.length < 3}
            variant="outline"
            className="shrink-0"
          >
            {isChecking ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Checking…</> : "Check"}
          </Button>
        )}
      </div>
      {checkState === "taken" && (
        <p className="text-xs text-destructive">{checkReason ?? "That username is not available."}</p>
      )}
      {checkState === "available" && (
        <p className="text-xs text-green-600 dark:text-green-500 font-medium">@{value} is available!</p>
      )}
    </div>
  );
}
