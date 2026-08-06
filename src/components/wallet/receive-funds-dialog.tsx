"use client";

import { useState } from "react";
import { Copy, Check, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddressQr } from "@/components/wallet/address-qr";

interface ReceiveFundsDialogProps {
  address: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiveFundsDialog({ address, open, onOpenChange }: ReceiveFundsDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle>Deposit funds</DialogTitle>
          <DialogDescription>
            Send STRK, ETH, or any Starknet asset to this address to fund your wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <AddressQr value={address} size={200} />

          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-left transition-colors hover:border-primary/40"
          >
            <code className="min-w-0 flex-1 truncate text-xs">{address}</code>
            {copied ? (
              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </button>

          <Button className="w-full" onClick={handleCopy}>
            {copied ? "Copied" : "Copy address"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Only send assets on Starknet mainnet. Sending from another network may result in permanent loss.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
