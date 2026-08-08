"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { WalletPanel } from "./wallet-panel";
import { WALLET_PANEL_PORTAL_ID } from "./action-modal";

const WL_OPEN = "ml:wallet-panel-open";
const WL_CLOSE = "ml:wallet-panel-close";

/** Same open/close-by-event pattern as @medialane/ui's useNavCommandMenu —
 * lets any component (the header trigger, a future nav command) open the
 * panel without prop-drilling state through the app shell. */
export function useWalletPanel() {
  return {
    open: () => document.dispatchEvent(new CustomEvent(WL_OPEN)),
    close: () => document.dispatchEvent(new CustomEvent(WL_CLOSE)),
  };
}

/**
 * Reuses @medialane/ui's NavCommandMenu overlay recipe verbatim — the same
 * `.nav-canvas-overlay` backdrop (blur(48px) saturate(1.5)) behind a
 * centered, fade+slide+scale animated panel — but sized to a vertical phone
 * aspect ratio instead of the command menu's wide card, and holding the
 * wallet UI instead of the command list.
 */
export function WalletPanelOverlay() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener(WL_OPEN, onOpen);
    document.addEventListener(WL_CLOSE, onClose);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener(WL_OPEN, onOpen);
      document.removeEventListener(WL_CLOSE, onClose);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const close = () => setOpen(false);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="nav-canvas-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
          />
          <motion.div
            className="fixed inset-0 z-[101] flex items-end justify-center p-3 pb-4 sm:items-center sm:p-4"
            initial={{ opacity: 0, y: 24, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={close}
          >
            <div
              id={WALLET_PANEL_PORTAL_ID}
              className={
                "relative flex w-full max-w-[390px] flex-col overflow-hidden rounded-[32px] " +
                "aspect-[9/19.5] max-h-[85dvh] " +
                "border border-border/40 bg-background shadow-2xl"
              }
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={close}
                aria-label="Close wallet"
                className="absolute right-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-full bg-foreground/[0.06] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <WalletPanel onClose={close} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
