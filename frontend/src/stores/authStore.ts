import { create } from "zustand";
import { apiLogin, apiRegister, apiGetMe, apiGoogleLogin } from "@/lib/api";

interface AuthState {
  token: string | null;
  user: { id: string; email: string; full_name: string } | null;
  loading: boolean;
  initializing: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  loading: false,
  initializing: true,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await apiLogin(email, password);
      localStorage.setItem("omnimind_token", data.access_token);
      set({ token: data.access_token, loading: false });
      // fetch user info
      const user = await apiGetMe(data.access_token);
      set({ user });
    } catch (e: any) {
      set({ loading: false, error: e.message });
    }
  },

  register: async (email, password, fullName) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRegister(email, password, fullName);
      localStorage.setItem("omnimind_token", data.access_token);
      set({ token: data.access_token, loading: false });
      const user = await apiGetMe(data.access_token);
      set({ user });
    } catch (e: any) {
      set({ loading: false, error: e.message });
    }
  },

  logout: () => {
    localStorage.removeItem("omnimind_token");
    set({ token: null, user: null });
  },

  googleLogin: async (credential) => {
    set({ loading: true, error: null });
    try {
      const data = await apiGoogleLogin(credential);
      localStorage.setItem("omnimind_token", data.access_token);
      set({ token: data.access_token, loading: false });
      const user = await apiGetMe(data.access_token);
      set({ user });
    } catch (e: any) {
      set({ loading: false, error: e.message });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem("omnimind_token");
    if (token) {
      try {
        const user = await apiGetMe(token);
        set({ token, user, initializing: false });
      } catch {
        localStorage.removeItem("omnimind_token");
        set({ token: null, user: null, initializing: false });
      }
    } else {
      set({ initializing: false });
    }
  },
}));
