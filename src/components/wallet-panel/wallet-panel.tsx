"use client";

import { useState } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import type { WalletPanelView } from "./types";
import { WalletPanelHome } from "./wallet-panel-home";
import { WalletPanelSend } from "./wallet-panel-send";
import { WalletPanelTokenDetail } from "./wallet-panel-token-detail";
import { WalletPanelActivity } from "./wallet-panel-activity";

/**
 * The phone-shaped shell. Holds one piece of client-side view-state instead
 * of media-wallet's separate Next.js routes (/wallet, /send, /token/[symbol],
 * /activities) — this is what makes the whole thing one modular component.
 */
export function WalletPanel({ onClose }: { onClose: () => void }) {
  const { hasWallet, isDeployed } = useWalletNativeSession();
  const [view, setView] = useState<WalletPanelView>({ name: "home" });

  if (!hasWallet) {
    return (
      <EntryState
        icon={<Wallet className="h-8 w-8 mx-auto text-muted-foreground" />}
        message="Let's secure your account to get started."
        cta="Set up account"
        href="/wallet-onboarding"
        onClose={onClose}
      />
    );
  }

  // A local owner key exists but the wallet never confirmed as deployed —
  // setup was interrupted before completing. /wallet-onboarding resumes
  // with this exact key rather than creating a new one.
  if (isDeployed === false) {
    return (
      <EntryState
        icon={<Wallet className="h-8 w-8 mx-auto text-muted-foreground" />}
        message="Your account setup didn't finish. Let's pick up where you left off."
        cta="Finish setting up"
        href="/wallet-onboarding"
        onClose={onClose}
      />
    );
  }

  switch (view.name) {
    case "home":
      return <WalletPanelHome onNavigate={setView} />;
    case "send":
      return <WalletPanelSend initialToken={view.token} onNavigate={setView} onDone={() => setView({ name: "home" })} />;
    case "token":
      return <WalletPanelTokenDetail token={view.token} onNavigate={setView} />;
    case "activity":
      return <WalletPanelActivity onNavigate={setView} />;
  }
}

function EntryState({
  icon,
  message,
  cta,
  href,
  onClose,
}: {
  icon: React.ReactNode;
  message: string;
  cta: string;
  href: string;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      {icon}
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="btn-border-animated p-[1px] rounded-lg">
        <Link
          href={href}
          onClick={onClose}
          className="flex items-center gap-2 rounded-[7px] bg-transparent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-transparent hover:brightness-110 active:scale-[0.98]"
        >
          <Wallet className="h-4 w-4" />
          {cta}
        </Link>
      </div>
    </div>
  );
}
