"use client";

import { useState } from "react";
import type { WalletPanelView } from "./types";
import { WalletPanelHome } from "./wallet-panel-home";
import { WalletPanelSend } from "./wallet-panel-send";
import { WalletPanelTokenDetail } from "./wallet-panel-token-detail";
import { WalletPanelActivity } from "./wallet-panel-activity";

/**
 * The phone-shaped shell. Holds one piece of client-side view-state instead
 * of media-wallet's separate Next.js routes (/wallet, /send, /token/[symbol],
 * /activities) — this is what makes the whole thing one modular component.
 *
 * Assumes a fully deployed wallet — `HeaderWalletTrigger` (the only place
 * that opens this panel) routes the no-wallet and undeployed-wallet cases
 * straight to /connect / /wallet-onboarding instead of opening it, so there
 * is no entry state to render here.
 */
export function WalletPanel({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<WalletPanelView>({ name: "home" });

  switch (view.name) {
    case "home":
      return <WalletPanelHome onNavigate={setView} onClose={onClose} />;
    case "send":
      return <WalletPanelSend initialToken={view.token} onNavigate={setView} onDone={() => setView({ name: "home" })} />;
    case "token":
      return <WalletPanelTokenDetail token={view.token} onNavigate={setView} />;
    case "activity":
      return <WalletPanelActivity onNavigate={setView} />;
  }
}
