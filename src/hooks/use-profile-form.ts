"use client";

import { describeError } from "@medialane/ui";
import { useCallback, useEffect, useState } from "react";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useSession } from "@/hooks/use-session";
import { requireSignedIn } from "@/lib/account-gate";
import { useCreatorProfile } from "@/hooks/use-profiles";
import { getMedialaneClient } from "@/lib/medialane-client";
import { emptyProfileForm, invalidUrlFields, profileFormFrom, profilePayload } from "@/lib/settings/profile";
import type { ProfileForm } from "@/components/settings/types";

export function useProfileForm() {
  const { address } = useWalletNativeSession();
  const { session } = useSession();
  const { profile, isLoading, mutate } = useCreatorProfile(address ?? undefined);
  const [form, setForm] = useState<ProfileForm>(emptyProfileForm);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) setForm(profileFormFrom(profile));
  }, [profile]);

  const setField = useCallback((key: keyof ProfileForm, value: string) => setForm((f) => ({ ...f, [key]: value })), []);

  const save = useCallback(async () => {
    if (!address) return;
    if (invalidUrlFields(form).length > 0) {
      setSaveStatus("error");
      setSaveError("All URL fields must start with http://, https://, or ipfs://");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      requireSignedIn(session);
      const result = (await getMedialaneClient().api.updateCreatorProfile(address, profilePayload(form))) as
        | { walletAddress: string }
        | { error?: string };
      if (!("walletAddress" in result) || !result.walletAddress) {
        throw new Error("error" in result && result.error ? result.error : "Save failed — please try again");
      }
      await mutate(undefined, { revalidate: true });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (e: unknown) {
      setSaveStatus("error");
      setSaveError(describeError(e, "Failed to save changes").message);
    } finally {
      setSaving(false);
    }
  }, [address, form, session, mutate]);

  return { address, profile, isLoading, form, setField, saving, saveStatus, saveError, save };
}
