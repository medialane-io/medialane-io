import { Lock, Sparkles, TrendingUp } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";

export function CreateCoinAside() {
  return (
    <ClaimRail
      included={[
        { icon: Sparkles, title: "One confirmation", desc: "Sign once with your passkey to launch." },
        { icon: TrendingUp, title: "Tradable immediately", desc: "Your coin opens on the market the moment it launches." },
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
      trust="Liquidity locks permanently at launch."
    />
  );
}
