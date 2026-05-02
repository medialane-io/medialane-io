import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { NotificationsFeed } from "./notifications-feed";

export const metadata: Metadata = {
  title: "Notifications — Medialane",
  description: "Your offers, activity, and platform announcements.",
};

export default function NotificationsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 pt-10 pb-20 max-w-2xl">
      <div className="mb-8 space-y-1">
        <div className="flex items-center gap-2.5">
          <Bell className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Offers received, marketplace activity, and announcements.
        </p>
      </div>
      <NotificationsFeed />
    </div>
  );
}
