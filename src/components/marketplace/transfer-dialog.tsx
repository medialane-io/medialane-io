"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
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
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useTransfer } from "@/hooks/use-transfer";
import { useResolvedTokenStandard } from "@/hooks/use-resolved-token-standard";
import {
  MarketplacePinStep,
  MarketplaceDialogHero,
  MarketplaceActivatingSession,
} from "@/components/marketplace/marketplace-dialog-primitives";
import { EXPLORER_URL } from "@/lib/constants";
import { isWebAuthnSupported } from "@chipi-stack/nextjs";
import { usePasskeyAuth } from "@chipi-stack/chipi-passkey/hooks";

const schema = z.object({
  toAddress: z
    .string()
    .min(1, "Recipient address is required")
    .regex(
      /^0x[0-9a-fA-F]{1,64}$/,
      "Must be a valid Starknet address (0x followed by hex characters)"
    ),
});

type FormValues = z.infer<typeof schema>;
type Step = "form" | "pin" | "success";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractAddress: string;
  tokenId: string;
  tokenName?: string;
  tokenImage?: string | null;
  onSuccess?: () => void;
  hasActiveListing?: boolean;
  tokenStandard?: "ERC721" | "ERC1155" | "UNKNOWN";
}

export function TransferDialog({
  open,
  onOpenChange,
  contractAddress,
  tokenId,
  tokenName,
  tokenImage,
  onSuccess,
  hasActiveListing = false,
  tokenStandard,
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

  const { tokenStandard: resolvedStandard } = useResolvedTokenStandard(contractAddress, tokenStandard);
  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );
  const { authenticate, encryptKey } = usePasskeyAuth();

  const [step, setStep] = useState<Step>("form");
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isAuthenticatingPasskey, setIsAuthenticatingPasskey] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { toAddress: "" },
  });

  const handleClose = (v: boolean) => {
    if (!isProcessing) {
      resetState();
      form.reset();
      setPendingAddress(null);
      setPin("");
      setPinError(null);
      setStep("form");
      onOpenChange(v);
    }
  };

  useEffect(() => {
    if (open) {
      resetState();
      form.reset();
      setPendingAddress(null);
      setPin("");
      setPinError(null);
      setStep("form");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (values: FormValues) => {
    if (walletAddress) {
      try {
        if (BigInt(values.toAddress) === BigInt(walletAddress)) {
          form.setError("toAddress", { message: "Cannot transfer to yourself" });
          return;
        }
      } catch {
        // BigInt parse failed — Zod regex already validated the format
      }
    }
    setPendingAddress(values.toAddress);
    if (!hasWallet) {
      setWalletSetupOpen(true);
      return;
    }
    setStep("pin");
  };

  const executeTransfer = async (pinOrKey: string) => {
    if (!pendingAddress) return;
    const hash = await transferToken({
      contractAddress,
      tokenId,
      toAddress: pendingAddress,
      pin: pinOrKey,
      tokenStandard: resolvedStandard,
    });
    if (hash) setStep("success");
  };

  const handlePin = async () => {
    setPinError(null);
    await executeTransfer(pin);
    if (error) setPinError(error);
  };

  const handleUsePasskey = async () => {
    setIsAuthenticatingPasskey(true);
    try {
      const derivedKey = encryptKey ?? (await authenticate());
      if (!derivedKey) throw new Error("Passkey authentication failed");
      await executeTransfer(derivedKey);
    } catch {
      setPinError("Passkey authentication failed. Try your PIN instead.");
    } finally {
      setIsAuthenticatingPasskey(false);
    }
  };

  const displayName = tokenName || `Token #${tokenId}`;
  const recipientShort = pendingAddress
    ? `${pendingAddress.slice(0, 8)}…${pendingAddress.slice(-6)}`
    : "";

  const shieldFooter = (
    <div className="flex items-start justify-center gap-1.5">
      <ShieldCheck className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-[10px] text-center text-muted-foreground">
        Transfer is recorded permanently onchain. Gas is sponsored by Medialane.
      </p>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl flex flex-col max-h-[92svh]">
          <DialogTitle className="sr-only">Transfer {displayName}</DialogTitle>
          <DialogDescription className="sr-only">
            Enter a recipient Starknet address to transfer this asset onchain.
          </DialogDescription>

          <MarketplaceDialogHero
            tokenImage={tokenImage}
            tokenName={tokenName}
            tokenId={tokenId}
            fallbackIcon={<ArrowRightLeft className="h-12 w-12 text-brand-blue/30" />}
          />

          {/* ── Success ──────────────────────────────────────────────── */}
          {step === "success" ? (
            <div className="flex flex-col items-center gap-5 p-6 py-8">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-bold text-xl">Transfer complete!</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{displayName}</span>{" "}
                  has been sent to{" "}
                  <span className="font-mono text-foreground">{recipientShort}</span>.
                </p>
              </div>
              {txHash && (
                <a
                  href={`${EXPLORER_URL}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="font-mono">{txHash.slice(0, 10)}…{txHash.slice(-8)}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <Button
                className="w-full h-11"
                onClick={() => {
                  handleClose(false);
                  onSuccess?.();
                }}
              >
                Done
              </Button>
            </div>

          ) : isProcessing ? (
            /* ── Processing ─────────────────────────────────────────── */
            <div className="flex flex-col items-center gap-5 p-6 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center space-y-1">
                <p className="font-semibold">
                  {txStatus === "submitting" ? "Submitting transfer…" : "Confirming on Starknet…"}
                </p>
                <p className="text-sm text-muted-foreground">Please wait, do not close this window.</p>
              </div>
            </div>

          ) : isLoadingWallet ? (
            <MarketplaceActivatingSession />

          ) : step === "pin" ? (
            /* ── PIN step ────────────────────────────────────────────── */
            <>
              <div className="flex items-end justify-between px-6 pt-3 pb-1">
                <div className="min-w-0">
                  <p className="font-bold text-lg leading-tight truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                    → {recipientShort}
                  </p>
                </div>
              </div>
              <MarketplacePinStep
                description="Enter your PIN to authorise this transfer. This action cannot be undone."
                pin={pin}
                onPinChange={(v) => { setPin(v); setPinError(null); }}
                pinError={pinError}
                error={error}
                secondaryLabel="Back"
                onSecondary={() => { setStep("form"); setPin(""); setPinError(null); }}
                primaryLabel="Transfer"
                onPrimary={handlePin}
                primaryDisabled={pin.length < 6 || isProcessing}
                primaryIcon={<ArrowRightLeft className="h-4 w-4" />}
                passkeySupported={passkeySupported}
                isAuthenticatingPasskey={isAuthenticatingPasskey}
                onUsePasskey={handleUsePasskey}
                footer={shieldFooter}
              />
            </>

          ) : (
            /* ── Form step ───────────────────────────────────────────── */
            <div className="px-5 pb-4 pt-3 space-y-3">
              <p className="font-bold text-base leading-tight truncate">{displayName}</p>

              {hasActiveListing && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    This token has an active listing. A buyer could still complete the purchase after you transfer it — cancel the listing first, or proceed with caution.
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Transfers are permanent and irreversible. Double-check the recipient address before confirming.
                </AlertDescription>
              </Alert>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <FormField
                    control={form.control}
                    name="toAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0x…"
                            disabled={isProcessing}
                            autoComplete="off"
                            spellCheck={false}
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

                  <div className="pt-1 space-y-2">
                    <div className={`btn-border-animated p-[1px] rounded-xl ${(isProcessing || isLoadingWallet) ? "pointer-events-none" : ""}`}>
                      <button
                        type="submit"
                        disabled={isProcessing || isLoadingWallet}
                        className="w-full h-11 rounded-[11px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-transparent"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        {hasWallet ? "Transfer" : "Set up wallet & transfer"}
                      </button>
                    </div>
                    {shieldFooter}
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => {
          setWalletSetupOpen(false);
          setStep("pin");
        }}
      />
    </>
  );
}
