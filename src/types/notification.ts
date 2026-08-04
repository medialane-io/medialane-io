export type NotificationType =
  | "offer"
  | "offer_accepted"
  | "sale"
  | "listing"
  | "mint"
  | "transfer"
  | "asset_received"
  | "cancelled"
  | "announcement";

/** "spotlight" notifications are the higher-attention subset; "normal" are feed-only. */
export type NotificationPriority = "normal" | "spotlight";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  image: string | null;
  href: string;
  timestamp: string;
  isUnread: boolean;
  priority: NotificationPriority;
  /** True for positive outcomes (offer accepted, asset received, my sale). */
  celebratory?: boolean;
  /** Extra structured data for richer rendering. */
  metadata?: {
    amount?: string;
    currency?: string;
    txHash?: string;
    assetName?: string;
  };
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  image: string | null;
  href: string;
  created_at: string;
  pinned?: boolean;
}
