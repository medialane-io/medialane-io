"use client";

import useSWR from "swr";
import { Contract } from "starknet";
import { starknetProvider } from "@/lib/starknet";
import { DropFactoryABI, DROP_FACTORY_CONTRACT_MAINNET, POP_FACTORY_CONTRACT_MAINNET } from "@medialane/sdk";

// Minimal ABI — is_active_provider not yet in the SDK's POPFactoryABI
const POP_PROVIDER_CHECK_ABI = [
  {
    type: "function",
    name: "is_active_provider",
    inputs: [{ name: "provider", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view",
  },
];

export function useIsPOPProvider(wallet: string | null | undefined) {
  const { data, isLoading, error } = useSWR(
    wallet ? `pop-provider-${wallet}` : null,
    async () => {
      const factory = new Contract(POP_PROVIDER_CHECK_ABI as any, POP_FACTORY_CONTRACT_MAINNET, starknetProvider);
      const result = await factory.is_active_provider(wallet);
      return Boolean(result);
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  return { isProvider: data ?? false, isLoading, error };
}

export function useIsDropOrganizer(wallet: string | null | undefined) {
  const { data, isLoading, error } = useSWR(
    wallet ? `drop-organizer-${wallet}` : null,
    async () => {
      const factory = new Contract(DropFactoryABI as any, DROP_FACTORY_CONTRACT_MAINNET, starknetProvider);
      const result = await factory.is_active_organizer(wallet);
      return Boolean(result);
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  return { isOrganizer: data ?? false, isLoading, error };
}
