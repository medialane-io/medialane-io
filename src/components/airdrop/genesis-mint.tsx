"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { serializeByteArray } from "@/lib/cairo-calldata";
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
  Wallet,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXPLORER_URL, MINT_CONTRACT, MINT_NFT_URI, MINT_NFT_IMAGE_URL } from "@/lib/constants";
import type { Call } from "starknet";

// ─── Featured airdrop image ────────────────────────────────────────────────────

export function AirdropEventCard() {
  const [errored, setErrored] = useState(false);
  const src = MINT_NFT_IMAGE_URL || "/genesis.jpg";
  return (
    <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-xl shadow-black/10 aspect-square w-full">
      {errored ? (
        <div className="w-full h-full bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-purple-500/10 flex flex-col items-center justify-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ImageIcon className="h-7 w-7 text-primary/40" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">Medialane Airdrop 2026</p>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Medialane Creator's Airdrop"
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

// ─── Genesis Mint ─────────────────────────────────────────────────────────────

type MintStep = "ready" | "minting" | "success" | "error";

export function GenesisMint() {
  const { hasWallet, address: walletAddress, isDeployed } = useWalletNativeSession();
  const pathname = usePathname();
  const action = useWalletWriteAction();

  const [mintStep, setMintStep] = useState<MintStep>("ready");
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintStatusMsg, setMintStatusMsg] = useState("");
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);

  const storageKey = walletAddress ? `ml_mint_${walletAddress}` : null;

  useEffect(() => {
    if (!storageKey) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) { setCompletedTxHash(stored); setMintStep("success"); }
  }, [storageKey]);

  const executeMint = useCallback(async () => {
    setMintError(null);
    setMintStep("minting");
    setMintStatusMsg("Preparing your record…");

    await action.run(async (signer) => {
      if (!walletAddress) throw new Error("Account not found. Please try again.");
      if (!MINT_CONTRACT) throw new Error("Airdrop has not started yet.");

      let tokenUri = MINT_NFT_URI
        ? MINT_NFT_URI.startsWith("ipfs://") || MINT_NFT_URI.startsWith("ar://")
          ? MINT_NFT_URI
          : `ipfs://${MINT_NFT_URI}`
        : "";
      if (!tokenUri) {
        setMintStatusMsg("Registering your participation…");
        const form = new FormData();
        form.append("name", "Medialane Launch Airdrop");
        form.append("description", "Early participant in the Medialane airdrop campaign.");
        form.append("external_url", "https://medialane.io/mint");
        const res = await fetch("/api/pinata", { method: "POST", body: form });
        const data = await res.json();
        if (data.error) throw new Error("Failed to register. Please try again.");
        tokenUri = data.uri;
      }

      setMintStatusMsg("Confirming participation…");
      const calldata = [walletAddress, ...serializeByteArray(tokenUri)];

      const result = await signer.execute([
        { contractAddress: MINT_CONTRACT, entrypoint: "mint_item", calldata },
      ] as Call[]);

      setMintStep("success");
      setCompletedTxHash(result.txHash);
      if (storageKey) localStorage.setItem(storageKey, result.txHash);
      return result;
    });
  }, [walletAddress, storageKey, action]);

  useEffect(() => {
    if (action.status === "error") {
      setMintStep("error");
      setMintError(action.error);
    }
  }, [action.status, action.error]);

  const handleClaim = useCallback(() => {
    void executeMint();
  }, [executeMint]);

  const handleRetry = () => {
    action.reset();
    setMintError(null);
    setMintStep("ready");
  };

  const handleResetMintGate = useCallback(() => {
    if (storageKey) localStorage.removeItem(storageKey);
    setCompletedTxHash(null);
    setMintStep("ready");
  }, [storageKey]);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!hasWallet || isDeployed === null) {
    return (
      <div className="flex items-center gap-3 py-2">
        <Wallet className="h-5 w-5 text-muted-foreground" />
        <Link href={`/wallet-onboarding?redirect_url=${encodeURIComponent(pathname)}`} className="text-sm text-primary hover:underline">
          Set up your wallet to join.
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-4 shadow-lg shadow-black/5">
      {mintStep === "ready" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Account active — mint your passport
            </span>
          </div>
          <div className="btn-border-animated p-[1px] rounded-2xl">
            <Button
              size="lg"
              className="w-full h-12 font-bold gap-2 bg-transparent text-white rounded-[15px] hover:bg-transparent hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              onClick={handleClaim}
              disabled={!MINT_CONTRACT}
            >
              <Sparkles className="h-4 w-4" />
              {MINT_CONTRACT ? "Claim my spot" : "Airdrop not started yet"}
            </Button>
          </div>
        </div>
      )}

      {mintStep === "minting" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary shrink-0" />
            <div>
              <p className="font-semibold text-sm">Registering your participation…</p>
              <p className="text-xs text-muted-foreground mt-0.5">{mintStatusMsg || "Please wait…"}</p>
            </div>
          </div>
          <div className="space-y-1.5 pl-9">
            {[
              { label: "Preparing your record", done: action.status !== "idle" },
              { label: "Submitting", done: action.status === "confirming" || action.status === "success" },
              { label: "Confirmed", done: action.status === "success" },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                {done ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />}
                <span className={done ? "text-foreground" : ""}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mintStep === "success" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="font-bold text-emerald-600 dark:text-emerald-300">You&apos;re in!</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your participation is confirmed.</p>
            </div>
          </div>
          {completedTxHash && (
            <a
              href={`${EXPLORER_URL}/tx/${completedTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="tabular-nums">{completedTxHash.slice(0, 12)}…{completedTxHash.slice(-8)}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button size="sm" asChild className="flex-1">
              <Link href="/launchpad/single-editions">Create</Link>
            </Button>
            <Button size="sm" variant="outline" asChild className="flex-1">
              <Link href="/marketplace">Explore</Link>
            </Button>
          </div>
          <button className="text-xs text-muted-foreground underline underline-offset-2 w-full text-center" onClick={handleResetMintGate}>
            Didn&apos;t mint your passport? Try again
          </button>
        </div>
      )}

      {mintStep === "error" && (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Could not complete</p>
              {mintError && <p className="text-xs text-muted-foreground mt-0.5">{mintError}</p>}
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={handleRetry}>
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </Button>
        </div>
      )}

    </div>
  );
}
