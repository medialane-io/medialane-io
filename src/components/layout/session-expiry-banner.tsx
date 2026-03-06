"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { AlertTriangle } from "lucide-react";
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

  const storedSession =
    (user?.unsafeMetadata?.chipiSession as SessionKeyData | null) ?? null;

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

  // Only show when a session exists but is expiring / expired
  if (!storedSession || minutesLeft === null || minutesLeft > 30) return null;

  const handleSetup = async (pin: string) => {
    await setupSession(pin);
    setSessionOpen(false);
  };

  return (
    <>
      <div className="sticky top-12 z-40 bg-yellow-500/10 border-b border-yellow-500/20">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-4 text-sm text-yellow-600 dark:text-yellow-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {minutesLeft === 0
                ? "Your signing session has expired. Refresh to continue making transactions."
                : `Signing session expires in ${minutesLeft} min — refresh to avoid interruptions.`}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs shrink-0 border-yellow-500/40 hover:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
            onClick={() => setSessionOpen(true)}
          >
            Refresh
          </Button>
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
