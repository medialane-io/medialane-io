"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Layers, ScanFace, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { useWalletAuthMethod } from "@/hooks/use-wallet-auth-method";

interface NftEditionsMintConfirmDialogProps {
  open: boolean;
  imagePreview: string | null;
  assetName: string;
  quantity: string;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
}

export function NftEditionsMintConfirmDialog({
  open,
  imagePreview,
  assetName,
  quantity,
  onSubmit,
  onCancel,
}: NftEditionsMintConfirmDialogProps) {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  // Each wallet unlocks with EITHER a passkey or a PIN — never both. Passkey
  // users have no PIN, so show Face ID / Touch ID instead of a PIN input.
  // Authoritative (cross-device) signal, not just the device-local flag.
  const { usesPasskey, authenticate, encryptKey } = useWalletAuthMethod();
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPin("");
      setPinError(null);
      setPasskeyError(null);
      setPasskeyBusy(false);
    }
  }, [open]);

  const handleSubmit = () => {
    const error = validatePin(pin);
    if (error) {
      setPinError(error);
      return;
    }

    onSubmit(pin);
  };

  const handlePasskey = async () => {
    setPasskeyError(null);
    setPasskeyBusy(true);
    try {
      const key = encryptKey ?? (await authenticate());
      if (!key) throw new Error("Face ID / Touch ID was cancelled.");
      onSubmit(key);
    } catch (err) {
      setPasskeyError(err instanceof Error ? err.message : "Face ID / Touch ID failed. Try again.");
    } finally {
      setPasskeyBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onCancel(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        <div className="relative h-52 w-full bg-muted overflow-hidden">
          {imagePreview ? (
            <img src={imagePreview} alt={assetName} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-brand-blue/20 via-brand-purple/10 to-transparent flex items-center justify-center">
              <Layers className="h-14 w-14 text-brand-purple/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-brand-purple/40 bg-brand-purple/20 text-brand-purple backdrop-blur-sm">
            <Layers className="h-3 w-3" />
            Multi-edition
          </span>
        </div>

        <div className="flex items-end justify-between px-6 pt-3 pb-1">
          <div className="min-w-0">
            <p className="font-bold text-lg leading-tight truncate">{assetName || "New Token"}</p>
            <div className="flex items-center gap-1 mt-1">
              <Zap className="h-3 w-3 text-emerald-500" />
              <span className="text-[11px] font-medium text-emerald-500">Immutable · Sovereign</span>
            </div>
          </div>
          <div className="shrink-0 text-right ml-4 space-y-0.5">
            <p className="text-xs text-muted-foreground">Qty <span className="text-foreground font-semibold">×{quantity || "1"}</span></p>
          </div>
        </div>

        <div className="px-6 pb-6 pt-3 space-y-4">
          {usesPasskey ? (
            <>
              <p className="text-sm text-muted-foreground">Confirm with Face ID / Touch ID to mint onto Starknet.</p>
              {passkeyError && <p className="text-xs text-destructive">{passkeyError}</p>}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="gap-1.5" onClick={onCancel}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  className="flex-1 h-11 bg-brand-purple hover:brightness-110 text-white"
                  disabled={passkeyBusy}
                  onClick={handlePasskey}
                >
                  <ScanFace className="h-4 w-4 mr-2" />
                  {passkeyBusy ? "Confirming…" : "Confirm with passkey"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Enter your PIN to mint onto Starknet.</p>
              <PinInput
                value={pin}
                onChange={(value) => { setPin(value); setPinError(null); }}
                error={pinError}
                autoFocus
              />
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="gap-1.5" onClick={onCancel}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  className="flex-1 h-11 bg-brand-purple hover:brightness-110 text-white"
                  disabled={pin.length < 6}
                  onClick={handleSubmit}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Mint now
                </Button>
              </div>
            </>
          )}
          <p className="text-[10px] text-center text-muted-foreground">
            Transaction gas fees are sponsored by Medialane.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
