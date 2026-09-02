import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  key: string;
  productId: string;
  productName: string;
  designId: string | null;
  size: string;
  color: string;
  quantity: number;
  /** Display-only. The server recomputes every price at checkout. */
  unitPrice: number;
  previewUrl: string | null;
};

type CartState = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line) =>
        set((state) => {
          const key = [line.productId, line.designId ?? "blank", line.size, line.color].join("|");
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.key === key ? { ...l, quantity: l.quantity + line.quantity } : l,
              ),
            };
          }
          return { lines: [...state.lines, { ...line, key }] };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.key === key ? { ...l, quantity: Math.max(1, quantity) } : l,
          ),
        })),
      remove: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "pressworks-cart" },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) =>
  lines.reduce((n, l) => n + l.quantity * l.unitPrice, 0);
