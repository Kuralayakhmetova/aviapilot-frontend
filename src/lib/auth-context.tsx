"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { setAccessToken, getAccessToken, authApi } from "./api";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
  isAuthenticated: false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // ── Silent refresh (каждые 13 мин) ─────────────────────────────────────────
  const startSilentRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);

    refreshTimerRef.current = setInterval(async () => {
      try {
        // ✅ Используем authApi.refresh() — правильный URL без двойного /api
        const newToken = await authApi.refresh();
        setAccessToken(newToken);
      } catch {
        setAccessToken(null);
        setUser(null);
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
      }
    }, 13 * 60 * 1000);
  }, []);

  // ── Восстановление сессии при монтировании ──────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const newToken = await authApi.refresh();
        setAccessToken(newToken);

        const me = await authApi.me();
        setUser({
          id: me.id,
          email: me.email,
          firstName: me.firstName,
          lastName: me.lastName,
          role: me.role,
        });

        startSilentRefresh();
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  // ✅ Убрали startSilentRefresh из зависимостей — он стабилен благодаря useCallback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Запускаем silent refresh после login (когда user выставляется снаружи) ──
  useEffect(() => {
    if (user && getAccessToken()) {
      startSilentRefresh();
    }
  // ✅ Только когда user появляется впервые
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // игнорируем
    }

    setAccessToken(null);
    setUser(null);

    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export default AuthContext;
