export type NotificationType =
  | "offer"
  | "sale"
  | "listing"
  | "mint"
  | "transfer"
  | "cancelled"
  | "announcement";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  image: string | null;
  href: string;
  timestamp: string;
  isUnread: boolean;
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
