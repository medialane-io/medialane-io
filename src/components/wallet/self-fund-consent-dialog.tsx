"use client";

import { useEffect, useState } from "react";
import { ActionDialog } from "@medialane/ui";
import { registerSelfFundConsentHandler } from "@/lib/wallet/self-fund-consent";

interface PendingRequest {
  resolve: (consented: boolean) => void;
}

export function SelfFundConsentDialog() {
  const [pending, setPending] = useState<PendingRequest | null>(null);

  useEffect(() => {
    registerSelfFundConsentHandler(
      () => new Promise<boolean>((resolve) => setPending({ resolve })),
    );
    return () => registerSelfFundConsentHandler(null);
  }, []);

  const respond = (consented: boolean) => {
    pending?.resolve(consented);
    setPending(null);
  };

  return (
    <ActionDialog open={pending !== null} onClose={() => respond(false)} width={420}>
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Pay gas from your wallet?</h2>
        <p className="text-sm text-muted-foreground">
          Sponsored gas isn&apos;t available right now. You can cover this
          transaction&apos;s network fee from your own wallet balance instead.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => respond(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => respond(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Pay with my wallet
          </button>
        </div>
      </div>
    </ActionDialog>
  );
}
