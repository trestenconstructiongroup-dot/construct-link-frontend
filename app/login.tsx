import { View, StyleSheet, Pressable, TextInput, Platform, ViewStyle, TextStyle, Animated, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Fonts } from '../constants/theme';
import WebLayout from './web/layout';
import { Text as RNText } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemeToggle from '../components/ThemeToggle';
import { logger } from '../utils/logger';
import { loginSchema, type LoginFormData } from '../lib/schemas/auth';

export default function LoginPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { login: authLogin, signInWithGoogle, signInWithApple, isSupabaseSSOEnabled, isAuthenticated } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  // Redirect when already authenticated (e.g. after OAuth callback)
  useEffect(() => {
    if (isAuthenticated) router.replace('/');
  }, [isAuthenticated]);

  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  type SsoProviderId = 'google' | 'apple';
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

  const onSubmit = async (data: LoginFormData) => {
    try {
      await authLogin(data.email, data.password);
      router.replace('/');
    } catch (error: any) {
      logger.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';

      try {
        const errorText = error.message || error.toString();
        const errorData = JSON.parse(errorText);

        if (errorData.non_field_errors) {
          const generalError = Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors[0]
            : errorData.non_field_errors;
          setError('email', { message: generalError });
          setError('password', { message: generalError });
          return;
        }
        if (errorData.email) {
          setError('email', {
            message: Array.isArray(errorData.email) ? errorData.email[0] : errorData.email,
          });
          return;
        }
        if (errorData.password) {
          setError('password', {
            message: Array.isArray(errorData.password) ? errorData.password[0] : errorData.password,
          });
          return;
        }
        if (errorData.message || errorData.error) {
          errorMessage = errorData.message || errorData.error;
        }
      } catch {
        const errorText = error.message || error.toString();
        if (errorText.toLowerCase().includes('email') || errorText.toLowerCase().includes('password')) {
          setError('email', { message: 'Invalid email or password.' });
          setError('password', { message: 'Invalid email or password.' });
          return;
        }
        errorMessage = errorText || errorMessage;
      }

      Alert.alert('Login Error', errorMessage);
      setError('email', { message: errorMessage });
    }
  };

  const emailInputRef = useRef<TextInput | null>(null);
  const passwordInputRef = useRef<TextInput | null>(null);
  const isWeb = Platform.OS === 'web';

  const ssoProviders: { id: SsoProviderId; label: string }[] = [
    { id: 'google', label: 'Sign in with Google' },
    { id: 'apple', label: 'Sign in with Apple' },
  ];

  const handleSsoPress = async (provider: SsoProviderId) => {
    setSsoLoading(provider);
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }
      router.replace('/');
    } catch (e: any) {
      const friendlyProvider = provider === 'google' ? 'Google' : 'Apple';
      Alert.alert(
        'Sign in failed',
        e?.message || `Could not sign in with ${friendlyProvider}.`
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
              Welcome Back
            </RNText>
            <RNText style={[styles.subtitle, { color: colors.text }]}>
              Sign in to your account to continue
            </RNText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <RNText style={[styles.label, { color: colors.text }]}>
                Email
              </RNText>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <Pressable
                      style={[
                        styles.inputWrapper,
                        {
                          borderColor: emailFocused
                            ? colors.tint
                            : errors.email
                            ? colors.error
                            : isDark
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.1)',
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.02)',
                        },
                      ]}
                      onPress={() => emailInputRef.current?.focus()}
                    >
                      <TextInput
                        ref={emailInputRef}
                        style={[
                          styles.input,
                          isWeb && value.length > 0 && styles.inputWebValue,
                          { color: colors.text },
                        ]}
                        placeholder="Enter your email"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                        value={value}
                        onChangeText={onChange}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => { onBlur(); setEmailFocused(false); }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                      />
                    </Pressable>
                    {errors.email && (
                      <RNText style={styles.errorText}>{errors.email.message}</RNText>
                    )}
                  </>
                )}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <RNText style={[styles.label, { color: colors.text }]}>
                Password
              </RNText>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <Pressable
                      style={[
                        styles.inputWrapper,
                        {
                          borderColor: passwordFocused
                            ? colors.tint
                            : errors.password
                            ? colors.error
                            : isDark
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.1)',
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.02)',
                        },
                      ]}
                      onPress={() => passwordInputRef.current?.focus()}
                    >
                      <TextInput
                        ref={passwordInputRef}
                        style={[
                          styles.input,
                          isWeb && value.length > 0 && styles.inputWebValue,
                          { color: colors.text },
                        ]}
                        placeholder="Enter your password"
                        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                        value={value}
                        onChangeText={onChange}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => { onBlur(); setPasswordFocused(false); }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="password"
                      />
                      <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                      >
                        <RNText style={[styles.eyeText, { color: colors.text }]}>
                          {showPassword ? '👁️' : '👁️‍🗨️'}
                        </RNText>
                      </Pressable>
                    </Pressable>
                    {errors.password && (
                      <RNText style={styles.errorText}>{errors.password.message}</RNText>
                    )}
                  </>
                )}
              />
            </View>

            {/* Forgot Password */}
            <Pressable style={styles.forgotPassword}>
              <RNText style={[styles.forgotPasswordText, { color: colors.tint }]}>
                Forgot password?
              </RNText>
            </Pressable>

            {/* Login Button */}
            <Pressable
              style={[
                styles.loginButton,
                { backgroundColor: colors.tint },
                isSubmitting && styles.loginButtonDisabled
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              <RNText style={[styles.loginButtonText, { color: colors.background }]}>
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </RNText>
            </Pressable>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]} />
              <RNText style={[styles.dividerText, { color: colors.text }]}>
                OR
              </RNText>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]} />
            </View>

            {/* SSO: Google / Apple (only when Supabase is configured) */}
            {isSupabaseSSOEnabled && (
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
                    <RNText style={[styles.ssoButtonText, { color: colors.text }]}>
                      {ssoLoading === provider.id
                        ? 'Redirecting...'
                        : provider.label}
                    </RNText>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <RNText style={[styles.signupText, { color: colors.text }]}>
                Don't have an account?{' '}
              </RNText>
              <Pressable onPress={() => router.push('/signup')}>
                <RNText style={[styles.signupLink, { color: colors.tint }]}>
                  Sign Up
                </RNText>
              </Pressable>
            </View>
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
    fontSize: 42,
    fontFamily: Fonts.display,
    fontWeight: 'normal',
    marginBottom: 8,
    textAlign: 'center',
    ...Platform.select({
      web: {
        fontSize: 'clamp(24px, 4vw, 32px)' as any,
      },
    }),
  } as TextStyle,
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.body,
    opacity: 0.7,
    textAlign: 'center',
  } as TextStyle,
  form: {
    width: '100%',
  } as ViewStyle,
  inputContainer: {
    marginBottom: 20,
  } as ViewStyle,
  label: {
    fontSize: 20,
    fontFamily: Fonts.display,
    fontWeight: 'normal',
    marginBottom: 10,
  } as TextStyle,
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 18,
    height: 56,
    ...Platform.select({
      web: {
        height: 64,
        transition: 'all 0.3s ease' as any,
      },
    }),
  } as ViewStyle,
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.body,
    padding: 0,
  } as TextStyle,
  inputWebValue: {
    fontFamily: 'system-ui',
  } as TextStyle,
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  } as ViewStyle,
  eyeText: {
    fontSize: 20,
    fontFamily: Fonts.body,
  } as TextStyle,
  errorText: {
    color: Colors.light.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  } as TextStyle,
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  } as ViewStyle,
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: Fonts.body,
    fontWeight: 'normal',
  } as TextStyle,
  loginButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'all 0.3s ease' as any,
        ':hover': {
          transform: 'translateY(-2px)' as any,
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)' as any,
        } as any,
      },
    }),
  } as ViewStyle,
  loginButtonText: {
    fontSize: 16,
    fontFamily: Fonts.body,
    fontWeight: 'normal',
  } as TextStyle,
  loginButtonDisabled: {
    opacity: 0.6,
  } as ViewStyle,
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  } as ViewStyle,
  dividerLine: {
    flex: 1,
    height: 1,
  } as ViewStyle,
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontFamily: Fonts.body,
    opacity: 0.5,
  } as TextStyle,
  ssoRow: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
  } as ViewStyle,
  ssoButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  ssoButtonText: {
    fontSize: 15,
    fontFamily: Fonts.body,
  } as TextStyle,
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  signupText: {
    fontSize: 14,
  } as TextStyle,
  signupLink: {
    fontSize: 14,
    fontFamily: Fonts.body,
    fontWeight: 'normal',
  } as TextStyle,
});
