"use client";

import { useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { KeyRound, Settings2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useSessionKey } from "@/hooks/use-session-key";
import { SessionPreferencesModal } from "@/components/chipi/session-preferences-modal";
import { useChipiSessionUnlock } from "@/contexts/chipi-session-unlock-context";
import { cn } from "@/lib/utils";

export type SessionPreferencesSwitchProps = {
  /** Smaller label for embedding in dense panels */
  variant?: "default" | "compact";
  className?: string;
};

export function SessionPreferencesSwitch({
  variant = "default",
  className,
}: SessionPreferencesSwitchProps) {
  const { isSignedIn } = useAuth();
  const { clearSessionUnlockKey } = useChipiSessionUnlock();
  const {
    sessionPreferences,
    clearSessionPreferences,
    clearSession,
    hasActiveSession,
  } = useSessionKey();

  const [modalOpen, setModalOpen] = useState(false);
  const [autoRegisterOnOpen, setAutoRegisterOnOpen] = useState(false);
  const lastSessionClearedAtRef = useRef<number | null>(null);

  const enabled = sessionPreferences?.enabled ?? false;

  const handleSwitch = async (checked: boolean) => {
    if (!isSignedIn) {
      toast.error("Sign in to manage session preferences.");
      return;
    }
    if (checked) {
      const justCleared =
        lastSessionClearedAtRef.current != null &&
        Date.now() - lastSessionClearedAtRef.current < 15_000;
      setAutoRegisterOnOpen(justCleared || !hasActiveSession);
      setModalOpen(true);
      return;
    }
    try {
      await clearSession();
      clearSessionUnlockKey();
      await clearSessionPreferences();
      lastSessionClearedAtRef.current = Date.now();
      toast.success("Remember session turned off", {
        description: "Your saved signing session was cleared from this device profile.",
      });
    } catch (e) {
      toast.error("Could not update preferences", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    }
  };

  const openConfigure = () => setModalOpen(true);

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border border-border bg-card/80 px-3 py-2 shadow-sm",
          variant === "compact" && "py-1.5 px-2",
          className
        )}
      >
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p
              className={cn(
                "font-medium text-foreground leading-tight",
                variant === "compact" ? "text-xs" : "text-sm"
              )}
            >
              Remember session
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              Fewer prompts for multiple transactions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {enabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={openConfigure}
              aria-label="Configure session preferences"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          )}
          <Switch checked={enabled} onCheckedChange={handleSwitch} aria-label="Remember session" />
        </div>
      </div>

      <SessionPreferencesModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setAutoRegisterOnOpen(false);
        }}
        initialPrefs={sessionPreferences}
        autoRegisterOnOpen={autoRegisterOnOpen}
      />
    </>
  );
}
