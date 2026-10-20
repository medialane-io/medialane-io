"use client";

import { describeError, AccountSection } from "@medialane/ui";
import { useState } from "react";
import { CheckCircle2, Clock, Loader2, Mail } from "lucide-react";
import { Badge } from "@medialane/ui/badge";
import { Button } from "@medialane/ui/button";
import { Input } from "@medialane/ui/input";
import { SettingsGate, SettingsPage } from "@/components/settings/settings-page";
import { EmailVerifyDialog } from "@/components/settings/email-verify-dialog";
import { useAccountEmail } from "@/hooks/use-account-email";
import { formatDeadline } from "@/lib/settings/rows";

export default function EmailSettingsPage() {
  const { status, markVerified, changeEmail } = useAccountEmail();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [skipInitialSend, setSkipInitialSend] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [input, setInput] = useState("");
  const [changeStatus, setChangeStatus] = useState<"idle" | "saving" | "error">("idle");
  const [changeError, setChangeError] = useState<string | null>(null);

  async function handleChange() {
    const email = input.trim();
    if (!email) return;
    setChangeStatus("saving");
    setChangeError(null);
    try {
      await changeEmail(email);
      setEditOpen(false);
      setInput("");
      setChangeStatus("idle");
      setSkipInitialSend(true);
      setDialogOpen(true);
    } catch (err) {
      setChangeStatus("error");
      setChangeError(describeError(err, "Failed to update email").message);
    }
  }

  function cancelEdit() {
    setEditOpen(false);
    setInput("");
    setChangeStatus("idle");
    setChangeError(null);
  }

  return (
    <SettingsGate>
      <SettingsPage title="Email" subtitle="Used for account notices and signing back in." icon={<Mail className="h-4 w-4 text-white" />}>
        <AccountSection
          icon={Mail}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-500/10"
          title="Email"
          description="Used for account notices and signing back in."
        >
          {editOpen ? (
            <div className="space-y-3">
              <Input
                type="email"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setChangeStatus("idle");
                  setChangeError(null);
                }}
                placeholder="you@example.com"
                disabled={changeStatus === "saving"}
                className="w-full"
                onKeyDown={(e) => e.key === "Enter" && input.trim() && void handleChange()}
              />
              <div className="flex gap-2">
                <Button onClick={handleChange} disabled={!input.trim() || changeStatus === "saving"} className="flex-1 sm:flex-none">
                  {changeStatus === "saving" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                  Save
                </Button>
                <Button variant="ghost" onClick={cancelEdit} disabled={changeStatus === "saving"}>
                  Cancel
                </Button>
              </div>
              {changeStatus === "error" && changeError ? <p className="text-sm text-destructive">{changeError}</p> : null}
              <p className="text-xs text-muted-foreground">You&apos;ll need to verify the new email.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {status ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 truncate text-sm text-foreground">{status.email}</span>
                    {status.verified ? (
                      <Badge variant="outline" className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-yellow-500/40 bg-yellow-500/10 text-[10px] text-yellow-700 dark:text-yellow-400">
                        <Clock className="h-3 w-3" /> Not verified
                      </Badge>
                    )}
                  </div>
                  {!status.verified && status.deadline ? (
                    <p className="text-sm text-muted-foreground">Please confirm by {formatDeadline(status.deadline, "long")}.</p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
              <div className="flex flex-wrap gap-2">
                {status && !status.verified ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSkipInitialSend(false);
                      setDialogOpen(true);
                    }}
                  >
                    Verify email
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditOpen(true);
                    setInput(status?.email ?? "");
                  }}
                >
                  Change email
                </Button>
              </div>
            </div>
          )}
        </AccountSection>

        {status ? (
          <EmailVerifyDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            email={status.email}
            onVerified={markVerified}
            skipInitialSend={skipInitialSend}
          />
        ) : null}
      </SettingsPage>
    </SettingsGate>
  );
}
