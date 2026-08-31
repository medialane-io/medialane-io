"use client";

import { useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import type { ApiActivity } from "@medialane/sdk";
import { useToken, useTokenHistory } from "@/hooks/use-tokens";
import { useCollection, useNearbyCollectionTokens } from "@/hooks/use-collections";
import { useTokenRemixes } from "@/hooks/use-remix-offers";
import { useTokenListings } from "@/hooks/use-orders";
import { useComments } from "@/hooks/use-comments";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useEmailVerificationRequired } from "@/hooks/use-email-verification-required";
import { useAcceptOffer } from "@/hooks/use-accept-offer";
import { useAssetMarketState } from "@/hooks/use-asset-market-state";
import { ipfsToHttp, resolveTokenImage } from "@/lib/utils";
import { IP_TEMPLATES, EMBED_PLATFORM_META, SOCIAL_PLATFORM_META } from "@/lib/ip-templates";
import { LICENSE_TRAIT_TYPES } from "@/types/ip";
import type { IPType } from "@/types/ip";
import { useOrderActions } from "./use-order-actions";
import { useAssetMarketplaceDialogState } from "./asset-marketplace-dialogs";

export interface UseAssetPageOptions {
  tokenStandard?: string;
  namePrefix: string;
}

export function useAssetPage({ tokenStandard, namePrefix }: UseAssetPageOptions) {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const shouldReduce = useReducedMotion();

  const { hasWallet, address: walletAddress } = useWalletNativeSession();
  const listingRequiresEmailVerification = useEmailVerificationRequired();

  const { collection } = useCollection(contract);
  const { token, isLoading, isIndexing } = useToken(contract, tokenId);
  const { listings, mutate: mutateListings } = useTokenListings(contract, tokenId);
  const { history } = useTokenHistory(contract, tokenId);
  const { tokens: collectionTokens } = useNearbyCollectionTokens(contract, tokenId);
  const { total: commentTotal } = useComments(contract, tokenId);
  const { total: remixCount } = useTokenRemixes(contract, tokenId);

  const market = useAssetMarketState({ token, collection, listings, history, walletAddress });

  const resolvedStandard = tokenStandard ?? token?.standard ?? collection?.standard ?? "UNKNOWN";

  const orderActions = useOrderActions({ mutateListings, tokenStandard });
  const acceptOffer = useAcceptOffer({
    mutateListings,
    tokenStandard,
    activeListings: market.activeListings,
  });

  const dialogs = useAssetMarketplaceDialogState();
  const [reportOpen, setReportOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imageUrl = token?.metadata?.image ? ipfsToHttp(token.metadata.image) : null;
  const image = resolveTokenImage(token?.metadata?.image);
  const name = token?.metadata?.name || `${namePrefix} #${token?.tokenId ?? ""}`;
  const description = token?.metadata?.description;

  const attributes = Array.isArray(token?.metadata?.attributes)
    ? (token.metadata.attributes as { trait_type?: string; value?: string }[])
    : [];

  const activeTemplate = IP_TEMPLATES[
    (attributes.find((a) => a.trait_type?.toLowerCase() === "ip type")?.value ?? "") as IPType
  ];
  const activeTemplateEmbedSocialKeys = activeTemplate
    ? [
        ...(activeTemplate.embeds ?? []).map((p) => EMBED_PLATFORM_META[p].traitKey),
        ...(activeTemplate.socials ?? []).map((p) => SOCIAL_PLATFORM_META[p].traitKey),
        ...(activeTemplate.docUpload ? [activeTemplate.docUpload.traitType] : []),
      ]
    : [];
  const activeTemplateKeys = new Set<string>(["IP Type", ...activeTemplateEmbedSocialKeys]);
  const hasTemplateData = activeTemplateEmbedSocialKeys.some((k) =>
    attributes.some((a) => a.trait_type === k && a.value)
  );
  const isDisplayAttr = (a: { trait_type?: string }): boolean =>
    !LICENSE_TRAIT_TYPES.has(a.trait_type ?? "") && !activeTemplateKeys.has(a.trait_type ?? "");

  return {
    contract, tokenId, pathname, router, shouldReduce,
    hasWallet, walletAddress, listingRequiresEmailVerification,
    collection, token, isLoading, isIndexing,
    listings, mutateListings, history: history as ApiActivity[], collectionTokens,
    commentTotal, remixCount,
    ...market,
    resolvedStandard, ...orderActions, acceptOffer,
    ...dialogs,
    reportOpen, setReportOpen, commentOpen, setCommentOpen, imgError, setImgError,
    imageUrl, image, name, description,
    attributes, hasTemplateData, isDisplayAttr,
  };
}
