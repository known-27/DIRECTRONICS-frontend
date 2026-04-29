'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { authApi } from '@/lib/api';
import type { AuthUser } from '@/types';

interface AuthContextValue {
  /** Full profile including profilePictureUrl — the single source of truth */
  user:                  AuthUser | null;
  isLoading:             boolean;
  login:                 (email: string, password: string) => Promise<AuthUser>;
  logout:                () => Promise<void>;
  setUser:               (user: AuthUser | null) => void;
  /** Optimistically update any subset of the current user in-memory */
  updateCurrentUser:     (partial: Partial<AuthUser>) => void;
  /** Re-fetches /auth/me from backend and refreshes in-memory state */
  refetchCurrentUser:    () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Fetches the full user profile from the backend */
  const fetchMe = useCallback(async (): Promise<void> => {
    try {
      const res = await authApi.me();
      setUser(res.data.data.user);
    } catch {
      // If /auth/me fails, the cookie is missing or invalid — clear the user
      setUser(null);
    }
  }, []);

  // On mount: refresh the cookie, then populate user from /auth/me
  useEffect(() => {
    const restoreSession = async (): Promise<void> => {
      try {
        await authApi.refresh();
        await fetchMe();
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      await authApi.login(email, password);
      // After login cookie is set, fetch full profile (includes profilePictureUrl)
      await fetchMe();
      // fetchMe sets user; grab it optimistically from the response
      const meRes = await authApi.me();
      const authUser = meRes.data.data.user;
      setUser(authUser);
      return authUser;
    },
    [fetchMe],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  }, []);

  const updateCurrentUser = useCallback((partial: Partial<AuthUser>): void => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const refetchCurrentUser = useCallback(async (): Promise<void> => {
    await fetchMe();
  }, [fetchMe]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        setUser,
        updateCurrentUser,
        refetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
