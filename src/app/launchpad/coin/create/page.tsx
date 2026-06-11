"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Coins, ExternalLink, TrendingUp } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import {
  getTokenBySymbol, formatAmount,
  validateCoinName as validateName,
  validateCoinSymbol as validateSymbol,
  validateCoinSupply as validateSupply,
  coinToRaw as toRaw,
  teamCoinsRaw, buybackQuoteRaw, fdvHuman,
} from "@medialane/sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { LaunchpadPageIntro } from "@/components/launchpad/launchpad-page-intro";
import { LaunchpadSignedOutState } from "@/components/launchpad/launchpad-signed-out-state";
import {
  LaunchpadSuccessState,
  LaunchpadProcessingState,
  LaunchpadErrorState,
} from "@/components/launchpad/launchpad-success-state";
import { useSessionKey } from "@/hooks/use-session-key";
import { useTokenBalance } from "@/hooks/use-erc20-balance";
import { useLaunchCoin, type LaunchCoinInput } from "@/hooks/use-launch-coin";

const QUOTE_OPTIONS = ["STRK", "ETH"] as const;
type Quote = (typeof QUOTE_OPTIONS)[number];

const DAPP_COLLECTIONS_BASE = "https://dapp.medialane.io/collections";

export default function CoinCreatePage() {
  const { isSignedIn } = useUser();
  const { walletAddress, hasWallet } = useSessionKey();
  const { launch, status, error } = useLaunchCoin();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("");
  const [quote, setQuote] = useState<Quote>("STRK");
  const [teamPct, setTeamPct] = useState(5);

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [coinAddress, setCoinAddress] = useState<string | null>(null);

  const quoteToken = getTokenBySymbol(quote)!;
  const { rawBalance } = useTokenBalance(quote, walletAddress ?? null);

  const nameErr = name ? validateName(name) : null;
  const symErr = symbol ? validateSymbol(symbol) : null;
  const supplyErr = supply ? validateSupply(supply) : null;
  const inputsValid = !validateName(name) && !validateSymbol(symbol) && !validateSupply(supply);

  const preview = useMemo(() => {
    if (validateSupply(supply)) return null;
    const supplyHuman = Number(supply);
    const supplyRaw = toRaw(BigInt(supply));
    const teamRaw = teamCoinsRaw(supplyRaw, teamPct);
    const buybackRaw = buybackQuoteRaw(teamRaw, quoteToken.decimals);
    return {
      fdv: fdvHuman(supplyHuman),
      teamCoins: supplyHuman * (teamPct / 100),
      buybackRaw,
      buybackHuman: formatAmount(buybackRaw.toString(), quoteToken.decimals),
    };
  }, [supply, teamPct, quoteToken.decimals]);

  const insufficient =
    preview != null && rawBalance != null && rawBalance < preview.buybackRaw;
  const canLaunch = inputsValid && preview != null && !insufficient;

  const handleLaunchClick = () => {
    if (!canLaunch) return;
    if (!hasWallet) { setWalletSetupOpen(true); return; }
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!walletAddress) return;
    const input: LaunchCoinInput = { name, symbol, supplyHuman: supply, quoteSymbol: quote, teamPct };
    try {
      const result = await launch(input, pin, walletAddress);
      setCoinAddress(result.coinAddress);
    } catch {
      // status/error handled by the hook; error state rendered below
    }
  };

  const handleReset = () => {
    setCoinAddress(null);
    setName(""); setSymbol(""); setSupply(""); setTeamPct(5);
  };

  if (!isSignedIn) {
    return (
      <LaunchpadSignedOutState
        icon={TrendingUp}
        iconClassName="text-pink-400"
        title="Launch a Creator Coin"
        description="Sign in to deploy your own coin with permanently-locked Ekubo liquidity — gasless, in a few clicks."
      />
    );
  }

  if (status === "done" && coinAddress) {
    return (
      <LaunchpadSuccessState
        icon={Coins}
        accentClassName="bg-pink-500/10"
        iconClassName="text-pink-400"
        actionClassName="bg-brand-rose hover:bg-brand-rose/90"
        title="Your Creator Coin is live"
        description="Deployed and launched on Ekubo with permanently-locked liquidity. Trading starts on the dapp right away."
        backHref="/launchpad"
        backLabel="Back to Launchpad"
        actionLabel="Launch another coin"
        onAction={handleReset}
      >
        <div className="space-y-3">
          <p className="font-mono text-xs text-muted-foreground break-all">{coinAddress}</p>
          <Button asChild className="bg-brand-rose hover:bg-brand-rose/90">
            <a href={`${DAPP_COLLECTIONS_BASE}/${coinAddress}`} target="_blank" rel="noopener noreferrer">
              View &amp; trade your coin <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </a>
          </Button>
        </div>
      </LaunchpadSuccessState>
    );
  }

  if (status === "deploying" || status === "launching" || status === "indexing") {
    return (
      <LaunchpadProcessingState
        title={
          status === "deploying" ? "Deploying your coin…" :
          status === "launching" ? "Launching on Ekubo…" : "Indexing…"
        }
        description="Two on-chain steps, fully gasless. Please keep this window open."
      />
    );
  }

  if (status === "error" && error) {
    return (
      <LaunchpadErrorState
        description={error}
        backHref="/launchpad"
        backLabel="Back to Launchpad"
        onRetry={handleReset}
      />
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 pt-24 pb-8 space-y-8">
      <LaunchpadPageIntro
        icon={Coins}
        badge="Creator Coin"
        title="Launch a Creator Coin"
        description={`Deploy a fixed-supply coin with permanently-locked Ekubo liquidity. Launch price is fixed at 0.01 ${quote}/coin — your supply sets the market cap.`}
        className="text-pink-400"
      />

      <div className="space-y-6 rounded-2xl border border-border/40 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Coin" />
            {nameErr && <p className="text-xs text-destructive">{nameErr}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="symbol">Symbol</Label>
            <Input id="symbol" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="COIN" />
            {symErr && <p className="text-xs text-destructive">{symErr}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="supply">Total supply</Label>
          <Input
            id="supply" inputMode="numeric" value={supply}
            onChange={(e) => setSupply(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="1000000"
          />
          {supplyErr && <p className="text-xs text-destructive">{supplyErr}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Quote token</Label>
          <div className="flex gap-2">
            {QUOTE_OPTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuote(q)}
                className={`rounded-lg border px-4 py-1.5 text-sm font-medium ${quote === q ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="alloc">Team allocation: {teamPct}%</Label>
          <input
            id="alloc" type="range" min={0} max={10} step={1}
            value={teamPct} onChange={(e) => setTeamPct(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Up to 10% goes to your wallet, bought out of the pool at launch (you fund the quote).
          </p>
        </div>

        {preview && (
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-muted/40 p-4 text-sm">
            <div><p className="text-[10px] uppercase text-muted-foreground">FDV</p><p className="font-semibold">{preview.fdv.toLocaleString()} {quote}</p></div>
            <div><p className="text-[10px] uppercase text-muted-foreground">Your coins</p><p className="font-semibold">{preview.teamCoins.toLocaleString()}</p></div>
            <div><p className="text-[10px] uppercase text-muted-foreground">You fund</p><p className="font-semibold">{preview.buybackHuman} {quote}</p></div>
          </div>
        )}
        {insufficient && (
          <p className="text-xs text-destructive">
            Insufficient {quote} balance for the buyback ({preview?.buybackHuman} {quote} needed).
          </p>
        )}

        <Button onClick={handleLaunchClick} disabled={!canLaunch} className="w-full">
          Launch Creator Coin
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Gasless — two on-chain steps, one PIN.{" "}
          <Link href="/launchpad/memecoin" className="underline hover:text-foreground">
            Already launched a coin? Claim it instead.
          </Link>
        </p>
      </div>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Confirm coin launch"
        description="Enter your PIN to deploy and launch your coin on Ekubo."
      />
      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => { setWalletSetupOpen(false); setPinOpen(true); }}
      />
    </div>
  );
}
