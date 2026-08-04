import {
  CheckCircle2, Gift, HandCoins, Megaphone, Zap, Tag, Sparkles, ArrowRightLeft, X,
} from "lucide-react";
import type { NotificationType } from "@/types/notification";

export const NOTIFICATION_ICON: Record<NotificationType, React.ElementType> = {
  offer_accepted: CheckCircle2,
  asset_received: Gift,
  offer:          HandCoins,
  sale:           Zap,
  listing:        Tag,
  mint:           Sparkles,
  transfer:       ArrowRightLeft,
  cancelled:      X,
  announcement:   Megaphone,
};

export const NOTIFICATION_COLOR: Record<NotificationType, string> = {
  offer_accepted: "text-emerald-400 bg-emerald-500/10",
  asset_received: "text-teal-400 bg-teal-500/10",
  offer:          "text-amber-400 bg-amber-500/10",
  sale:           "text-violet-400 bg-violet-500/10",
  listing:        "text-sky-400 bg-sky-500/10",
  mint:           "text-emerald-400 bg-emerald-500/10",
  transfer:       "text-slate-400 bg-slate-500/10",
  cancelled:      "text-rose-400 bg-rose-500/10",
  announcement:   "text-purple-400 bg-purple-500/10",
};

export const NOTIFICATION_LABEL: Record<NotificationType, string> = {
  offer_accepted: "Offer accepted",
  asset_received: "Asset received",
  offer:          "New offer",
  sale:           "Sale",
  listing:        "Listing",
  mint:           "Mint",
  transfer:       "Transfer",
  cancelled:      "Cancelled",
  announcement:   "Announcement",
};
