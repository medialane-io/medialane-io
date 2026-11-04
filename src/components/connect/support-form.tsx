"use client";

import { useState } from "react";
import { describeError } from "@medialane/ui";
import { Button } from "@medialane/ui/button";
import { Textarea } from "@medialane/ui/textarea";
import { Loader2 } from "lucide-react";
import { getMedialaneClient } from "@/lib/medialane-client";
import { useSession } from "@/hooks/use-session";

export function SupportForm({ onBack }: { onBack: () => void }) {
  const { session } = useSession();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = session?.email;

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      await getMedialaneClient().api.account.contactSupport({ message: message.trim() || undefined });
      setSent(true);
    } catch (err) {
      setError(describeError(err).message);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full space-y-4">
        <p className="text-sm text-muted-foreground">
          Thanks, we&apos;ve got your message. We&apos;ll write back to <span className="text-foreground">{email}</span>.
        </p>
        <Button variant="ghost" className="w-full" onClick={onBack}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Write to our team</p>
        <p className="text-sm text-muted-foreground">
          We&apos;ll reply to <span className="text-foreground">{email}</span>.
        </p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="support-message" className="text-xs text-muted-foreground">
          What happened? (optional)
        </label>
        <Textarea
          id="support-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          rows={5}
          disabled={sending}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" onClick={() => void send()} disabled={sending}>
        {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send
      </Button>
      <Button variant="ghost" className="w-full" onClick={onBack} disabled={sending}>
        Back
      </Button>
    </div>
  );
}
