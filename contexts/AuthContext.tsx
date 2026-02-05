import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { login, logout, getUserProfile, AuthResponse } from '../services/api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: AuthResponse) => void;
  logout: () => Promise<void>;
  /** Sign in with Google (web: redirects to Google and back). */
  signInWithGoogle: () => Promise<void>;
  /** Sign in with Apple (web: redirects to Apple and back). */
  signInWithApple: () => Promise<void>;
  /** True if Supabase URL/anon key are set (SSO buttons can be shown). */
  isSupabaseSSOEnabled: boolean;
  updateUserFromServer: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state: Supabase OAuth callback (hash) or localStorage
  useEffect(() => {
    const loadAuthState = async () => {
      if (Platform.OS === 'web') {
        try {
          // 1) After OAuth redirect, Supabase puts session in URL hash; recover it first
          if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              try {
                const profileUser = await getUserProfile(session.access_token);
                setToken(session.access_token);
                setUser(profileUser);
                localStorage.setItem('auth_token', session.access_token);
                localStorage.setItem('user_data', JSON.stringify(profileUser));
                setIsLoading(false);
                return;
              } catch (e: any) {
                if (e?.status !== 401) {
                  console.error('Supabase session but profile fetch failed:', e);
                }
              }
            }
          }

          // 2) Fallback: stored Django token
          const storedToken = localStorage.getItem('auth_token');
          const storedUser = localStorage.getItem('user_data');

          if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            try {
              await getUserProfile(storedToken);
            } catch (error: any) {
              if (error?.status === 401) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_data');
                setToken(null);
                setUser(null);
              }
            }
          }
        } catch (error) {
          console.error('Error loading auth state:', error);
          if (Platform.OS === 'web') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
          }
        }
      }
      setIsLoading(false);
    };

    loadAuthState();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const response = await login({ email, password });
    setUser(response.user);
    setToken(response.token);
    
    if (Platform.OS === 'web') {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));
    }
  };

  const handleSignup = (response: AuthResponse) => {
    setUser(response.user);
    setToken(response.token);
    
    if (Platform.OS === 'web') {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await logout(token);
      } catch (error) {
        console.error('Logout error:', error);
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
    if (Platform.OS === 'web') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
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
    // On web we redirect; after redirect loadAuthState will run and get session
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

  const updateUserFromServer = (nextUser: User) => {
    setUser(nextUser);
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('user_data', JSON.stringify(nextUser));
      } catch (error) {
        console.error('Error persisting updated user:', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
        signInWithGoogle,
        signInWithApple,
        isSupabaseSSOEnabled: isSupabaseConfigured(),
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
