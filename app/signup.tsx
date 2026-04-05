import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  ViewStyle,
  TextStyle,
  Animated,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupFormData } from '../lib/schemas/auth';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Fonts } from '../constants/theme';
import WebLayout from './web/layout';
import { Text as RNText } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemeToggle from '../components/ThemeToggle';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';

// ---------- Brand SVG icons (20x20) ----------

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

export default function SignupPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { signupWithEmail, signInWithGoogle, signInWithApple, signInWithAzure, isAuthenticated } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) router.replace('/');
  }, [isAuthenticated]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setFormError(null);
    try {
      await signupWithEmail(data);
      // AuthGate detects new user has no role -> redirects to /signup-role
    } catch (error: any) {
      let message = 'Signup failed. Please try again.';
      const errorData = error?.data ?? (() => {
        try { return JSON.parse(error?.message); } catch { return null; }
      })();
      if (errorData) {
        if (errorData.email) {
          message = Array.isArray(errorData.email)
            ? errorData.email[0]
            : errorData.email;
        } else if (errorData.password) {
          message = Array.isArray(errorData.password)
            ? errorData.password[0]
            : errorData.password;
        } else if (errorData.non_field_errors) {
          message = Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors[0]
            : errorData.non_field_errors;
        } else if (errorData.detail) {
          message = errorData.detail;
        }
      }
      setFormError(message);
    }
  };

  const ssoProviders: { id: SsoProviderId; label: string; icon: (color: string) => React.ReactNode }[] = [
    { id: 'google', label: 'Sign up with Google', icon: () => <GoogleIcon /> },
    { id: 'apple', label: 'Sign up with Apple', icon: (c) => <AppleIcon color={c} /> },
    { id: 'azure', label: 'Sign up with Microsoft', icon: () => <MicrosoftIcon /> },
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
    } catch (e: any) {
      const names: Record<SsoProviderId, string> = { google: 'Google', apple: 'Apple', azure: 'Microsoft' };
      Alert.alert(
        'Sign up failed',
        e?.message || `Could not sign up with ${names[provider]}.`
      );
    } finally {
      setSsoLoading(null);
    }
  };

  const isBusy = isSubmitting || !!ssoLoading;

  const content = (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.scrollContent}
      bounces={false}
      keyboardShouldPersistTaps="handled"
    >
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
              Create Account
            </RNText>
            <RNText style={[styles.subtitle, { color: colors.text }]}>
              Join the construction community
            </RNText>
          </View>

          {/* Email field */}
          <View style={styles.fieldContainer}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: errors.email
                        ? colors.error
                        : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                    },
                  ]}
                  placeholder="Email address"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  editable={!isBusy}
                />
              )}
            />
            {errors.email && (
              <RNText style={[styles.fieldError, { color: colors.error }]}>
                {errors.email.message}
              </RNText>
            )}
          </View>

          {/* Name fields – side by side */}
          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <Controller
                control={control}
                name="first_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        borderColor: errors.first_name
                          ? colors.error
                          : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                      },
                    ]}
                    placeholder="First name"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="words"
                    autoComplete="given-name"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isBusy}
                  />
                )}
              />
              {errors.first_name && (
                <RNText style={[styles.fieldError, { color: colors.error }]}>
                  {errors.first_name.message}
                </RNText>
              )}
            </View>
            <View style={styles.nameField}>
              <Controller
                control={control}
                name="last_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        borderColor: errors.last_name
                          ? colors.error
                          : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                      },
                    ]}
                    placeholder="Last name"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="words"
                    autoComplete="family-name"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isBusy}
                  />
                )}
              />
              {errors.last_name && (
                <RNText style={[styles.fieldError, { color: colors.error }]}>
                  {errors.last_name.message}
                </RNText>
              )}
            </View>
          </View>

          {/* Password field */}
          <View style={styles.fieldContainer}>
            <View>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        borderColor: errors.password
                          ? colors.error
                          : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                        paddingRight: 48,
                      },
                    ]}
                    placeholder="Password"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isBusy}
                  />
                )}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textTertiary}
                />
              </Pressable>
            </View>
            {errors.password && (
              <RNText style={[styles.fieldError, { color: colors.error }]}>
                {errors.password.message}
              </RNText>
            )}
          </View>

          {/* Confirm Password field */}
          <View style={styles.fieldContainer}>
            <View>
              <Controller
                control={control}
                name="confirm_password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        borderColor: errors.confirm_password
                          ? colors.error
                          : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                        paddingRight: 48,
                      },
                    ]}
                    placeholder="Confirm password"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isBusy}
                  />
                )}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={8}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textTertiary}
                />
              </Pressable>
            </View>
            {errors.confirm_password && (
              <RNText style={[styles.fieldError, { color: colors.error }]}>
                {errors.confirm_password.message}
              </RNText>
            )}
          </View>

          {/* Form-level error (backend errors) */}
          {formError && (
            <View style={[styles.formErrorContainer, { backgroundColor: `${colors.error}15` }]}>
              <RNText style={[styles.formErrorText, { color: colors.error }]}>
                {formError}
              </RNText>
            </View>
          )}

          {/* Submit button */}
          <Pressable
            style={[
              styles.submitButton,
              { backgroundColor: colors.tint },
              isBusy && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isBusy}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <RNText style={[styles.submitButtonText, { color: colors.background }]}>
                Create Account
              </RNText>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} />
            <RNText style={[styles.dividerText, { color: colors.textTertiary }]}>or</RNText>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} />
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
                disabled={isBusy}
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

          {/* Sign in link */}
          <View style={styles.footerLink}>
            <RNText style={[styles.footerLinkText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </RNText>
            <Pressable onPress={() => router.push('/login')}>
              <RNText style={[styles.footerLinkAction, { color: colors.tint }]}>
                Sign in
              </RNText>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  } as ViewStyle,
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    ...Platform.select({
      web: {
        minHeight: '100vh' as any,
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

  // Form fields
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  } as ViewStyle,
  nameField: {
    flex: 1,
  } as ViewStyle,
  fieldContainer: {
    width: '100%',
    marginBottom: 16,
  } as ViewStyle,
  input: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: Fonts.body,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
        transition: 'border-color 0.2s ease' as any,
      },
    }),
  } as TextStyle,
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    ...Platform.select({
      web: { cursor: 'pointer' as any },
    }),
  } as ViewStyle,
  fieldError: {
    fontSize: 13,
    fontFamily: Fonts.body,
    marginTop: 4,
    marginLeft: 4,
  } as TextStyle,
  formErrorContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
  } as ViewStyle,
  formErrorText: {
    fontSize: 14,
    fontFamily: Fonts.body,
    textAlign: 'center',
  } as TextStyle,

  // Submit button
  submitButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'all 0.2s ease' as any,
      },
    }),
  } as ViewStyle,
  submitButtonText: {
    fontSize: 16,
    fontFamily: Fonts.accent,
  } as TextStyle,
  submitButtonDisabled: {
    opacity: 0.6,
  } as ViewStyle,

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  } as ViewStyle,
  dividerLine: {
    flex: 1,
    height: 1,
  } as ViewStyle,
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontFamily: Fonts.body,
  } as TextStyle,

  // SSO buttons
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

  // Footer link
  footerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  } as ViewStyle,
  footerLinkText: {
    fontSize: 14,
    fontFamily: Fonts.body,
  } as TextStyle,
  footerLinkAction: {
    fontSize: 14,
    fontFamily: Fonts.accent,
    ...Platform.select({
      web: { cursor: 'pointer' as any },
    }),
  } as TextStyle,
});
