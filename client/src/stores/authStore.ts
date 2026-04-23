'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { normalizeEmail } from '@/lib/validation';

interface User {
  id: string; username: string; email: string; avatar: string;
  streakDays: number; cookingLevel: string; dietaryPreferences: string[];
  badges: string[]; totalRecipesCooked: number;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email: normalizeEmail(email), password });
        localStorage.setItem('rb_token', data.token);
        set({ user: data.user, token: data.token });
      },
      register: async (username, email, password) => {
        const { data } = await api.post('/auth/register', {
          username: username.trim(),
          email: normalizeEmail(email),
          password,
        });
        localStorage.setItem('rb_token', data.token);
        set({ user: data.user, token: data.token });
      },
      logout: () => {
        localStorage.removeItem('rb_token');
        set({ user: null, token: null });
      },
      updateUser: (data) => set((s) => ({ user: s.user ? { ...s.user, ...data } : null })),
    }),
    { name: 'rb_auth', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);
