"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle2, AlertCircle, HandCoins, ExternalLink, Loader2 } from "lucide-react";
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
import { SessionSetupDialog } from "@/components/chipi/session-setup-dialog";
import { useMarketplace } from "@/hooks/use-marketplace";
import { EXPLORER_URL, DURATION_OPTIONS } from "@/lib/constants";

const CURRENCIES = ["USDC", "USDT", "STRK"] as const;

const schema = z.object({
  price: z.string().min(1, "Price required").refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    "Must be a positive number"
  ),
  currency: z.enum(CURRENCIES),
  durationSeconds: z.number().min(86400),
});

type FormValues = z.infer<typeof schema>;

interface OfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetContract: string;
  tokenId: string;
  tokenName?: string;
}

export function OfferDialog({
  open,
  onOpenChange,
  assetContract,
  tokenId,
  tokenName,
}: OfferDialogProps) {
  const {
    makeOffer,
    hasWallet,
    hasActiveSession,
    isSettingUpSession,
    setupSession,
    isProcessing,
    txStatus,
    txHash,
    error,
    resetState,
  } = useMarketplace();

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [sessionSetupOpen, setSessionSetupOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { price: "", currency: "USDC", durationSeconds: 2592000 },
  });

  const onSubmit = (values: FormValues) => {
    setPendingValues(values);
    if (!hasWallet) {
      setWalletSetupOpen(true);
      return;
    }
    if (!hasActiveSession) {
      setSessionSetupOpen(true);
      return;
    }
    setPinOpen(true);
  };

  const handleSessionSetup = async (pin: string) => {
    await setupSession(pin);
    setSessionSetupOpen(false);
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!pendingValues) return;

    await makeOffer({
      assetContract,
      tokenId,
      price: pendingValues.price,
      currencySymbol: pendingValues.currency,
      durationSeconds: pendingValues.durationSeconds,
      pin,
    });
  };

  const handleClose = (v: boolean) => {
    if (!isProcessing) {
      resetState();
      form.reset();
      setPendingValues(null);
      onOpenChange(v);
    }
  };

  const isSuccess = txStatus === "confirmed";

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Make an offer</DialogTitle>
          </DialogHeader>

          {isSuccess ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="font-semibold text-lg">Offer submitted!</p>
              <p className="text-sm text-muted-foreground text-center">
                Your offer of {pendingValues?.price} {pendingValues?.currency} on{" "}
                {tokenName || `Token #${tokenId}`} is live.
              </p>
              {txHash && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    View on Voyager <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
              <Button className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {txStatus === "submitting" ? "Submitting offer…" : "Confirming on Starknet…"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Badge variant="outline" className="font-mono">#{tokenId}</Badge>
                <span className="text-sm font-medium truncate">{tokenName || `Token #${tokenId}`}</span>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer price</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              placeholder="0.00"
                              className="pr-16"
                              disabled={isProcessing}
                              {...field}
                            />
                          </FormControl>
                          <div className="absolute right-3 top-2 text-xs font-bold">
                            {form.watch("currency")}
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            {CURRENCIES.map((c) => (
                              <Button
                                key={c}
                                type="button"
                                variant={field.value === c ? "default" : "outline"}
                                size="sm"
                                onClick={() => field.onChange(c)}
                                disabled={isProcessing}
                              >
                                {c}
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="durationSeconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-4 gap-2">
                            {DURATION_OPTIONS.map((opt) => (
                              <Button
                                key={opt.label}
                                type="button"
                                variant={field.value === opt.seconds ? "default" : "outline"}
                                size="sm"
                                onClick={() => field.onChange(opt.seconds)}
                                disabled={isProcessing}
                                className="text-xs"
                              >
                                {opt.label}
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full h-11" disabled={isProcessing}>
                    <HandCoins className="h-4 w-4 mr-2" />
                    {hasWallet ? "Submit offer" : "Set up wallet & offer"}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground">
                    Gas is free. Your ERC-20 balance is locked until the offer expires or is accepted.
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
        title="Confirm offer"
        description={`Enter PIN to submit offer of ${pendingValues?.price} ${pendingValues?.currency} on ${tokenName || `#${tokenId}`}.`}
      />

      <SessionSetupDialog
        open={sessionSetupOpen}
        onOpenChange={setSessionSetupOpen}
        onSetup={handleSessionSetup}
        isProcessing={isSettingUpSession}
      />

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => {
          setWalletSetupOpen(false);
          if (!hasActiveSession) {
            setSessionSetupOpen(true);
          } else {
            setPinOpen(true);
          }
        }}
      />
    </>
  );
}
