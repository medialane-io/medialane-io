"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import { timeAgo, cn } from "@/lib/utils";
import { NOTIFICATION_ICON, NOTIFICATION_COLOR } from "@/lib/notification-meta";
import type { Notification } from "@/types/notification";

interface NotificationRowProps {
  notification: Notification;
  onNavigate?: () => void;
  compact?: boolean;
}

export function NotificationRow({
  notification,
  onNavigate,
  compact = false,
}: NotificationRowProps) {
  const { type, title, description, image, href, timestamp, isUnread } = notification;
  const Icon = NOTIFICATION_ICON[type] ?? Bell;
  const colorClass = NOTIFICATION_COLOR[type] ?? "text-muted-foreground bg-muted/40";

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-start gap-3 px-4 transition-colors group",
        compact ? "py-3" : "py-4",
        isUnread && "bg-primary/[0.03]",
        "hover:bg-muted/40"
      )}
    >
      {/* Thumbnail + type badge */}
      <div className="relative shrink-0 mt-0.5">
        {image ? (
          <>
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted ring-1 ring-border/40">
              <Image
                src={image}
                alt=""
                width={40}
                height={40}
                className="object-cover w-full h-full"
                unoptimized
              />
            </div>
            <div
              className={cn(
                "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background flex items-center justify-center",
                colorClass
              )}
            >
              <Icon className="h-2.5 w-2.5" />
            </div>
          </>
        ) : (
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center ring-1 ring-border/20",
              colorClass
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p
          className={cn(
            "text-sm leading-snug truncate",
            isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/90"
          )}
        >
          {title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
        <p className="text-[10px] text-muted-foreground/50 pt-0.5">{timeAgo(timestamp)}</p>
      </div>

      {/* Unread dot */}
      {isUnread && (
        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </Link>
  );
}
