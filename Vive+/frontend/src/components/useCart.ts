"use client";

import { createContext, use } from "react";
import type { CartItem } from "@/frontend/src/services/carritoService";

export type { CartItem };

export type CartCtx = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cantidad">) => void;
  removeItem: (item: CartItem) => void;
  updateQty: (item: CartItem, delta: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
};

export const Ctx = createContext<CartCtx | null>(null);

export function useCart() {
  const ctx = use(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
