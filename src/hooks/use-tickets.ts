"use client";

import * as ui from "@medialane/ui";
import { getMedialaneClient } from "@/lib/medialane-client";

export type { TierOnchain as TicketOnchain, TierListItem as TicketListItem } from "@medialane/ui";

export const predictNextTicketId = (contract: string) => ui.predictNextTicketId(getMedialaneClient().api, contract);
export const useMyTicketCollections = (owner: string | null) => ui.useMyTicketCollections(owner);
export const useTicketOnchain = (contract: string | null, tokenId: string | null) =>
  ui.useTicketOnchain(contract, tokenId);
