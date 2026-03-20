import { ArrowRightLeft, Tag, ShoppingCart, HandCoins, X, Sparkles } from "lucide-react";

export const ACTIVITY_TYPE_CONFIG: Record<string, {
  label: string;
  variant: "default" | "secondary" | "outline";
  icon: React.ElementType;
}> = {
  mint:     { label: "Mint",      variant: "default",   icon: Sparkles },
  transfer: { label: "Transfer",  variant: "secondary", icon: ArrowRightLeft },
  listing:  { label: "Listed",    variant: "default",   icon: Tag },
  sale:     { label: "Sale",      variant: "default",   icon: ShoppingCart },
  offer:    { label: "Offer",     variant: "outline",   icon: HandCoins },
  cancelled:{ label: "Cancelled", variant: "outline",   icon: X },
};
