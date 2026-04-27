"use client";

import type { ReactNode } from "react";
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/ui/pin-input";
import { cn } from "@/lib/utils";

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
        primaryDisabled && "opacity-50 pointer-events-none"
      )}
    >
      <button
        className="w-full h-11 rounded-[11px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-background/30"
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
