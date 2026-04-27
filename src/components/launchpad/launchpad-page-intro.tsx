"use client";

import type { ElementType, ReactNode } from "react";

interface LaunchpadPageIntroProps {
  icon: ElementType;
  badge: string;
  title: string;
  description: string;
  className?: string;
  children?: ReactNode;
}

export function LaunchpadPageIntro({
  icon: Icon,
  badge,
  title,
  description,
  className = "text-primary",
  children,
}: LaunchpadPageIntroProps) {
  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 ${className}`}>
        <Icon className="h-5 w-5" />
        <span className="text-sm font-semibold uppercase tracking-wider">{badge}</span>
      </div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}
