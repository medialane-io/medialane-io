import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeAddress } from "@medialane/sdk";

interface FollowsStore {
  followed: string[];
  toggle: (address: string) => void;
  isFollowing: (address: string) => boolean;
}

export const useFollows = create<FollowsStore>()(
  persist(
    (set, get) => ({
      followed: [],
      toggle: (address) => {
        const norm = normalizeAddress("STARKNET", address);
        const current = get().followed;
        set({
          followed: current.includes(norm)
            ? current.filter((a) => a !== norm)
            : [...current, norm],
        });
      },
      isFollowing: (address) => get().followed.includes(normalizeAddress("STARKNET", address)),
    }),
    { name: "medialane-io-follows" }
  )
);
