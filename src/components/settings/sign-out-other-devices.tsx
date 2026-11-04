"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { describeError } from "@medialane/ui";
import { Button } from "@medialane/ui/button";
import { getMedialaneClient } from "@/lib/medialane-client";

type State = { kind: "idle" } | { kind: "pending" } | { kind: "done" } | { kind: "error"; message: string };

export function SignOutOtherDevices() {
  const [state, setState] = useState<State>({ kind: "idle" });

  const signOut = async () => {
    if (state.kind === "pending") return;
    setState({ kind: "pending" });
    try {
      await getMedialaneClient().api.account.signOutOtherDevices();
      setState({ kind: "done" });
    } catch (err) {
      setState({ kind: "error", message: describeError(err).message });
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={signOut} disabled={state.kind === "pending"} variant="outline" size="sm">
        {state.kind === "pending" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
        Sign out other devices
      </Button>
      {state.kind === "done" && <p className="text-sm">Other devices are signed out.</p>}
      {state.kind === "error" && <p className="text-sm text-destructive">{state.message}</p>}
      <p className="text-sm text-muted-foreground">
        Devices listed above can still sign in with their key. Remove a device to stop that.
      </p>
    </div>
  );
}
