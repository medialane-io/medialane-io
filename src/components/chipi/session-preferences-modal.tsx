"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSessionKey } from "@/hooks/use-session-key";
import {
  type ChipiSessionPreferences,
  type SessionPreferenceMode,
  clampDurationMinutes,
  resolveSessionCreationParams,
} from "@/lib/chipi/session-preferences";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { useChipiSessionUnlock } from "@/contexts/chipi-session-unlock-context";

const defaultPrefs = (): ChipiSessionPreferences => ({
  enabled: true,
  mode: "duration",
  durationMinutes: 60,
  maxUsdcAmount: "100",
});

export type SessionPreferencesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrefs: ChipiSessionPreferences | null;
  autoRegisterOnOpen?: boolean;
};

export function SessionPreferencesModal({
  open,
  onOpenChange,
  initialPrefs,
  autoRegisterOnOpen,
}: SessionPreferencesModalProps) {
  const { setSessionUnlockKey } = useChipiSessionUnlock();
  const { updateSessionPreferences, setupSession, isSettingUpSession, hasWallet } =
    useSessionKey();
  const [mode, setMode] = useState<SessionPreferenceMode>("duration");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxUsdcAmount, setMaxUsdcAmount] = useState("100");
  const [prefsInitialized, setPrefsInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const pendingRegisterParamsRef = useRef<{
    durationSeconds: number;
    maxCalls: number;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setPrefsInitialized(false);
      return;
    }
    const base = initialPrefs ?? defaultPrefs();
    setMode(base.mode);
    setDurationMinutes(clampDurationMinutes(base.durationMinutes));
    setMaxUsdcAmount(base.maxUsdcAmount ?? "100");
    setPrefsInitialized(true);
  }, [open, initialPrefs]);

  const savePrefs = useCallback((): ChipiSessionPreferences => {
    const clamped = clampDurationMinutes(durationMinutes);
    return {
      enabled: true,
      mode,
      durationMinutes: clamped,
      maxUsdcAmount: mode === "amount_capped" ? maxUsdcAmount.trim() : undefined,
    };
  }, [mode, durationMinutes, maxUsdcAmount]);

  const handleSave = async () => {
    if (mode === "amount_capped") {
      const cap = parseFloat(maxUsdcAmount);
      if (!Number.isFinite(cap) || cap <= 0) {
        toast.error("Enter a positive USDC cap.");
        return;
      }
    }
    setSaving(true);
    try {
      await updateSessionPreferences(savePrefs());
      toast.success("Session preferences saved.");
      onOpenChange(false);
    } catch (e) {
      toast.error("Could not save preferences", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterNow = async () => {
    if (!hasWallet) {
      toast.error("Create a wallet first.");
      return;
    }
    if (mode === "amount_capped") {
      const cap = parseFloat(maxUsdcAmount);
      if (!Number.isFinite(cap) || cap <= 0) {
        toast.error("Enter a positive USDC cap.");
        return;
      }
    }
    setSaving(true);
    try {
      const prefs = savePrefs();
      await updateSessionPreferences(prefs);
      pendingRegisterParamsRef.current = resolveSessionCreationParams(prefs);
      setPinOpen(true);
    } catch (e) {
      toast.error("Could not save preferences", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const didAutoRegisterRef = useRef(false);
  useEffect(() => {
    if (!open) {
      didAutoRegisterRef.current = false;
      return;
    }
    if (!autoRegisterOnOpen) return;
    if (isSettingUpSession) return;
    if (didAutoRegisterRef.current) return;
    if (!prefsInitialized) return;
    didAutoRegisterRef.current = true;

    const t = setTimeout(() => {
      void handleRegisterNow();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoRegisterOnOpen, isSettingUpSession, prefsInitialized]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Signing session preferences
            </DialogTitle>
            <DialogDescription>
              Reuse a registered Chipi session for gasless transactions. You will need to register a
              new session after a certain amount of time, sessions always expire on-chain;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === "duration" ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={() => setMode("duration")}
              >
                Time-based
              </Button>
              <Button
                type="button"
                variant={mode === "amount_capped" ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={() => setMode("amount_capped")}
              >
                Amount cap
              </Button>
            </div>

            {mode === "duration" ? (
              <div className="space-y-2">
                <Label htmlFor="duration-mins">Keep session active (minutes)</Label>
                <Input
                  id="duration-mins"
                  type="number"
                  min={5}
                  max={4 * 60}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 5)}
                />
                <p className="text-xs text-muted-foreground">
                  Between 5 minutes and 4 hours. Shorter is safer.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="cap-amt">Reuse session only for transactions under (USDC)</Label>
                <Input
                  id="cap-amt"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 50"
                  value={maxUsdcAmount}
                  onChange={(e) => setMaxUsdcAmount(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <div className="flex w-full gap-2 justify-end flex-wrap">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleRegisterNow}
              disabled={saving || isSettingUpSession || !hasWallet}
            >
              Save &amp; register session now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PinDialog
        open={pinOpen}
        onCancel={() => {
          pendingRegisterParamsRef.current = null;
          setPinOpen(false);
        }}
        onSubmit={async (pin) => {
          try {
            const override = pendingRegisterParamsRef.current ?? undefined;
            pendingRegisterParamsRef.current = null;
            await setupSession(pin, override);
            setSessionUnlockKey(pin);
            setPinOpen(false);
            onOpenChange(false);
            toast.success("Session registered.", {
              description:
                "You can complete transactions without re-registering until this session expires.",
            });
          } catch (e) {
            toast.error("Session registration failed", {
              description: e instanceof Error ? e.message : "Try again.",
            });
          }
        }}
        title="Authorize session registration"
        description="Enter your PIN to create and register a signing session on-chain."
      />
    </>
  );
}
