import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { API_BASE } from './config';
import { logApiError } from './apiErrorLog';

export interface AuthUser {
  accountName: string;
}

interface SessionPayload {
  status: 'connected' | 'disconnected' | 'session_expired';
  accountName?: string | null;
  expiresAt?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  logout: () => void;
  refreshSession: () => Promise<void>;
  sessionState: 'connected' | 'disconnected' | 'session_expired';
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  logout: () => {},
  refreshSession: async () => {},
  sessionState: 'disconnected',
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

async function fetchSession(): Promise<SessionPayload> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/auth/session`, {
      credentials: 'include',
    });
    if (!response.ok) {
      logApiError({ path: '/api/v1/auth/session', statusCode: response.status, errorCode: 'auth_session', message: `Session check failed (${response.status})` });
      return { status: 'disconnected' };
    }
    return (await response.json()) as SessionPayload;
  } catch (err) {
    logApiError({ path: '/api/v1/auth/session', errorCode: 'network_error', message: err instanceof Error ? err.message : 'Network error' });
    return { status: 'disconnected' };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionState, setSessionState] = useState<'connected' | 'disconnected' | 'session_expired'>('disconnected');
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const payload = await fetchSession();
    if (payload.status === 'connected' && payload.accountName) {
      setUser({ accountName: payload.accountName });
      setSessionState('connected');
      return;
    }
    setUser(null);
    setSessionState(payload.status);
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false));
  }, [refreshSession]);

  const logout = useCallback(() => {
    // Clear the POESESSID cookie
    document.cookie = 'POESESSID=; path=/; max-age=0';
    fetch(`${API_BASE}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      setUser(null);
      setSessionState('disconnected');
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, logout, refreshSession, sessionState, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
