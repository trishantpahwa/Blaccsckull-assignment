import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setAuthToken, setUnauthorizedHandler } from '@/api/client';
import { api } from '@/api/endpoints';
import type { User } from '@/api/types';
import { tokenStorage } from '@/lib/tokenStorage';

interface AuthValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: { name: string; email: string; password: string; referralCode?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await tokenStorage.clear();
    // Viewer-specific data (registration state) must not leak between accounts.
    queryClient.invalidateQueries();
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(() => void clearSession());
    (async () => {
      try {
        const token = await tokenStorage.get();
        if (token) {
          setAuthToken(token);
          const { user } = await api.me();
          setUser(user);
        }
      } catch {
        await clearSession();
      } finally {
        setReady(true);
      }
    })();
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const startSession = useCallback(
    async ({ token, user }: { token: string; user: User }) => {
      setAuthToken(token);
      await tokenStorage.set(token);
      setUser(user);
      queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      login: async (email, password) => startSession(await api.login({ email, password })),
      signup: async (input) => startSession(await api.signup(input)),
      logout: clearSession,
    }),
    [user, ready, startSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
