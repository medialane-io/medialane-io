"use client";

import { createRewardToast } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";

export const rewardToast = createRewardToast(() => getMedialaneClient().api.getRewardsConfig());
