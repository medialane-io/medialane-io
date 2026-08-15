"use client";

import { useEffect, useRef, useState } from "react";
import { CurrencyIcon } from "@medialane/ui";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useTokenBalance } from "@/hooks/use-erc20-balance";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { ActionButton } from "@medialane/ui";
import { TrustNote } from "./action-button";
import { ActivateCard } from "./activate-card";
import { QuickAction } from "./quick-action";
import { AddressQr } from "./address-qr";
import { ActionModal } from "./action-modal";
import { SectionHeader } from "./section-header";
import { SuccessDialog } from "./success-dialog";
import { WalletPanelHeader } from "./wallet-panel-header";
import { WALLET_TOKENS, type WalletToken } from "./wallet-tokens";
import { pickVaultTeaserItems } from "./vault-teaser-items";
import { VaultTeaserStrip } from "./vault-teaser-strip";
import { useUsdPrices, usdPriceFor } from "@/hooks/use-usd-prices";
import { fmt, fmtUsd, rawToNumber } from "@/lib/wallet-format";
import type { WalletPanelView } from "./types";

export function WalletPanelHome({
  onNavigate,
  onClose,
  autoOpenReceive,
}: {
  onNavigate: (view: WalletPanelView) => void;
  onClose: () => void;
  autoOpenReceive?: boolean;
}) {
  const { address, isDeployed } = useWalletNativeSession();

  const balances: Record<WalletToken["symbol"], ReturnType<typeof useTokenBalance>> = {
    STRK: useTokenBalance("STRK", address),
    ETH: useTokenBalance("ETH", address),
    USDC: useTokenBalance("USDC", address),
    WBTC: useTokenBalance("WBTC", address),
  };

  const { tokens, isLoading: loadingVault } = useTokensByOwner(address, 1, 6);
  const vaultItems = pickVaultTeaserItems(tokens, 6);

  const usdPrices = useUsdPrices();
  const [panel, setPanel] = useState<"receive" | null>(autoOpenReceive ? "receive" : null);
  const [hideBalances, setHideBalances] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activated, setActivated] = useState(false);
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setHideBalances(localStorage.getItem("mediawallet.hideBalances") === "1");
  }, []);

  const scrollParent = () => mainRef.current?.parentElement ?? null;
  const onTouchStart = (e: React.TouchEvent) => {
    const sc = scrollParent();
    startY.current = sc && sc.scrollTop <= 0 ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPull(Math.min(dy * 0.5, 90));
  };
  const onTouchEnd = () => {
    setPull(0);
    startY.current = null;
  };

  const copy = () => {
    if (!address) return;
    navigator.clipboard?.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shareAddress = async () => {
    if (!address) return;
    try {
      await navigator.share?.({ text: address });
    } catch {

    }
  };

  const usd = (symbol: WalletToken["symbol"]) => {
    const { rawBalance, decimals } = balances[symbol];
    return rawToNumber(rawBalance, decimals) * (usdPriceFor(usdPrices, symbol) ?? 0);
  };
  const totalUsd = WALLET_TOKENS.reduce((sum, t) => sum + usd(t.symbol), 0);
  const heldTokens = WALLET_TOKENS.filter((t) => (balances[t.symbol].rawBalance ?? 0n) > 0n);

  const strkBalance = balances.STRK.rawBalance;
  const funded = strkBalance != null && strkBalance > 0n;
  const canSend = isDeployed === true && funded;

  return (
    <main
      ref={mainRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative flex flex-col gap-6 px-5 pb-8 pt-2"
      style={{ transform: pull ? `translateY(${pull}px)` : undefined, transition: pull ? "none" : "transform 0.2s ease" }}
    >
      {address && <WalletPanelHeader address={address} onNavigate={onClose} />}

      <section className="flex flex-col gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
            Welcome to your vault
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {hideBalances ? "••••" : usdPrices === null ? "…" : `${fmtUsd(totalUsd)} available`}
          </p>
        </div>
        <VaultTeaserStrip
          items={vaultItems}
          isLoading={loadingVault}
          onViewVault={() => window.location.assign("/portfolio")}
        />
      </section>

      {funded ? (
        <div className="grid grid-cols-3 gap-2">
          <QuickAction label="Send" action="vault" disabled={!canSend} onClick={() => onNavigate({ name: "send" })} icon={<ArrowUp />} />
          <QuickAction label="Receive" action="vault" onClick={() => setPanel(panel === "receive" ? null : "receive")} icon={<ArrowDown />} />
          <QuickAction label="Activity" action="vault" onClick={() => onNavigate({ name: "activity" })} icon={<ActivityIcon />} />
        </div>
      ) : (
        isDeployed === true && (
          <button
            onClick={() => setPanel(panel === "receive" ? null : "receive")}
            className="h-[54px] w-full rounded-[13px] text-[15px] font-semibold text-white transition-transform active:scale-[0.99]"
            style={{ background: "linear-gradient(115deg,#3b7bff,#5b4ce6)" }}
          >
            Fund your account
          </button>
        )
      )}

      {isDeployed === false && <ActivateCard onActivated={() => setActivated(true)} />}

      {panel === "receive" && address && (
        <ActionModal title="Receive" onClose={() => setPanel(null)}>
          <div className="flex flex-col gap-3">
            <AddressQr value={address} />
            <div className="rounded-2xl bg-foreground/[0.05] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Your address</div>
              <div className="mt-1.5 break-all font-mono text-sm">{address}</div>
            </div>
            <div className="flex gap-2">
              <ActionButton action="license" big onClick={copy} className="flex-1">
                {copied ? "Copied ✓" : "Copy"}
              </ActionButton>
              {typeof navigator !== "undefined" && !!navigator.share && (
                <button
                  onClick={shareAddress}
                  className="h-[54px] flex-1 rounded-[13px] border border-border text-[15px] font-semibold text-foreground transition-transform active:scale-[0.99] hover:bg-foreground/[0.04]"
                >
                  Share
                </button>
              )}
            </div>
            <TrustNote>Send only Starknet assets to this address.</TrustNote>
          </div>
        </ActionModal>
      )}

      {heldTokens.length > 0 && (
        <section>
          <SectionHeader title="Balances" />
          <div className="mt-2 flex flex-col gap-2">
            {heldTokens.map((t) => {
              const { rawBalance, decimals } = balances[t.symbol];
              return (
                <button
                  key={t.symbol}
                  onClick={() => onNavigate({ name: "token", token: t })}
                  className="flex items-center gap-3 rounded-2xl bg-card/40 px-4 py-3 text-left backdrop-blur-sm transition-colors hover:bg-card/60"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-foreground/[0.06]">
                    <CurrencyIcon symbol={t.symbol} size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{t.symbol}</div>
                    <div className="text-xs text-muted-foreground">{t.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">{hideBalances ? "••••" : fmt(rawBalance, decimals)}</div>
                    {!hideBalances && usdPrices !== null && (
                      <div className="text-xs text-muted-foreground tabular-nums">{fmtUsd(usd(t.symbol))}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {activated && (
        <SuccessDialog
          title="Vault activated"
          message="Your vault is live and ready to use"
          onClose={() => setActivated(false)}
        />
      )}

      <a
        href="https://starknet.medialane.io"
        target="_blank"
        rel="noopener noreferrer"
        className="text-center text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
      >
        Use other wallet
      </a>
    </main>
  );
}

function ArrowUp() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
function ArrowDown() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}
function ActivityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
