import { Lock, ShieldCheck, Wallet, KeyRound, ArrowLeftRight } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";

export function CreateCoinAside() {
  return (
    <ClaimRail
      included={[
        { icon: ShieldCheck, title: "Fixed supply forever", desc: "Minting is disabled the moment your coin is created." },
        { icon: Wallet, title: "Purchased at market price", desc: "Capped at 10% and bought from the pool at your own price." },
        { icon: KeyRound, title: "Ownership renounced", desc: "Verifiable on any explorer. Control transfers away automatically at launch." },
        { icon: ArrowLeftRight, title: "You choose the pair", desc: "Price and pair are entirely your choice, from STRK, ETH, WBTC, USDC, or USDT." },
      ]}
      includedAccentClass="bg-brand-orange/10 text-brand-orange"
      steps={[
        "Design your coin's face and story",
        "Set your coin's economics",
        "Launch your coin",
      ]}
      stepAccentClass="bg-brand-maeve/10 text-brand-maeve"
      trustIcon={Lock}
      trustAccentClass="text-brand-orange"
      trustLead="Locked forever."
      trust="Liquidity moves into a dedicated locker contract permanently. Only trading fees stay collectible."
    />
  );
}
