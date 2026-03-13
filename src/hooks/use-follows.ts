import { create } from "zustand";
import { persist } from "zustand/middleware";

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
        const norm = address.toLowerCase();
        const current = get().followed;
        set({
          followed: current.includes(norm)
            ? current.filter((a) => a !== norm)
            : [...current, norm],
        });
      },
      isFollowing: (address) => get().followed.includes(address.toLowerCase()),
    }),
    { name: "medialane-io-follows" }
  )
);
