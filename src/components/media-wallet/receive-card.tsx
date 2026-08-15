"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { AddressQr } from "./address-qr";

const FUNDING_DOCS_URL = "https://docs.medialane.io/learn/funding-your-account";

export function ReceiveCard({ address }: { address: string }) {
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shareAddress = async () => {
    try {
      await navigator.share?.({ text: address });
    } catch {

    }
  };

  const starknetLogo = resolvedTheme === "light" ? "/Starknet-Light.svg" : "/Starknet-Dark.svg";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm text-muted-foreground">Receive assets with your address:</p>

      <button
        onClick={copy}
        className="flex items-center justify-center gap-2 rounded-2xl bg-foreground/[0.06] px-4 py-3.5 text-center transition-colors active:bg-foreground/[0.1]"
      >
        <span className="break-all font-mono text-sm font-medium">{address}</span>
        <CopyIcon className="shrink-0 opacity-50" />
      </button>

      <div className="flex gap-2">
        <button
          onClick={copy}
          className="h-11 flex-1 rounded-full border border-border text-sm font-semibold text-foreground transition-transform active:scale-[0.99] hover:bg-foreground/[0.04]"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
        {typeof navigator !== "undefined" && !!navigator.share && (
          <button
            onClick={shareAddress}
            className="h-11 flex-1 rounded-full border border-border text-sm font-semibold text-foreground transition-transform active:scale-[0.99] hover:bg-foreground/[0.04]"
          >
            Share
          </button>
        )}
      </div>

      <AddressQr value={address} />

      <div className="flex items-center gap-3 rounded-2xl bg-card/40 px-4 py-3 backdrop-blur-sm">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-foreground/[0.06]">
          <Image src={starknetLogo} alt="Starknet" width={22} height={22} />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Your onchain account is self-custody and permissionless. Please use
          only the Starknet blockchain to send and receive assets.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 pt-1 text-center">
        <p className="text-xs text-muted-foreground">Don&apos;t have tokens yet?</p>
        <a
          href={FUNDING_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center rounded-full border border-brand-blue/50 px-5 text-sm font-semibold text-brand-blue transition-colors hover:bg-brand-blue/10"
        >
          How to fund your account
        </a>
      </div>
    </div>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}
