"use client";

import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, LogIn, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/ui/pin-input";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { SignInButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// MarketplaceTxLink
// ─────────────────────────────────────────────────────────────────────────────

interface MarketplaceTxLinkProps {
  txHash: string;
  explorerUrl: string;
  className?: string;
}

export function MarketplaceTxLink({
  txHash,
  explorerUrl,
  className,
}: MarketplaceTxLinkProps) {
  return (
    <a
      href={`${explorerUrl}/tx/${txHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
    >
      <span className="font-mono">{txHash.slice(0, 10)}…{txHash.slice(-8)}</span>
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MarketplaceProcessingState
// ─────────────────────────────────────────────────────────────────────────────

interface MarketplaceProcessingStateProps {
  title: string;
  description?: string;
  imageUrl?: string | null;
  imageAlt?: string;
  txHash?: string | null;
  explorerUrl?: string;
}

export function MarketplaceProcessingState({
  title,
  description = "Please wait, do not close this window.",
  imageUrl,
  imageAlt = "Token preview",
  txHash,
  explorerUrl,
}: MarketplaceProcessingStateProps) {
  return (
    <div className="flex flex-col items-center gap-5 p-6 py-8">
      {imageUrl ? (
        <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-border shadow-md">
          <img src={imageUrl} alt={imageAlt} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        </div>
      ) : (
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      )}
      <div className="text-center space-y-1">
        <p className="font-semibold">{title}</p>
        {txHash && explorerUrl ? (
          <MarketplaceTxLink txHash={txHash} explorerUrl={explorerUrl} className="mt-1" />
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MarketplaceActivatingSession
// ─────────────────────────────────────────────────────────────────────────────

export function MarketplaceActivatingSession() {
  return (
    <div className="flex flex-col items-center gap-4 p-6 py-10">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Activating wallet session…</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MarketplaceSignInGate
// ─────────────────────────────────────────────────────────────────────────────

interface MarketplaceSignInGateProps {
  title: string;
  description: string;
}

export function MarketplaceSignInGate({ title, description }: MarketplaceSignInGateProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-6 py-10 text-center">
      <LogIn className="h-10 w-10 text-muted-foreground" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <SignInButton mode="modal">
        <Button className="w-full">Sign in</Button>
      </SignInButton>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MarketplaceSuccessState
// ─────────────────────────────────────────────────────────────────────────────

interface MarketplaceSuccessStateProps {
  tokenImage?: string | null;
  name: string;
  title: string;
  description: ReactNode;
  txHash?: string | null;
  explorerUrl: string;
  onDone: () => void;
  footer?: ReactNode;
}

export function MarketplaceSuccessState({
  tokenImage,
  name,
  title,
  description,
  txHash,
  explorerUrl,
  onDone,
  footer,
}: MarketplaceSuccessStateProps) {
  return (
    <div className="flex flex-col items-center gap-5 p-6 py-8">
      {tokenImage ? (
        <div className="relative">
          <div className="h-32 w-32 rounded-2xl overflow-hidden border border-border shadow-lg">
            <img src={tokenImage} alt={name} className="h-full w-full object-cover" />
          </div>
          <div className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg border-2 border-background">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400" />
        </div>
      ) : (
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9 text-emerald-500" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400" />
        </div>
      )}
      <div className="text-center space-y-1">
        <p className="font-bold text-xl">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {txHash && <MarketplaceTxLink txHash={txHash} explorerUrl={explorerUrl} />}
      <Button className="w-full h-11" onClick={onDone}>Done</Button>
      {footer}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MarketplaceDialogHero
// ─────────────────────────────────────────────────────────────────────────────

interface MarketplaceDialogHeroProps {
  tokenImage?: string | null;
  tokenName?: string;
  tokenId: string;
  fallbackIcon: ReactNode;
  badge?: ReactNode;
}

export function MarketplaceDialogHero({
  tokenImage,
  tokenName,
  tokenId,
  fallbackIcon,
  badge,
}: MarketplaceDialogHeroProps) {
  const name = tokenName || `Token #${tokenId}`;
  return (
    <div className="relative h-32 w-full bg-muted overflow-hidden shrink-0">
      {tokenImage ? (
        <img src={tokenImage} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-brand-blue/20 via-brand-purple/10 to-transparent flex items-center justify-center">
          {fallbackIcon}
        </div>
      )}
      {badge}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CurrencyPicker
// ─────────────────────────────────────────────────────────────────────────────

interface CurrencyPickerProps {
  currencies: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CurrencyPicker({ currencies, value, onChange, disabled }: CurrencyPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {currencies.map((c) => (
        <Button
          key={c}
          type="button"
          variant={value === c ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(c)}
          disabled={disabled}
          className="gap-1 px-2 text-xs w-full"
        >
          <CurrencyIcon symbol={c} size={13} className="shrink-0" />
          <span className="truncate">{c}</span>
        </Button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DurationPicker
// ─────────────────────────────────────────────────────────────────────────────

interface DurationPickerProps {
  options: ReadonlyArray<{ label: string; seconds: number }>;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function DurationPicker({ options, value, onChange, disabled }: DurationPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => (
        <Button
          key={opt.label}
          type="button"
          variant={value === opt.seconds ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(opt.seconds)}
          disabled={disabled}
          className="text-xs"
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MarketplacePinStep
// ─────────────────────────────────────────────────────────────────────────────

interface MarketplacePinStepProps {
  summary?: ReactNode;
  description: string;
  pin: string;
  onPinChange: (value: string) => void;
  pinError: string | null;
  error?: string | null;
  secondaryLabel: string;
  onSecondary: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryIcon?: ReactNode;
  primaryVariant?: "default" | "destructive";
  passkeySupported?: boolean;
  isAuthenticatingPasskey?: boolean;
  onUsePasskey?: () => void;
  footer?: ReactNode;
}

export function MarketplacePinStep({
  summary,
  description,
  pin,
  onPinChange,
  pinError,
  error,
  secondaryLabel,
  onSecondary,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryIcon,
  primaryVariant = "default",
  passkeySupported = false,
  isAuthenticatingPasskey = false,
  onUsePasskey,
  footer,
}: MarketplacePinStepProps) {
  const primaryButton = primaryVariant === "destructive" ? (
    <Button
      variant="destructive"
      className="flex-1 h-11"
      disabled={primaryDisabled}
      onClick={onPrimary}
    >
      {primaryLabel}
    </Button>
  ) : (
    <div
      className={cn(
        "btn-border-animated p-[1px] rounded-xl flex-1",
        primaryDisabled && "pointer-events-none"
      )}
    >
      <button
        className="w-full h-11 rounded-[11px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-transparent"
        disabled={primaryDisabled}
        onClick={onPrimary}
      >
        {primaryIcon}
        {primaryLabel}
      </button>
    </div>
  );

  return (
    <div className="px-6 pb-6 pt-3 space-y-4">
      {summary}
      <p className="text-sm text-muted-foreground">{description}</p>
      <PinInput
        value={pin}
        onChange={onPinChange}
        error={pinError}
        autoFocus
      />
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={onSecondary}
        >
          {secondaryLabel}
        </Button>
        {primaryButton}
      </div>
      {passkeySupported && onUsePasskey ? (
        <Button
          variant="outline"
          className="w-full text-xs"
          disabled={isAuthenticatingPasskey}
          onClick={onUsePasskey}
        >
          {isAuthenticatingPasskey ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Authenticating…
            </>
          ) : (
            "Use passkey instead"
          )}
        </Button>
      ) : null}
      {footer}
    </div>
  );
}
