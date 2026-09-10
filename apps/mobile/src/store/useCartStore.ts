import { create } from 'zustand';

export interface CartItem {
  id: string; // productId
  title: string;
  price: number;
  quantity: number;
  thumbnailUrl: string | null;
  artisanName: string;
  category: string;
  maxOrderLimit?: number;
}

interface CartStore {
  items: CartItem[];
  addToCart: (
    item: Omit<CartItem, 'quantity'>,
    quantity?: number,
    maxOrderLimit?: number,
  ) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    maxOrderLimit?: number,
  ) => void;
  getItemQuantity: (productId: string) => number;
  clearCart: () => void;
  getTotalCount: () => number;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addToCart: (item, quantity = 1, maxOrderLimit) => {
    const current = get().items;
    const existingIndex = current.findIndex((i) => i.id === item.id);
    const limit = maxOrderLimit || item.maxOrderLimit || 999;

    if (existingIndex > -1) {
      const updated = [...current];
      const existing = updated[existingIndex];
      if (existing) {
        existing.quantity = Math.min(limit, existing.quantity + quantity);
      }
      set({ items: updated });
    } else {
      const initialQty = Math.min(limit, quantity);
      set({
        items: [
          ...current,
          { ...item, quantity: initialQty, maxOrderLimit: limit },
        ],
      });
    }
  },

  removeFromCart: (productId: string) => {
    set({ items: get().items.filter((i) => i.id !== productId) });
  },

  updateQuantity: (productId: string, quantity: number, maxOrderLimit) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }

    const updated = get().items.map((i) => {
      if (i.id === productId) {
        const limit = maxOrderLimit || i.maxOrderLimit || 999;
        return { ...i, quantity: Math.min(limit, quantity) };
      }
      return i;
    });
    set({ items: updated });
  },

  getItemQuantity: (productId: string) => {
    const item = get().items.find((i) => i.id === productId);
    return item ? item.quantity : 0;
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotalCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getTotalAmount: () => {
    return get().items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  },
}));

