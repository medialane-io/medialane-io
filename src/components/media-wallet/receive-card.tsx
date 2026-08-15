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
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Receive assets with your address:</p>
        <p className="mt-1.5 break-all font-mono text-sm font-medium">{address}</p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            onClick={copy}
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
          {typeof navigator !== "undefined" && !!navigator.share && (
            <button
              onClick={shareAddress}
              className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Share
            </button>
          )}
        </div>
      </div>

      <AddressQr value={address} />

      <div className="flex flex-col items-center gap-2 text-center">
        <Image src={starknetLogo} alt="Starknet" width={26} height={26} />
        <p className="max-w-[22rem] text-xs leading-relaxed text-muted-foreground">
          Your onchain account is self-custody and permissionless. Please use only
          the Starknet blockchain to send and receive assets.
        </p>
      </div>

      <a
        href={FUNDING_DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-[54px] w-full items-center justify-center rounded-[13px] text-[15px] font-semibold text-white transition-transform active:scale-[0.99]"
        style={{ background: "linear-gradient(115deg,#3b7bff,#5b4ce6)" }}
      >
        Deposit money
      </a>
    </div>
  );
}
