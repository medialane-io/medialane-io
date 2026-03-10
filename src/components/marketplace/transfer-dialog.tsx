"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useTransfer } from "@/hooks/use-transfer";
import { EXPLORER_URL } from "@/lib/constants";

// Schema defined outside component — no component-level variables needed.
// Self-transfer check is done in onSubmit with form.setError for better UX.
const schema = z.object({
  toAddress: z
    .string()
    .min(1, "Recipient address is required")
    .regex(
      /^0x[0-9a-fA-F]{1,64}$/,
      "Must be a valid Starknet address (starts with 0x, hex characters only)"
    ),
});

type FormValues = z.infer<typeof schema>;

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractAddress: string;
  tokenId: string;
  tokenName?: string;
  onSuccess?: () => void;
  hasActiveListing?: boolean;
}

export function TransferDialog({
  open,
  onOpenChange,
  contractAddress,
  tokenId,
  tokenName,
  onSuccess,
  hasActiveListing = false,
}: TransferDialogProps) {
  const {
    transferToken,
    walletAddress,
    hasWallet,
    isProcessing,
    isLoadingWallet,
    txStatus,
    txHash,
    error,
    resetState,
  } = useTransfer();

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { toAddress: "" },
  });

  const onSubmit = (values: FormValues) => {
    // Self-transfer guard — compare as BigInt to handle zero-padded vs
    // non-padded Starknet address representations (0x01 === 0x0001).
    if (walletAddress) {
      try {
        if (BigInt(values.toAddress) === BigInt(walletAddress)) {
          form.setError("toAddress", { message: "Cannot transfer to yourself" });
          return;
        }
      } catch {
        // BigInt parse failed — Zod regex already blocked invalid input, safe to continue.
      }
    }
    setPendingAddress(values.toAddress);
    if (!hasWallet) {
      setWalletSetupOpen(true);
      return;
    }
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!pendingAddress) return;
    await transferToken({ contractAddress, tokenId, toAddress: pendingAddress, pin });
  };

  const handleClose = (v: boolean) => {
    if (!isProcessing) {
      resetState();
      form.reset();
      setPendingAddress(null);
      onOpenChange(v);
    }
  };

  const isSuccess = txStatus === "confirmed";
  const displayName = tokenName || `Token #${tokenId}`;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer asset</DialogTitle>
          </DialogHeader>

          {isSuccess ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="font-semibold text-lg">Transfer complete!</p>
              <p className="text-sm text-muted-foreground text-center">
                {displayName} has been sent successfully.
              </p>
              {txHash && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`${EXPLORER_URL}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    View on Voyager <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
              <Button
                className="w-full"
                onClick={() => {
                  resetState();
                  form.reset();
                  setPendingAddress(null);
                  onOpenChange(false);
                  onSuccess?.();
                }}
              >
                Done
              </Button>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {txStatus === "submitting"
                  ? "Submitting transfer…"
                  : "Confirming on Starknet…"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Asset info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Badge variant="outline" className="font-mono">
                  #{tokenId}
                </Badge>
                <span className="text-sm font-medium truncate">{displayName}</span>
              </div>

              {/* Irreversibility warning */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This action is irreversible. Double-check the recipient address
                  before confirming.
                </AlertDescription>
              </Alert>

              {/* Active listing warning */}
              {hasActiveListing && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    This token has an active listing. A buyer could still complete
                    the purchase after you transfer it. Cancel the listing first,
                    or proceed with caution.
                  </AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="toAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0x..."
                            disabled={isProcessing}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={isProcessing || isLoadingWallet}
                  >
                    {isLoadingWallet ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading wallet…
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        {hasWallet ? "Transfer" : "Set up wallet & transfer"}
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground">
                    Gas is free. Your PIN authorises the transfer.
                  </p>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Confirm transfer"
        description={`Enter your PIN to transfer ${displayName} to ${pendingAddress?.slice(0, 10)}…`}
      />

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => {
          setWalletSetupOpen(false);
          setPinOpen(true);
        }}
      />
    </>
  );
}
