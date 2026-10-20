"use client";

import { AssetPicker, type OwnedAsset } from "@medialane/ui";
import { useState } from "react";
import { CheckCircle2, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@medialane/ui/button";
import { Skeleton } from "@medialane/ui/skeleton";
import { FastMint } from "@/components/launchpad/fast-mint";
import { ProfileLivePreview } from "@/components/settings/profile-live-preview";
import { SettingsGate, SettingsPage, SettingsSection } from "@/components/settings/settings-page";
import { useProfileForm } from "@/hooks/use-profile-form";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { useMyUsernameClaim } from "@/hooks/use-username-claims";
import { resolveImage } from "@/lib/utils";

export default function AppearanceSettingsPage() {
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
        title="Avatar & theme"
        subtitle="Pick one of your NFTs. It becomes your avatar and a subtle background theme across Medialane."
        icon={<ImageIcon className="h-4 w-4 text-white" />}
        aside={
          <ProfileLivePreview form={form} approvedUsername={username} walletAddress={address} fallbackImage={assets[0]?.image} />
        }
      >
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <SettingsSection title="Avatar & app theme" description="Images for your profile">
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
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
              {saveStatus === "saved" ? (
                <span className="flex items-center gap-1.5 text-sm text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" /> Saved
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
