"use client";

import { toast } from "sonner";
import { XpToastContent } from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";
import type { ApiRewardsConfig } from "@medialane/sdk";

let configPromise: Promise<ApiRewardsConfig> | null = null;
function loadConfig() {
  configPromise ??= getMedialaneClient().api.getRewardsConfig();
  return configPromise;
}

/** Optimistic XP feedback after a scoring action. Scores recompute on a
 *  schedule, so this shows the action's configured value, never a balance.
 *  Fire-and-forget: any failure is silent (rewards UI must never break a flow). */
export function rewardToast(actionType: string): void {
  loadConfig()
    .then((config) => {
      const action = config.actions.find((a) => a.type === actionType);
      if (!action) return;
      toast(<XpToastContent xp={action.xp} label={action.label} />, { duration: 3500 });
    })
    .catch(() => {
      configPromise = null; // retry on the next action
    });
}
