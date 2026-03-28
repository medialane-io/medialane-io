"use client";

import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Lock, Wallet } from "lucide-react";

interface ClaimGateProps {
  children: React.ReactNode;
}

export function ClaimGate({ children }: ClaimGateProps) {
  const { isSignedIn, isLoaded } = useUser();
  const { hasWallet, isLoadingWallet } = useSessionKey();

  // Loading — Clerk or wallet resolving
  if (!isLoaded || (isLoaded && isSignedIn && isLoadingWallet)) {
    return (
      <div className="space-y-3 max-w-lg">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  // Ready — render children directly
  if (isSignedIn && hasWallet) {
    return <>{children}</>;
  }

  // Gated — blur children, show overlay CTA
  return (
    <div className="relative">
      {/* Blurred preview */}
      <div className="blur-sm pointer-events-none select-none" aria-hidden>
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="rounded-2xl border border-border bg-background/90 backdrop-blur-sm p-6 text-center space-y-4 w-full max-w-xs shadow-xl">
          {!isSignedIn ? (
            <>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Sign in to access this claim</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a free account or sign in to continue.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <SignUpButton mode="modal">
                  <Button className="w-full" size="sm">Sign up — it&apos;s free</Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm" className="w-full">Sign in</Button>
                </SignInButton>
              </div>
            </>
          ) : (
            <>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Wallet required</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Set up your Starknet wallet to access claims.
                </p>
              </div>
              <Button size="sm" className="w-full" asChild>
                <Link href="/onboarding?redirect_url=/claim">Set up wallet</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
