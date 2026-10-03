"use client";
import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useToast } from "@/components/ui/providers";
import type { CurrentUser } from "@/types";
interface AuthContextValue {
  accessToken: string | null;
  user: CurrentUser | null;
  currentUser: CurrentUser | null;
  loading: boolean;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  login: typeof authApi.login;
  register: typeof authApi.register;
  logout: () => Promise<void>;
  refreshAccessToken: typeof authApi.refreshAccessToken;
  loadCurrentUser: typeof authApi.loadCurrentUser;
}
const Context = createContext<AuthContextValue | null>(null);
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider is required.");
  return value;
}
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(
    authApi.subscribe,
    authApi.getSnapshot,
    authApi.getServerSnapshot,
  );
  const router = useRouter();
  const toast = useToast();
  useEffect(() => {
    const unsubscribe = authApi.onSessionEnd((event) => {
      toast(event.message);
      if (window.location.pathname !== "/login")
        router.replace(
          `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
        );
    });
    void authApi.initialize(); // shared promise survives Strict Mode effect remounts
    return unsubscribe;
  }, [router, toast]);
  async function logout() {
    try {
      await authApi.logout();
    } finally {
      router.replace("/");
      router.refresh();
    }
  }
  return (
    <Context.Provider
      value={{
        ...state,
        currentUser: state.user,
        isAuthLoading: state.loading,
        isAuthenticated: !!state.accessToken && !!state.user,
        login: authApi.login,
        register: authApi.register,
        logout,
        refreshAccessToken: authApi.refreshAccessToken,
        loadCurrentUser: authApi.loadCurrentUser,
      }}
    >
      {children}
    </Context.Provider>
  );
}
