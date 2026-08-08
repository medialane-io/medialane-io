import type { WalletToken } from "./wallet-tokens";

/**
 * The panel's own client-side view stack — replaces media-wallet's separate
 * Next.js routes (/wallet, /send, /token/[symbol], /activities) so the whole
 * thing stays one modular component instead of five pages.
 */
export type WalletPanelView =
  | { name: "home" }
  | { name: "send"; token?: WalletToken }
  | { name: "token"; token: WalletToken }
  | { name: "activity" };
