"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { useSiwsToken } from "@/hooks/use-siws-token";
import { withSiwsAuth } from "@/lib/pinata-fetch";
import { serializeByteArray } from "@/lib/cairo-calldata";
import {
  Sparkles,
  Zap,
  Shield,
  ExternalLink,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
  Gift,
  Droplets,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EXPLORER_URL,
  LAUNCH_MINT_CONTRACT,
  GENESIS_NFT_URI,
} from "@/lib/constants";
import { LaunchCountdown } from "./launch-countdown";
import type { Call } from "starknet";

function GenesisNftCard({ minted = false }: { minted?: boolean }) {
  return (
    <div className="relative w-96 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/30">
      <Image
        src="/genesis.jpg"
        alt="Medialane Genesis NFT"
        width={400}
        height={400}
        className="w-full aspect-square object-cover"
        priority
      />
      {minted && (
        <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 border border-emerald-500/40">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          <span className="text-[11px] font-semibold text-emerald-400">Minted</span>
        </div>
      )}
    </div>
  );
}

const PERKS = [
  { icon: Gift, label: "Free to mint", sub: "Zero protocol fees" },
  { icon: Zap, label: "Self-custody", sub: "Secured by your passkey" },
  { icon: Droplets, label: "Airdrop passport", sub: "Future distribution" },
  { icon: Shield, label: "Programmable IP", sub: "Immutable ownership" },
];

function PerksGrid() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {PERKS.map(({ icon: Icon, label, sub }) => (
        <div
          key={label}
          className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3 hover:border-primary/30 transition-colors"
        >
          <div className="mt-0.5 h-7 w-7 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold leading-tight">{label}</p>
            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

type MintStep = "ready" | "minting" | "success" | "error";

export function LaunchMint() {
  const { hasWallet, address: recipientAddress, isDeployed } = useWalletNativeSession();
  const action = useWalletWriteAction();
  const { getValidToken, signIn } = useSiwsToken();

  const [mintStep, setMintStep] = useState<MintStep>("ready");
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintStatusMsg, setMintStatusMsg] = useState("");
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (!recipientAddress) return;
    const stored = localStorage.getItem(`ml_genesis_${recipientAddress}`);
    if (stored) {
      setCompletedTxHash(stored);
      setMintStep("success");
    }
  }, [recipientAddress]);

  const handleMint = useCallback(async () => {
    setMintError(null);
    setMintStep("minting");
    setMintStatusMsg("Preparing your NFT…");

    await action.run(async (signer) => {
      if (!recipientAddress) throw new Error("Account not ready. Please refresh and try again.");
      if (!LAUNCH_MINT_CONTRACT) throw new Error("Mint contract not configured.");

      let tokenUri = GENESIS_NFT_URI
        ? GENESIS_NFT_URI.startsWith("ipfs://") || GENESIS_NFT_URI.startsWith("ar://")
          ? GENESIS_NFT_URI
          : `ipfs://${GENESIS_NFT_URI}`
        : "";
      if (!tokenUri) {
        setMintStatusMsg("Uploading NFT metadata…");
        const form = new FormData();
        form.append("name", "Medialane Genesis");
        form.append(
          "description",
          "Claim your exclusive Genesis NFT."
        );
        form.append("external_url", "https://medialane.io");
        const siwsToken = getValidToken() ?? (await signIn());
        if (!siwsToken) throw new Error("Account not ready. Please refresh and try again.");
        const res = await fetch("/api/pinata", withSiwsAuth(siwsToken, { method: "POST", body: form }));
        const data = await res.json();
        if (data.error) throw new Error("Metadata upload failed: " + data.error);
        tokenUri = data.uri;
      }

      setMintStatusMsg("Submitting transaction…");
      const calldata = [recipientAddress, ...serializeByteArray(tokenUri)];

      const result = await signer.execute([
        { contractAddress: LAUNCH_MINT_CONTRACT, entrypoint: "mint_item", calldata },
      ] as Call[]);

      setMintStep("success");
      setCompletedTxHash(result.txHash);
      if (recipientAddress) localStorage.setItem(`ml_genesis_${recipientAddress}`, result.txHash);
      return result;
    });
  }, [recipientAddress, action, getValidToken, signIn]);

  useEffect(() => {
    if (action.status === "error") {
      setMintStep("error");
      setMintError(action.error);
    }
  }, [action.status, action.error]);

  const handleRetry = () => {
    action.reset();
    setMintError(null);
    setMintStep("ready");
  };

  const handleResetMintGate = useCallback(() => {
    if (recipientAddress) localStorage.removeItem(`ml_genesis_${recipientAddress}`);
    setCompletedTxHash(null);
    setMintStep("ready");
  }, [recipientAddress]);

  const isSuccess = mintStep === "success";

  return (
    <div className="relative flex items-center">

      <div className="mx-auto px-4 py-8 relative max-w-5xl">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          <div className="flex justify-center">
            <GenesisNftCard minted={isSuccess} />
          </div>

          <div>

            {isDeployed === null && !hasWallet && (
              <div className="space-y-6">
                <div className="h-10 w-48 rounded-lg bg-muted/40 animate-pulse" />
                <div className="h-24 rounded-xl bg-muted/30 animate-pulse" />
                <div className="h-12 rounded-xl bg-muted/20 animate-pulse" />
              </div>
            )}

            {!hasWallet && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1]">
                    Secure your{" "}
                    <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Medialane account
                    </span>
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    One quick step before minting — secure your self-custody account with a passkey. No seed phrases to write down.
                  </p>
                </div>

                <div className="space-y-2">
                  <LaunchCountdown />
                </div>

                <PerksGrid />
              </div>
            )}

            {hasWallet && (
              <div className="space-y-7">

                {mintStep !== "success" && (
                  <div className="space-y-3">

                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
                      Claim your{" "}
                      <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        NFT
                      </span>
                    </h1>
                  </div>
                )}

                {mintStep === "ready" && (
                  <>
                    <div className="space-y-2">
                      <LaunchCountdown />
                    </div>
                    <PerksGrid />
                    <div className="space-y-3">
                      <Button
                        size="lg"
                        className="w-full rounded-xl h-12 text-base font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
                        onClick={() => void handleMint()}
                        disabled={!LAUNCH_MINT_CONTRACT}
                      >
                        <Sparkles className="h-4 w-4" />
                        {LAUNCH_MINT_CONTRACT ? "Claim Genesis NFT — Free" : "Mint opening soon"}
                        <ArrowRight className="h-4 w-4 ml-auto" />
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Limited edition · Mainnet Launch
                      </p>
                    </div>
                  </>
                )}

                {mintStep === "minting" && (
                  <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 shrink-0">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Minting your Genesis NFT…</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {mintStatusMsg || "Please wait…"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      {[
                        { label: "Upload metadata", done: action.status !== "idle" },
                        { label: "Submit transaction", done: action.status === "confirming" || action.status === "success" },
                        { label: "Confirm onchain", done: action.status === "success" },
                      ].map(({ label, done }) => (
                        <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                          {done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                          )}
                          <span className={done ? "text-foreground" : ""}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {mintStep === "success" && (
                  <div className="space-y-5">
                    <div className="space-y-3">

                      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
                        You&apos;re{" "}
                        <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                          in!
                        </span>
                      </h1>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-300 text-lg">NFT claimed!</p>
                          <p className="text-sm text-muted-foreground">
                            You&apos;re part of the Medialane genesis community.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
                          <Droplets className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Airdrop passport</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
                          <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Immutable ownership</span>
                        </div>
                      </div>

                      {completedTxHash && (
                        <a
                          href={`${EXPLORER_URL}/tx/${completedTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                        >
                          <span className="tabular-nums">
                            {completedTxHash.slice(0, 12)}…{completedTxHash.slice(-8)}
                          </span>
                          <ExternalLink className="h-3 w-3 group-hover:text-primary transition-colors" />
                        </a>
                      )}
                    </div>

                    <div className="space-y-2">
                      <LaunchCountdown />
                    </div>
                    <button
                      className="text-xs text-muted-foreground underline underline-offset-2"
                      onClick={handleResetMintGate}
                    >
                      Didn&apos;t receive your NFT? Try again
                    </button>
                  </div>
                )}

                {mintStep === "error" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm">Mint failed</p>
                          {mintError && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {mintError}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="gap-2" onClick={handleRetry}>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Try again
                      </Button>
                    </div>
                    <PerksGrid />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
