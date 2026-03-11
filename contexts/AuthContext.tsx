import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
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

  // Guard so we only handle one SSO session at a time
  const handlingSsoRef = useRef(false);

  /**
   * Given a Supabase access_token, call /api/sso/check/ and update state.
   * Returns true if auth state was set, false otherwise.
   */
  const handleSsoSession = useCallback(async (accessToken: string): Promise<boolean> => {
    if (handlingSsoRef.current) return false;
    handlingSsoRef.current = true;
    try {
      const checkResult = await ssoCheck(accessToken);
      if (checkResult.exists && checkResult.user && checkResult.token) {
        setToken(checkResult.token);
        setUser(checkResult.user);
        await setStoredToken(checkResult.token);
        await setStoredUser(JSON.stringify(checkResult.user));
      } else {
        // New SSO user — needs to complete signup (role selection)
        setPendingSsoToken(accessToken);
      }
      return true;
    } catch (e: any) {
      logger.error('SSO check failed:', e);
      return false;
    } finally {
      handlingSsoRef.current = false;
    }
  }, []);

  // Load auth state on mount + listen for Supabase OAuth callbacks
  useEffect(() => {
    let isMounted = true;

    const loadAuthState = async () => {
      try {
        // 1) Check if Supabase already has a session (e.g. stored from a previous visit)
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const handled = await handleSsoSession(session.access_token);
            if (handled && isMounted) {
              setIsLoading(false);
              return;
            }
          }
        }

        // 2) Fallback: stored DRF token (localStorage on web, SecureStore on native)
        const storedToken = await getStoredToken();
        const storedUserJson = await getStoredUser();

        if (storedToken && storedUserJson) {
          setToken(storedToken);
          setUser(JSON.parse(storedUserJson)); // immediate render with stored data
          try {
            const freshUser = await getUserProfile(storedToken);
            if (isMounted) {
              setUser(freshUser);
              await setStoredUser(JSON.stringify(freshUser));
            }
          } catch (error: any) {
            if (error?.status === 401 && isMounted) {
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
      if (isMounted) setIsLoading(false);
    };

    loadAuthState();

    // 3) Listen for Supabase auth events — this catches the OAuth redirect
    //    callback when getSession() above returns null (session not yet parsed).
    let subscription: { unsubscribe: () => void } | null = null;

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.access_token) {
          // Avoid double-handling if loadAuthState already processed this session
          if (handlingSsoRef.current) return;
          const handled = await handleSsoSession(session.access_token);
          if (handled && isMounted) {
            setIsLoading(false);
          }
        }
      });
      subscription = data.subscription;
    }

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [handleSsoSession]);

  const handleLogout = useCallback(async () => {
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
  }, [token]);

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
