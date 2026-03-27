import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginRequest } from '../types';
import apiClient from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
  clearAuth: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.login(credentials);
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
          // Use clearAuth to ensure complete cleanup
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
        // Clear all auth state and localStorage
        localStorage.removeItem('accessToken');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        });
      },

      initialize: () => {
        const state = get();
        if (!state.isInitialized) {
          // Check if we have token in localStorage
          const accessToken = localStorage.getItem('accessToken');
          
          if (accessToken) {
            // We have tokens, mark as authenticated but don't set user yet
            // The user will be fetched by the API interceptor
            set({ 
              isAuthenticated: true, 
              isInitialized: true,
              user: null // Will be set by API calls
            });
          } else {
            // No valid tokens, clear everything
            set({ 
              isAuthenticated: false, 
              isInitialized: true,
              user: null,
              isLoading: false
            });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => {
        // Only persist the isInitialized flag to prevent loops
        return {
          isInitialized: state.isInitialized,
        };
      },
    }
  )
);
