import { View, StyleSheet, Pressable, Platform, ViewStyle, TextStyle, Animated, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Fonts } from '../constants/theme';
import WebLayout from './web/layout';
import { Text as RNText } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemeToggle from '../components/ThemeToggle';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';

// ---------- Brand SVG icons (20×20) ----------

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

function AppleIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 384 512" fill={color}>
      <Path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-27.1-46.9-42.2-83.7-45.4-35.1-3.1-73.5 20.7-87.6 20.7-14.8 0-49.1-19.6-74.6-19.6C63.1 140.2 0 185.3 0 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.8 59 127.2 107.2 125.7 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-92.4zm-56.9-164c27.3-32.4 24.8-62.1 24-72.5-24 1.4-52 16.4-68.1 35.4-17.5 20.5-27.7 46.1-25.5 73.5 25.9 2 52.6-11.5 69.6-36.4z" />
    </Svg>
  );
}

function MicrosoftIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 23 23">
      <Path fill="#f35325" d="M1 1h10v10H1z" />
      <Path fill="#81bc06" d="M12 1h10v10H12z" />
      <Path fill="#05a6f0" d="M1 12h10v10H1z" />
      <Path fill="#ffba08" d="M12 12h10v10H12z" />
    </Svg>
  );
}

type SsoProviderId = 'google' | 'apple' | 'azure';

export default function LoginPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { signInWithGoogle, signInWithApple, signInWithAzure, isAuthenticated } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  // Redirect when already authenticated (e.g. after OAuth callback)
  useEffect(() => {
    if (isAuthenticated) router.replace('/');
  }, [isAuthenticated]);

  const [ssoLoading, setSsoLoading] = useState<SsoProviderId | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const ssoProviders: { id: SsoProviderId; label: string; icon: (color: string) => React.ReactNode }[] = [
    { id: 'google', label: 'Continue with Google', icon: () => <GoogleIcon /> },
    { id: 'apple', label: 'Continue with Apple', icon: (c) => <AppleIcon color={c} /> },
    { id: 'azure', label: 'Continue with Microsoft', icon: () => <MicrosoftIcon /> },
  ];

  const handleSsoPress = async (provider: SsoProviderId) => {
    setSsoLoading(provider);
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else if (provider === 'apple') {
        await signInWithApple();
      } else {
        await signInWithAzure();
      }
      router.replace('/');
    } catch (e: any) {
      const names: Record<SsoProviderId, string> = { google: 'Google', apple: 'Apple', azure: 'Microsoft' };
      Alert.alert(
        'Sign in failed',
        e?.message || `Could not sign in with ${names[provider]}.`
      );
    } finally {
      setSsoLoading(null);
    }
  };

  const content = (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Theme toggle (shown directly on mobile; on web it's in the navbar) */}
        {Platform.OS !== 'web' && (
          <View style={[styles.mobileToggleContainer, { paddingTop: insets.top }]}>
            <ThemeToggle />
          </View>
        )}

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <RNText style={[styles.title, { color: colors.text }]}>
              Sign In
            </RNText>
            <RNText style={[styles.subtitle, { color: colors.text }]}>
              Continue with your preferred account
            </RNText>
          </View>

          {/* SSO Providers */}
          <View style={styles.ssoRow}>
            {ssoProviders.map((provider) => (
              <Pressable
                key={provider.id}
                style={[
                  styles.ssoButton,
                  {
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(0,0,0,0.15)',
                  },
                ]}
                onPress={() => handleSsoPress(provider.id)}
                disabled={!!ssoLoading}
              >
                <View style={styles.ssoButtonInner}>
                  <View style={styles.ssoIconWrap}>
                    {provider.icon(colors.text)}
                  </View>
                  <RNText style={[styles.ssoButtonText, { color: colors.text }]}>
                    {ssoLoading === provider.id
                      ? 'Redirecting...'
                      : provider.label}
                  </RNText>
                </View>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
  );

  // Use WebLayout (with navbar + toggler) on web, plain content on native
  if (Platform.OS === 'web') {
    return <WebLayout>{content}</WebLayout>;
  }

  // On mobile, dismiss keyboard when tapping outside inputs
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {content}
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    ...Platform.select({
      web: {
        minHeight: '100vh' as any,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 40,
        paddingBottom: 40,
        overflowY: 'auto' as any,
      },
      default: {
        alignItems: 'center',
        justifyContent: 'center',
      },
    }),
  } as ViewStyle,
  content: {
    width: '100%',
    maxWidth: 440,
    ...Platform.select({
      web: {
        padding: '40px' as any,
        borderRadius: '24px' as any,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)' as any,
      },
    }),
  } as ViewStyle,
  mobileToggleContainer: {
    height: 48,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  } as ViewStyle,
  header: {
    marginBottom: 32,
    alignItems: 'center',
  } as ViewStyle,
  title: {
    fontSize: 28,
    fontFamily: Fonts.display,
    fontWeight: 'normal',
    marginBottom: 8,
    textAlign: 'center',
    ...Platform.select({
      web: {
        fontSize: 'clamp(22px, 3vw, 28px)' as any,
      },
    }),
  } as TextStyle,
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.body,
    opacity: 0.7,
    textAlign: 'center',
  } as TextStyle,
  ssoRow: {
    flexDirection: 'column',
    gap: 14,
  } as ViewStyle,
  ssoButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'all 0.2s ease' as any,
      },
    }),
  } as ViewStyle,
  ssoButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  ssoIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  } as ViewStyle,
  ssoButtonText: {
    fontSize: 16,
    fontFamily: Fonts.body,
  } as TextStyle,
});
