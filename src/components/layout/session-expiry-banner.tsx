"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionSetupDialog } from "@/components/chipi/session-setup-dialog";
import { useSessionKey } from "@/hooks/use-session-key";
import type { SessionKeyData } from "@chipi-stack/types";

const WARN_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export function SessionExpiryBanner() {
  const { user } = useUser();
  const { setupSession, isSettingUpSession } = useSessionKey();
  const [sessionOpen, setSessionOpen] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const storedSession =
    (user?.unsafeMetadata?.chipiSession as SessionKeyData | null) ?? null;

  useEffect(() => {
    if (sessionStorage.getItem("session-banner-dismissed") === "1") {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (!storedSession) {
      setMinutesLeft(null);
      return;
    }
    const update = () => {
      const msLeft = storedSession.validUntil * 1000 - Date.now();
      setMinutesLeft(msLeft <= 0 ? 0 : Math.floor(msLeft / 60000));
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [storedSession]);

  const handleDismiss = () => {
    sessionStorage.setItem("session-banner-dismissed", "1");
    setDismissed(true);
  };

  const handleSetup = async (pin: string) => {
    await setupSession(pin);
    setSessionOpen(false);
  };

  // Only show when a session exists but is expiring / expired
  const shouldShow = storedSession && minutesLeft !== null && minutesLeft <= 30;

  if (dismissed || !shouldShow) return null;

  return (
    <>
      <div
        className="fixed bottom-4 right-4 z-50 flex items-start gap-3 rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-lg px-4 py-3 max-w-sm"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex-1">
          <p className="text-sm font-medium">Session expiring soon</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {minutesLeft === 0
              ? "Your signing session has expired."
              : <>Your session expires in <span className="font-semibold">{minutesLeft}m</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" onClick={() => setSessionOpen(true)}>Renew</Button>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <SessionSetupDialog
        open={sessionOpen}
        onOpenChange={setSessionOpen}
        onSetup={handleSetup}
        isProcessing={isSettingUpSession}
      />
    </>
  );
}
