import { Analytics } from '@vercel/analytics/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { WebFontLoader } from '../components/WebFontLoader';
import { Auth401Handler } from '../components/Auth401Handler';
import { ErrorBoundary } from '../components/ErrorBoundary';
import LogoLoader from '../components/LogoLoader';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import { ThemeProvider } from '../contexts/ThemeContext';
import { popCategoryIntent } from '../utils/categoryIntent';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: 1 },
  },
});

function AuthGate({ children }: PropsWithChildren) {
  const { user, isLoading, needsSsoSignup } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useInactivityLogout({ enabled: !!user });

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
    //    - Honour any pending category intent saved before login/signup
    if (hasRole && pathname === '/signup-role') {
      router.replace('/');
      return;
    }

    if (hasRole && Platform.OS === 'web') {
      const intent = popCategoryIntent();
      if (intent) {
        const path =
          intent.destination === 'find-workers'
            ? `/find-workers?category=${encodeURIComponent(intent.category)}`
            : `/find-jobs?skills=${encodeURIComponent(intent.category)}`;
        router.replace(path);
      }
    }
  }, [user, isLoading, needsSsoSignup, pathname, router]);

  if (isLoading) return <LogoLoader />;

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Auth401Handler />
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
