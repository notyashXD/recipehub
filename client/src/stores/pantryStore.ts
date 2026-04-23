'use client';
import { create } from 'zustand';
import api from '@/lib/api';

interface PantryItem {
  _id: string; ingredient: string; quantity: number; unit: string;
  category: string; expiryDate?: string; addedAt: string;
}

interface PantryStore {
  items: PantryItem[];
  loading: boolean;
  fetchPantry: () => Promise<void>;
  addItem: (item: Partial<PantryItem>) => Promise<void>;
  addBulkItems: (items: Partial<PantryItem>[]) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, data: Partial<PantryItem>) => Promise<void>;
  clearPantry: () => Promise<void>;
}

export const usePantryStore = create<PantryStore>((set) => ({
  items: [],
  loading: false,
  fetchPantry: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/pantry');
      set({ items: data.items || [] });
    } finally { set({ loading: false }); }
  },
  addItem: async (item) => {
    const { data } = await api.post('/pantry/items', item);
    set({ items: data.items || [] });
  },
  addBulkItems: async (items) => {
    const { data } = await api.post('/pantry/items/bulk', { items });
    set({ items: data.items || [] });
  },
  removeItem: async (id) => {
    const { data } = await api.delete(`/pantry/items/${id}`);
    set({ items: data.items || [] });
  },
  updateItem: async (id, item) => {
    const { data } = await api.put(`/pantry/items/${id}`, item);
    set({ items: data.items || [] });
  },
  clearPantry: async () => {
    const { data } = await api.delete('/pantry/clear');
    set({ items: data.items || [] });
  },
}));
