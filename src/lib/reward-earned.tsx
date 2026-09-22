"use client";

import { createRewardEarned } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";

export const RewardEarned = createRewardEarned(() => getMedialaneClient().api.getRewardsConfig());
