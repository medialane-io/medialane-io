"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { popCalls } from "@medialane/sdk/starknet";
import { Button } from "@/components/ui/button";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";

interface PopBurnButtonProps {
  collectionAddress: string;
  tokenId: string;
  onBurned?: () => void;
}

/** Lets a holder permanently remove their own credential from their wallet. */
export function PopBurnButton({ collectionAddress, tokenId, onBurned }: PopBurnButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const action = useWalletWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";

  useEffect(() => {
    if (action.status === "success") onBurned?.();
  }, [action.status, onBurned]);

  if (action.status === "success") {
    return <p className="text-xs text-muted-foreground">Removed from your wallet.</p>;
  }

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setConfirming(true)}>
        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
        Remove from my wallet
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground">
        This permanently destroys this credential. You won&apos;t be able to claim it again.
      </p>
      {action.status === "error" && (
        <p className="text-xs text-destructive">{action.error ?? "The credential could not be removed."}</p>
      )}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" disabled={busy} onClick={() => setConfirming(false)}>
          Keep it
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          disabled={busy}
          onClick={() => void action.run((signer) => signer.execute([popCalls.burn(collectionAddress, tokenId)]))}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Remove"}
        </Button>
      </div>
    </div>
  );
}
