import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('accessToken', res.data.accessToken);
        set({
          user: res.data.user,
          token: res.data.accessToken,
          isAuthenticated: true,
        });
        return res.data;
      },

      register: async (name, email, password) => {
        const res = await api.post('/auth/register', { name, email, password });
        localStorage.setItem('accessToken', res.data.accessToken);
        set({
          user: res.data.user,
          token: res.data.accessToken,
          isAuthenticated: true,
        });
        return res.data;
      },

      logout: async () => {
        await api.post('/auth/logout');
        localStorage.removeItem('accessToken');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage', // persists to localStorage
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;