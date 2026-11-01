import type { ApiCollectionProfile, UpdateCollectionProfileInput } from "@medialane/sdk";

export interface CollectionSettingsForm {
  displayName: string;
  description: string;
  image: string;
  bannerImage: string;
  websiteUrl: string;
  twitterUrl: string;
  discordUrl: string;
  telegramUrl: string;
  gatedEnabled: boolean;
  gatedContentTitle: string;
  gatedContentUrl: string;
  gatedContentType: string;
}

export const EMPTY_SETTINGS_FORM: CollectionSettingsForm = {
  displayName: "",
  description: "",
  image: "",
  bannerImage: "",
  websiteUrl: "",
  twitterUrl: "",
  discordUrl: "",
  telegramUrl: "",
  gatedEnabled: false,
  gatedContentTitle: "",
  gatedContentUrl: "",
  gatedContentType: "",
};

export function applyProfile(form: CollectionSettingsForm, profile: ApiCollectionProfile): CollectionSettingsForm {
  return {
    ...form,
    displayName: profile.displayName ?? "",
    description: profile.description ?? "",
    image: profile.image ?? "",
    bannerImage: profile.bannerImage ?? "",
    websiteUrl: profile.websiteUrl ?? "",
    twitterUrl: profile.twitterUrl ?? "",
    discordUrl: profile.discordUrl ?? "",
    telegramUrl: profile.telegramUrl ?? "",
    gatedEnabled: profile.hasGatedContent,
    gatedContentTitle: profile.gatedContentTitle ?? "",
  };
}

export function toProfileInput(form: CollectionSettingsForm): UpdateCollectionProfileInput {
  const gated = form.gatedEnabled;
  return {
    displayName: form.displayName || null,
    description: form.description || null,
    image: form.image || null,
    bannerImage: form.bannerImage || null,
    websiteUrl: form.websiteUrl || null,
    twitterUrl: form.twitterUrl || null,
    discordUrl: form.discordUrl || null,
    telegramUrl: form.telegramUrl || null,
    gatedContentTitle: gated ? form.gatedContentTitle || null : null,
    gatedContentUrl: gated ? form.gatedContentUrl || null : null,
    gatedContentType: gated
      ? ((form.gatedContentType || null) as UpdateCollectionProfileInput["gatedContentType"])
      : null,
  };
}
