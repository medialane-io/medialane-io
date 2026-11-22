"use client";

import { AssetPicker, useTokensByOwner, type OwnedAsset } from "@medialane/ui";
import { useState } from "react";
import { CheckCircle2, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@medialane/ui/button";
import { Skeleton } from "@medialane/ui/skeleton";
import { FastMint } from "@/components/launchpad/fast-mint";
import { ProfileLivePreview } from "@/components/settings/profile-live-preview";
import { SettingsGate, SettingsPage, SettingsSection } from "@/components/settings/settings-page";
import { useProfileForm } from "@/hooks/use-profile-form";
import { useMyUsernameClaim } from "@/hooks/use-username-claims";
import { resolveImage } from "@/lib/utils";
import { useT } from "@medialane/ui/i18n";

export default function AppearanceSettingsPage() {
  const t = useT();
  const { address, isLoading, form, setField, saving, saveStatus, saveError, save } = useProfileForm();
  const { username } = useMyUsernameClaim();
  const { tokens, isLoading: assetsLoading } = useTokensByOwner(address ?? null, 1, 100);
  const [fastMintOpen, setFastMintOpen] = useState(false);

  const assets: OwnedAsset[] = tokens.map((t) => ({
    contractAddress: t.contractAddress,
    tokenId: t.tokenId,
    name: t.metadata?.name ?? `Token #${t.tokenId}`,
    image: resolveImage(t.metadata?.image),
  }));

  return (
    <SettingsGate>
      <SettingsPage
        title={t("Avatar & theme")}
        subtitle={t("Pick an NFT for the avatar and theme.")}
        icon={<ImageIcon className="h-4 w-4 text-white" />}
        aside={
          <ProfileLivePreview form={form} approvedUsername={username} walletAddress={address} fallbackImage={assets[0]?.image} />
        }
      >
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <SettingsSection title={t("Avatar & app theme")} description={t("Images for your profile")}>
              <AssetPicker
                assets={assets}
                isLoading={assetsLoading}
                selected={assets.find((a) => a.image === form.avatarImage) ?? null}
                onSelect={(asset) => setField("avatarImage", asset.image ?? "")}
                onMintClick={() => setFastMintOpen(true)}
              />
            </SettingsSection>

            <div className="flex items-center gap-3 border-t border-border pt-4">
              <Button onClick={save} disabled={saving || !address} className="w-full sm:w-auto">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("Saving…")}
                  </>
                ) : (
                  t("Save changes")
                )}
              </Button>
              {saveStatus === "saved" ? (
                <span className="flex items-center gap-1.5 text-sm text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" /> {t("Saved")}
                </span>
              ) : null}
              {saveStatus === "error" && saveError ? <span className="text-sm text-destructive">{saveError}</span> : null}
            </div>
          </>
        )}

        <FastMint
          presentation="dialog"
          open={fastMintOpen}
          onClose={() => setFastMintOpen(false)}
          mediaKindLock="image"
          onMinted={(asset) => {
            setField("avatarImage", asset.image ?? "");
            setFastMintOpen(false);
          }}
        />
      </SettingsPage>
    </SettingsGate>
  );
}
