import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logout, getUserProfile, login as apiLogin, signup as apiSignup, ssoCheck, ssoSignup } from '../services/api';
import type { LoginData, SignupData, SsoSignupData } from '../services/api';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import {
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  clearStoredAuth,
} from '../utils/tokenStorage';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  is_worker: boolean;
  is_company: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** True when a Supabase OAuth user has no Django account yet and needs to complete signup. */
  needsSsoSignup: boolean;
  logout: () => Promise<void>;
  /** Sign in with Google (web: redirects to Google and back). */
  signInWithGoogle: () => Promise<void>;
  /** Sign in with Apple (web: redirects to Apple and back). */
  signInWithApple: () => Promise<void>;
  /** Sign in with Microsoft Azure AD (web: redirects to Microsoft and back). */
  signInWithAzure: () => Promise<void>;
  /** Sign in with email + password (DRF Token auth). */
  loginWithEmail: (data: LoginData) => Promise<void>;
  /** Register with email + password (DRF Token auth). */
  signupWithEmail: (data: SignupData) => Promise<void>;
  /** Complete SSO signup (first-time OAuth users). Requires role selection. */
  completeSsoSignup: (data: SsoSignupData) => Promise<void>;
  updateUserFromServer: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  /** Temporary Supabase JWT stored while the user completes SSO signup. */
  const [pendingSsoToken, setPendingSsoToken] = useState<string | null>(null);

  // Load auth state: Supabase OAuth callback (hash) or persisted token
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        // 1) After OAuth redirect, Supabase puts session in URL hash; recover it first
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            try {
              // Check whether this Supabase user already has a Django account
              const checkResult = await ssoCheck(session.access_token);
              if (checkResult.exists && checkResult.user && checkResult.token) {
                // Existing user — authenticate with the DRF token
                setToken(checkResult.token);
                setUser(checkResult.user);
                await setStoredToken(checkResult.token);
                await setStoredUser(JSON.stringify(checkResult.user));
              } else {
                // New SSO user — needs to complete signup (role selection)
                setPendingSsoToken(session.access_token);
              }
              setIsLoading(false);
              return;
            } catch (e: any) {
              if (e?.status !== 401) {
                logger.error('SSO check failed:', e);
              }
              // On 401 the Supabase token might be expired; fall through
            }
          }
        }

        // 2) Fallback: stored token (localStorage on web, SecureStore on native)
        const storedToken = await getStoredToken();
        const storedUserJson = await getStoredUser();

        if (storedToken && storedUserJson) {
          setToken(storedToken);
          setUser(JSON.parse(storedUserJson)); // immediate render with stored data
          try {
            const freshUser = await getUserProfile(storedToken);
            setUser(freshUser); // sync with server
            await setStoredUser(JSON.stringify(freshUser)); // persist updated state
          } catch (error: any) {
            if (error?.status === 401) {
              await clearStoredAuth();
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch (error) {
        logger.error('Error loading auth state:', error);
        await clearStoredAuth();
      }
      setIsLoading(false);
    };

    loadAuthState();
  }, []);

  const handleLogout = async () => {
    if (token) {
      try {
        await logout(token);
      } catch (error) {
        logger.error('Logout error:', error);
      }
    }
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    setUser(null);
    setToken(null);
    setPendingSsoToken(null);
    await clearStoredAuth();
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
    }
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (error) throw error;
  };

  const signInWithApple = async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
    }
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (error) throw error;
  };

  const signInWithAzure = async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
    }
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (error) throw error;
  };

  const loginWithEmail = async (data: LoginData) => {
    const result = await apiLogin(data);
    setToken(result.token);
    setUser(result.user);
    await setStoredToken(result.token);
    await setStoredUser(JSON.stringify(result.user));
  };

  const signupWithEmail = async (data: SignupData) => {
    const result = await apiSignup(data);
    setToken(result.token);
    setUser(result.user);
    await setStoredToken(result.token);
    await setStoredUser(JSON.stringify(result.user));
  };

  const completeSsoSignup = async (data: SsoSignupData) => {
    if (!pendingSsoToken) {
      throw new Error('No pending SSO session. Please sign in with a provider first.');
    }
    const result = await ssoSignup(pendingSsoToken, data);
    setPendingSsoToken(null);
    setToken(result.token);
    setUser(result.user);
    await setStoredToken(result.token);
    await setStoredUser(JSON.stringify(result.user));
  };

  const updateUserFromServer = async (nextUser: User) => {
    setUser(nextUser);
    try {
      await setStoredUser(JSON.stringify(nextUser));
    } catch (error) {
      logger.error('Error persisting updated user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        needsSsoSignup: !!pendingSsoToken && !user,
        logout: handleLogout,
        signInWithGoogle,
        signInWithApple,
        signInWithAzure,
        loginWithEmail,
        signupWithEmail,
        completeSsoSignup,
        updateUserFromServer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
