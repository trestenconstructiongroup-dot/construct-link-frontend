import { Analytics } from '@vercel/analytics/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { WebFontLoader } from '../components/WebFontLoader';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: 1 },
  },
});

function AuthGate({ children }: PropsWithChildren) {
  const { user, isLoading, needsSsoSignup } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // 0) SSO user who has no Django account yet → force signup-role
    if (needsSsoSignup) {
      if (pathname !== '/signup-role') {
        router.replace('/signup-role');
      }
      return;
    }

    // 1) Unauthenticated users:
    //    - Can see landing and other public pages
    //    - Should NOT see /signup-role at all
    if (!user) {
      if (pathname === '/signup-role') {
        router.replace('/');
      }
      return;
    }

    const hasRole = user.is_worker || user.is_company;

    // 2) Logged-in user without a role:
    //    - Force them onto /signup-role until they pick one
    if (!hasRole && pathname !== '/signup-role') {
      router.replace('/signup-role');
      return;
    }

    // 3) Logged-in user WITH a role:
    //    - Should never see /signup-role again
    if (hasRole && pathname === '/signup-role') {
      router.replace('/');
    }
  }, [user, isLoading, needsSsoSignup, pathname, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <WebFontLoader />
            <AuthGate>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              />
            </AuthGate>
            {Platform.OS === 'web' && <Analytics />}
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
