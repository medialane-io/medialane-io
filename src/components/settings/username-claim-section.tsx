"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@medialane/ui/badge";
import { CopyLinkButton } from "@/components/settings/copy-link-button";
import { ClaimError, UsernameClaimInput } from "@/components/settings/username-claim-input";
import { useUsernameClaimForm } from "@/hooks/use-username-claim-form";
import { profileHref } from "@/lib/routes";

export function UsernameClaimSection() {
  const router = useRouter();
  const username = useUsernameClaimForm();
  const { address, approvedUsername, claim } = username;

  const claimInput = (
    <div className="space-y-3">
      <UsernameClaimInput
        value={username.input}
        onChange={username.change}
        onCheck={username.check}
        onSubmit={username.submit}
        checkState={username.checkState}
        checkReason={username.checkReason}
        loading={username.claiming}
        disabled={!address}
      />
      {username.claimStatus === "success" ? (
        <p className="text-sm text-emerald-500">✓ Claim submitted — the Medialane DAO team will review it shortly.</p>
      ) : null}
      {username.claimStatus === "error" && username.claimError ? (
        <ClaimError error={username.claimError} onVerifyEmail={() => router.push("/settings/email")} />
      ) : null}
    </div>
  );

  if (approvedUsername) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-green-500/40 bg-green-500/5 p-4">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Username active</p>
            <p className="mt-0.5 break-words text-sm text-muted-foreground">
              Your profile is live at{" "}
              <a href={profileHref({ username: approvedUsername })} className="font-medium tabular-nums text-primary hover:underline">
                medialane.io/creator/{approvedUsername}
              </a>
            </p>
          </div>
          <CopyLinkButton url={`https://www.medialane.io/creator/${approvedUsername}`} />
        </div>
      </div>
    );
  }

  if (claim?.status === "PENDING") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">Claim under review</p>
            <Badge variant="outline" className="border-yellow-500/40 bg-yellow-500/10 text-2xs text-yellow-700 dark:text-yellow-400">
              Pending
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">@{claim.username}</span> is awaiting DAO review.
            You&apos;ll be notified by email once processed.
          </p>
        </div>
      </div>
    );
  }

  if (claim?.status === "REJECTED") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Claim rejected</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              <span className="tabular-nums text-foreground">@{claim.username}</span> was not approved.
              {claim.adminNotes ? <span className="ml-1 italic">&ldquo;{claim.adminNotes}&rdquo;</span> : null}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">You can submit a new claim below.</p>
          </div>
        </div>
        {claimInput}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Get a shareable URL like <span className="tabular-nums text-foreground">medialane.io/creator/yourname</span>. Claims are
        reviewed by the Medialane DAO team to prevent impersonation.
      </p>
      {claimInput}
    </div>
  );
}
