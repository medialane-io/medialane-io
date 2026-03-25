"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RefreshCw, AlertCircle } from "lucide-react";
import { ReactNode } from "react";

interface EmptyOrErrorProps {
  isLoading: boolean;
  error?: unknown;
  isEmpty: boolean;
  onRetry?: () => void;
  emptyTitle: string;
  emptyDescription?: string;
  emptyCta?: { label: string; href: string };
  emptyIcon?: ReactNode;
  skeletonCount?: number;
  /** Optional custom skeleton renderer — replaces the default row skeletons */
  skeletonNode?: ReactNode;
  children?: ReactNode;
}

export function EmptyOrError({
  isLoading,
  error,
  isEmpty,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyCta,
  emptyIcon,
  skeletonCount = 4,
  skeletonNode,
  children,
}: EmptyOrErrorProps) {
  if (isLoading) {
    if (skeletonNode) return <>{skeletonNode}</>;
    return (
      <div className="space-y-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="h-14 w-14 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <p className="font-semibold text-lg">Something went wrong</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          {error instanceof Error ? error.message : "Failed to load data. Please try again."}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="py-16 text-center space-y-4">
        {emptyIcon && (
          <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center mx-auto">
            {emptyIcon}
          </div>
        )}
        <p className="font-semibold text-lg">{emptyTitle}</p>
        {emptyDescription && (
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">{emptyDescription}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          )}
          {emptyCta && (
            <Button size="sm" asChild>
              <Link href={emptyCta.href}>{emptyCta.label}</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
