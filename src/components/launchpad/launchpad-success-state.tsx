"use client";

import type { ElementType, ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
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
    <div className="max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-6">
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

// ─────────────────────────────────────────────────────────────────────────────

interface LaunchpadProcessingStateProps {
  title?: string;
  description?: string;
}

/**
 * Full-page processing screen for launchpad flows. Replaces the form while
 * the on-chain tx is pending so the user has unambiguous feedback that
 * something is happening, instead of staring at a disabled button.
 */
export function LaunchpadProcessingState({
  title = "Confirming on Starknet…",
  description = "Please wait, do not close this window. This usually takes 10–20 seconds.",
}: LaunchpadProcessingStateProps) {
  return (
    <div className="max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-6">
      <div className="flex justify-center">
        <div className="h-20 w-20 rounded-full flex items-center justify-center bg-primary/10">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface LaunchpadErrorStateProps {
  title?: string;
  description: string;
  backHref: string;
  backLabel: string;
  onRetry: () => void;
}

export function LaunchpadErrorState({
  title = "Something went wrong",
  description,
  backHref,
  backLabel,
  onRetry,
}: LaunchpadErrorStateProps) {
  return (
    <div className="max-w-lg mx-auto px-4 pt-24 pb-8 text-center space-y-6">
      <div className="flex justify-center">
        <div className="h-20 w-20 rounded-full flex items-center justify-center bg-destructive/10">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild variant="outline">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
        <Button variant="destructive" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}
