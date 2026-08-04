"use client";

// Thin app-local binding — canonical caching/toast logic lives in
// @medialane/ui (components/rewards/reward-toast.tsx), parameterized over
// this app's own MedialaneClient singleton.
import { createRewardToast } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";

export const rewardToast = createRewardToast(() => getMedialaneClient().api.getRewardsConfig());
