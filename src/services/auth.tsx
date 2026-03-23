import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { API_BASE } from '@/services/config';
import { logApiError } from './apiErrorLog';

let _poeBackendSession: string | null = null;
export function setPoeBackendSession(id: string | null) {
  _poeBackendSession = id;
}
export function getPoeBackendSession() {
  return _poeBackendSession;
}

async function proxyFetch(path: string, init?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const extraHeaders: Record<string, string> = {};
  if (_poeBackendSession) {
    extraHeaders['x-poe-backend-session'] = _poeBackendSession;
  }
  return fetch(`${API_BASE}/api/v1/auth${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
      ...(init?.headers || {}),
    },
  });
}

export interface AuthUser {
  accountName: string;
}

interface SessionPayload {
  status: 'connected' | 'disconnected' | 'session_expired';
  accountName?: string | null;
  expiresAt?: string | null;
}

export type UserRole = 'public' | 'member' | 'admin';

interface AuthContextValue {
  supabaseUser: User | null;
  isAuthenticated: boolean;
  isApproved: boolean;
  userRole: UserRole;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  user: AuthUser | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void | SessionPayload>;
  sessionState: 'connected' | 'disconnected' | 'session_expired';
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  supabaseUser: null,
  isAuthenticated: false,
  isApproved: false,
  userRole: 'public',
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
  user: null,
  login: async () => {},
  logout: async () => {},
  refreshSession: async () => {},
  sessionState: 'disconnected',
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

async function fetchSession(): Promise<SessionPayload> {
  try {
    const response = await proxyFetch('/session');
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
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('public');

  const checkApprovalAndRole = useCallback(async (userId: string) => {
    const { data: approval } = await supabase
      .from('approved_users')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    setIsApproved(!!approval);

    if (approval) {
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      setUserRole((roleRow?.role as UserRole) ?? 'member');
    } else {
      setUserRole('public');
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        checkApprovalAndRole(session.user.id);
      } else {
        setIsApproved(false);
        setUserRole('public');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        checkApprovalAndRole(session.user.id).then(() => setSupabaseReady(true));
      } else {
        setSupabaseReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkApprovalAndRole]);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? error.message : null;
  }, []);

  const signOutFn = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionState, setSessionState] = useState<'connected' | 'disconnected' | 'session_expired'>('disconnected');
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async (): Promise<SessionPayload> => {
    const payload = await fetchSession();
    if (payload.status === 'connected' && payload.accountName) {
      setUser({ accountName: payload.accountName });
      setSessionState('connected');
      return payload;
    }
    setUser(null);
    setSessionState(payload.status);
    return payload;
  }, []);

  useEffect(() => {
    if (!supabaseReady || !isApproved) {
      setIsLoading(false);
      return;
    }
    void refreshSession().finally(() => setIsLoading(false));
  }, [refreshSession, supabaseReady, isApproved]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      const data = event.data;
      if (!data || typeof data !== 'object' || data.type !== 'poe_auth_callback_complete') {
        return;
      }
      void refreshSession();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [refreshSession]);

  const login = useCallback(async () => {
    const loginUrl = `${API_BASE}/api/v1/auth/login`;
    const popup = window.open(
      loginUrl,
      'poe-auth',
      'popup=yes,width=640,height=800,resizable=yes,scrollbars=yes',
    );
    if (!popup) {
      window.location.assign(loginUrl);
      return;
    }
    popup.focus();
  }, []);

  const logout = useCallback(async () => {
    try {
      await proxyFetch('/logout', {
        method: 'POST',
      });
    } catch (err) {
      logApiError({ path: '/api/v1/auth/logout', errorCode: 'network_error', message: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setPoeBackendSession(null);
      setUser(null);
      setSessionState('disconnected');
    }
  }, []);

  const isAuthenticated = !!supabaseUser;
  const combinedLoading = !supabaseReady || isLoading;

  return (
    <AuthContext.Provider
      value={{
        supabaseUser,
        isAuthenticated,
        isApproved,
        userRole,
        signIn,
        signUp,
        signOut: signOutFn,
        user,
        login,
        logout,
        refreshSession,
        sessionState,
        isLoading: combinedLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
