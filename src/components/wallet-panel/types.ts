import type { WalletToken } from "./wallet-tokens";

export type WalletPanelView =
  | { name: "home"; autoOpenReceive?: boolean }
  | { name: "send"; token?: WalletToken }
  | { name: "token"; token: WalletToken }
  | { name: "activity" };
