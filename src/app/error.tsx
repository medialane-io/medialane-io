"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6">
      <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          An unexpected error occurred. Please try again or refresh the page.
        </p>
        {error.digest && (
          <p className="text-[11px] text-muted-foreground/60 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={reset}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Try again
      </Button>
    </div>
  );
}
