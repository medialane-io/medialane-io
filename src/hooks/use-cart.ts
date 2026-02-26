"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem, connectedAddress?: string) => void;
  removeItem: (orderHash: string) => void;
  clearCart: () => void;
  setIsOpen: (open: boolean) => void;
  toggleCart: () => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      addItem: (item, connectedAddress) =>
        set((state) => {
          if (state.items.some((i) => i.orderHash === item.orderHash)) return state;
          if (
            connectedAddress &&
            item.offerer.toLowerCase() === connectedAddress.toLowerCase()
          ) {
            return state;
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (orderHash) =>
        set((state) => ({ items: state.items.filter((i) => i.orderHash !== orderHash) })),

      clearCart: () => set({ items: [] }),

      setIsOpen: (isOpen) => set({ isOpen }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: "medialane-io-cart",
      partialize: (s) => ({ items: s.items }),
    }
  )
);
