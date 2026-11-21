"use client";

import { describeError } from "@medialane/ui";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@medialane/ui/button";
import { Input } from "@medialane/ui/input";
import { sealImportedOwnerKey } from "@/lib/wallet/passkey";
import { saveSealedOwner, notifyWalletChange } from "@/lib/wallet/store";
import { isOwnerOf } from "@/lib/wallet/devices";
import { parseRecoveryKey, InvalidRecoveryKeyError } from "@medialane/sdk/starknet";
import { useT } from "@medialane/ui/i18n";

export function RecoveryKeyRestore({ onRestored }: { onRestored: () => void }) {
  const t = useT();
  const [keyInput, setKeyInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const preview = (() => {
    const trimmed = keyInput.trim();
    if (!trimmed) return null;
    try {
      return parseRecoveryKey(trimmed);
    } catch {
      return null;
    }
  })();

  const restore = async () => {
    setBusy(true);
    setErr(null);
    try {
      const sealed = await sealImportedOwnerKey(parseRecoveryKey(keyInput));
      const owned = await isOwnerOf(sealed.address, sealed.ownerPubKey).catch(() => false);
      if (!owned) {
        setErr(t("Paste the full recovery key for this account."));
        setBusy(false);
        return;
      }
      saveSealedOwner(sealed);
      notifyWalletChange();
      onRestored();
    } catch (e) {
      if (e instanceof InvalidRecoveryKeyError) {
        setErr(t("Paste the full recovery key, starting with medialane-recovery."));
      } else {
        setErr(describeError(e).message);
      }
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        {t("Paste the recovery key saved from Settings. This device then asks for a new passkey to protect it.")}
      </p>
      <Input
        value={keyInput}
        onChange={(e) => setKeyInput(e.target.value)}
        placeholder={t("medialane-recovery:v1:…")}
        autoComplete="off"
        spellCheck={false}
        className="font-mono text-xs"
      />
      {preview && (
        <p className="text-xs text-muted-foreground">
          {t("This key restores account")}{" "}
          <span className="font-mono text-foreground break-all">{preview.walletAddress}</span>
        </p>
      )}
      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button onClick={restore} disabled={busy || !preview}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("Restore account")}
      </Button>
    </div>
  );
}
