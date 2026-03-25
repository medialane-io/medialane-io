import { ArrowRightLeft, Tag, ShoppingCart, HandCoins, X, Sparkles } from "lucide-react";

export const ACTIVITY_TYPE_CONFIG: Record<string, {
  label: string;
  variant: "default" | "secondary" | "outline";
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}> = {
  mint:      { label: "Mint",      variant: "default",   icon: Sparkles,       colorClass: "text-emerald-400", bgClass: "bg-emerald-500/10" },
  transfer:  { label: "Transfer",  variant: "secondary", icon: ArrowRightLeft, colorClass: "text-slate-400",   bgClass: "bg-slate-500/10" },
  listing:   { label: "Listed",    variant: "default",   icon: Tag,            colorClass: "text-sky-400",     bgClass: "bg-sky-500/10" },
  sale:      { label: "Sale",      variant: "default",   icon: ShoppingCart,   colorClass: "text-violet-400",  bgClass: "bg-violet-500/10" },
  offer:     { label: "Offer",     variant: "outline",   icon: HandCoins,      colorClass: "text-amber-400",   bgClass: "bg-amber-500/10" },
  cancelled: { label: "Cancelled", variant: "outline",   icon: X,              colorClass: "text-rose-400",    bgClass: "bg-rose-500/10" },
};

export const TYPE_FILTERS = [
  { label: "All",       value: "" },
  { label: "Mints",     value: "mint" },
  { label: "Sales",     value: "sale" },
  { label: "Listings",  value: "listing" },
  { label: "Offers",    value: "offer" },
  { label: "Transfers", value: "transfer" },
  { label: "Cancelled", value: "cancelled" },
];
