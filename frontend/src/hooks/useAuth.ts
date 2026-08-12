import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginRequest, RegisterRequest } from '../types';
import apiClient from '../services/api';
import toast from 'react-hot-toast';

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  register: (data: RegisterRequest) => Promise<void>;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
  clearAuth: () => void;
  updateLastActivity: () => void;
  checkInactivityTimeout: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      updateLastActivity: () => {
        localStorage.setItem('lastActivityTime', Date.now().toString());
      },

      checkInactivityTimeout: () => {
        const lastActStr = localStorage.getItem('lastActivityTime');
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) return true; // No token, not authenticated

        if (lastActStr) {
          const elapsed = Date.now() - Number(lastActStr);
          if (elapsed > INACTIVITY_LIMIT_MS) {
            // Expired after 10 minutes of inactivity
            toast.error('Logged out due to 10 minutes of inactivity.');
            get().clearAuth();
            return true; // Expired
          }
        }
        return false; // Not expired
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.register(data);
          localStorage.setItem('lastActivityTime', Date.now().toString());
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.login(credentials);
          localStorage.setItem('lastActivityTime', Date.now().toString());
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await apiClient.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          get().clearAuth();
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('lastActivityTime');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        });
      },

      initialize: () => {
        const accessToken = localStorage.getItem('accessToken');
        const lastActStr = localStorage.getItem('lastActivityTime');
        const now = Date.now();

        if (accessToken) {
          if (lastActStr) {
            const elapsed = now - Number(lastActStr);
            if (elapsed > INACTIVITY_LIMIT_MS) {
              // Inactive for more than 10 minutes -> logout
              toast.error('Session expired due to 10 minutes of inactivity.');
              get().clearAuth();
              return;
            }
          }

          // Session is valid (refreshed page within 10 minutes)!
          // Do NOT logout when page is refreshed. Update last activity.
          localStorage.setItem('lastActivityTime', now.toString());
          const state = get();
          set({
            user: state.user,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
          });
        } else {
          get().clearAuth();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isInitialized: state.isInitialized,
      }),
    }
  )
);
