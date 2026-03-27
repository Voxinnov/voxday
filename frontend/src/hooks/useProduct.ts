import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Product = 'voxtree' | 'voxdbook';

interface ProductState {
  activeProduct: Product;
  setActiveProduct: (product: Product) => void;
}

export const useProduct = create<ProductState>()(
  persist(
    (set) => ({
      activeProduct: 'voxtree',
      setActiveProduct: (product: Product) => set({ activeProduct: product }),
    }),
    {
      name: 'product-storage',
    }
  )
);
