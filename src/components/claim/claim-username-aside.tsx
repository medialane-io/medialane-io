import { AtSign, UserCircle, Sparkles, BadgeCheck } from "lucide-react";
import { ClaimRail } from "@/components/claim/claim-rail";

/** Right-rail content for /claim/username. */
export function ClaimUsernameAside() {
  return (
    <ClaimRail
      included={[
        { icon: AtSign, title: "Your own creator URL", desc: "A clean address like medialane.io/creator/yourname." },
        { icon: UserCircle, title: "One public profile", desc: "Your work, collections and coins, all in one place." },
        { icon: Sparkles, title: "Easy to find", desc: "Fans reach the real you, not a copycat." },
      ]}
      steps={[
        "Pick the username you want",
        "We check it's available",
        "Reviewed by the DAO, then it's yours",
      ]}
      trustIcon={BadgeCheck}
      trustLead="Yours to keep."
      trust="Usernames are reviewed by the Medialane DAO to prevent impersonation — once approved, the name is reserved to you."
    />
  );
}
