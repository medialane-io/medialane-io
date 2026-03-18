 "use client";

 import { useCallback } from "react";
 import { useAuth } from "@clerk/nextjs";
 import { useGetTokenBalance } from "@chipi-stack/chipi-react";
 import { Chain, ChainToken } from "@chipi-stack/types";
 import { useSessionKey } from "@/hooks/use-session-key";

 export function useWalletWithBalance() {
   const { getToken } = useAuth();
   const {
     wallet,
     walletAddress,
     hasWallet,
     isLoadingWallet,
     refetchWallet,
   } = useSessionKey();

   const getBearerToken = useCallback(
     () =>
       getToken({
         template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay",
       }),
     [getToken]
   );

   const {
     data: balanceData,
     isLoading: isLoadingBalance,
     refetch,
   } = useGetTokenBalance({
     params: {
      chainToken: ChainToken.USDC,
      chain: Chain.STARKNET,
       walletPublicKey: walletAddress ?? undefined,
     },
     getBearerToken,
     queryOptions: { enabled: Boolean(walletAddress) },
   });

   return {
     wallet,
     walletAddress,
     hasWallet,
     isLoadingWallet,
     refetchWallet,
     balance: balanceData?.balance ?? null,
     isLoadingBalance,
     refetchBalance: () => refetch(),
   };
 }

