"use client";

import { useState } from "react";
import type { WalletPanelView } from "./types";
import { WalletPanelHome } from "./wallet-panel-home";
import { WalletPanelSend } from "./wallet-panel-send";
import { WalletPanelTokenDetail } from "./wallet-panel-token-detail";
import { WalletPanelActivity } from "./wallet-panel-activity";

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
