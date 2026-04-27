"use client";

import type { ElementType, ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface LaunchpadSuccessStateProps {
  icon: ElementType;
  accentClassName: string;
  iconClassName: string;
  actionClassName: string;
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
  actionLabel: string;
  onAction: () => void;
  children?: ReactNode;
}

export function LaunchpadSuccessState({
  icon: Icon,
  accentClassName,
  iconClassName,
  actionClassName,
  title,
  description,
  backHref,
  backLabel,
  actionLabel,
  onAction,
  children,
}: LaunchpadSuccessStateProps) {
  return (
    <div className="container max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-6">
      <div className="flex justify-center">
        <div className={`h-20 w-20 rounded-full flex items-center justify-center ${accentClassName}`}>
          <Icon className={`h-10 w-10 ${iconClassName}`} />
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {children}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild variant="outline">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
        <Button onClick={onAction} className={actionClassName}>
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
