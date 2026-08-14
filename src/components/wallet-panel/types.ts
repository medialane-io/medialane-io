import type { WalletToken } from "./wallet-tokens";

export type WalletPanelView =
  | { name: "home" }
  | { name: "send"; token?: WalletToken }
  | { name: "token"; token: WalletToken }
  | { name: "activity" };
