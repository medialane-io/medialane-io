export type CheckState = "idle" | "checking" | "available" | "taken";

export type ProfileForm = {
  displayName: string;
  bio: string;
  avatarImage: string;
  websiteUrl: string;
  twitterUrl: string;
  discordUrl: string;
  telegramUrl: string;
};
