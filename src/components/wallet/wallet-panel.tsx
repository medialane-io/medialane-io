"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, ExternalLink, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useTokenBalance } from "@/hooks/use-erc20-balance";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getListableTokens, formatAmount } from "@medialane/sdk";
import { EXPLORER_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Call } from "starknet";

/** Returns true if addr is a valid non-zero Starknet address (0x + 1–64 hex chars). */
function isValidStarknetAddress(addr: string): boolean {
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(addr)) return false;
  return addr.replace(/^0x0*/, "").length > 0;
}

const TRANSFERABLE_TOKENS = getListableTokens().map((t) => t.symbol);

export function WalletPanel() {
  const { hasWallet, address, isDeployed } = useWalletNativeSession();
  const [copied, setCopied] = useState(false);
  const [tokenSymbol, setTokenSymbol] = useState(TRANSFERABLE_TOKENS[0] ?? "STRK");
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);

  const { rawBalance, decimals } = useTokenBalance(tokenSymbol, address);
  const action = useWalletWriteAction();
  const isProcessing = action.status === "processing" || action.status === "confirming";

  if (!hasWallet) {
    return (
      <section className="space-y-3 rounded-lg border border-dashed border-border bg-card p-4">
        <h2 className="text-base font-semibold">Wallet</h2>
        <p className="text-sm text-muted-foreground">
          Set up your wallet to view your balance and send funds.
        </p>
        <Button asChild>
          <Link href="/wallet-onboarding?redirect_url=/settings/wallet">Set up your wallet</Link>
        </Button>
      </section>
    );
  }

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSend = () => {
    setAddressError(null);
    const trimmed = toAddress.trim();
    if (!isValidStarknetAddress(trimmed)) {
      setAddressError("Enter a valid Starknet address");
      return;
    }
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setAddressError("Enter an amount greater than 0");
      return;
    }
    const token = getListableTokens().find((t) => t.symbol === tokenSymbol);
    if (!token) { setAddressError("Unknown token"); return; }
    const raw = BigInt(Math.round(parsed * 10 ** token.decimals));
    const low = (raw & BigInt("0xffffffffffffffffffffffffffffffff")).toString();
    const high = (raw >> 128n).toString();

    void action.run(async (signer) => {
      const result = await signer.execute([
        {
          contractAddress: token.address,
          entrypoint: "transfer",
          calldata: [trimmed, low, high],
        },
      ] as Call[]);
      setToAddress("");
      setAmount("");
      return result;
    });
  };

  const balanceDisplay = rawBalance != null ? formatAmount(rawBalance.toString(), decimals) : "0.0000";

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4">
      <header>
        <h2 className="text-base font-semibold">Wallet</h2>
        <p className="text-xs text-muted-foreground">
          Self-custody Starknet wallet, secured by your device passkey.
        </p>
      </header>

      <div className="space-y-3 rounded-md bg-muted px-4 py-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-medium text-muted-foreground">Address</span>
          <div className="flex items-center gap-1.5">
            <code className="truncate text-[11px]">{address}</code>
            <button type="button" onClick={handleCopy} aria-label="Copy address" className="text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
            <a
              href={`${EXPLORER_URL}/contract/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View on explorer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        {isDeployed === false && (
          <p className="text-[11px] text-amber-500">
            Not yet deployed onchain — this happens automatically with your first transaction.
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-medium text-muted-foreground">Balance</span>
          <span className="tabular-nums text-sm">{balanceDisplay} {tokenSymbol}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Send className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-sm font-medium">Send</p>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {TRANSFERABLE_TOKENS.map((symbol) => (
            <button
              key={symbol}
              type="button"
              onClick={() => setTokenSymbol(symbol)}
              className={cn(
                "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                symbol === tokenSymbol
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/50"
              )}
            >
              {symbol}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="wallet-panel-to" className="text-xs">Recipient address</Label>
          <Input
            id="wallet-panel-to"
            placeholder="0x…"
            value={toAddress}
            onChange={(e) => { setToAddress(e.target.value); setAddressError(null); }}
            className="tabular-nums text-xs"
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="wallet-panel-amount" className="text-xs">Amount</Label>
          <Input
            id="wallet-panel-amount"
            type="number"
            min="0"
            step="any"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {addressError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{addressError}</AlertDescription>
          </Alert>
        )}
        {action.status === "error" && action.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{action.error}</AlertDescription>
          </Alert>
        )}
        {action.status === "success" && action.txHash && (
          <Alert className="border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <AlertDescription className="text-xs flex items-center justify-between gap-2">
              <span>Sent!</span>
              <a
                href={`${EXPLORER_URL}/tx/${action.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                View <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>
        )}

        <Button
          className="w-full"
          onClick={handleSend}
          disabled={isProcessing || !toAddress || !amount}
        >
          {isProcessing ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Sending…</> : "Send"}
        </Button>
      </div>
    </section>
  );
}
