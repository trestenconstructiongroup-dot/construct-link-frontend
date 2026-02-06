import { View, StyleSheet, Pressable, TextInput, Platform, ViewStyle, TextStyle, Animated, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/theme';
import WebLayout from './web/layout';
import { Text } from '../components/Text';
import { Text as RNText } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemeToggle from '../components/ThemeToggle';

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
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        // Use auth context to handle login
        await authLogin(email, password);
        
        // Navigate to home/dashboard
        router.replace('/');
      } catch (error: any) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please try again.';
        const newErrors: { email?: string; password?: string } = {};
        
        // Try to parse error message if it's JSON
        try {
          const errorText = error.message || error.toString();
          const errorData = JSON.parse(errorText);
          
          // Handle non_field_errors (general errors from DRF)
          if (errorData.non_field_errors) {
            const generalError = Array.isArray(errorData.non_field_errors) 
              ? errorData.non_field_errors[0] 
              : errorData.non_field_errors;
            newErrors.email = generalError;
            newErrors.password = generalError;
          }
          // Handle field-specific errors
          else if (errorData.email) {
            const emailError = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
            newErrors.email = emailError;
          }
          else if (errorData.password) {
            const passwordError = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password;
            newErrors.password = passwordError;
          }
          
          // If there's a general error message
          if (errorData.message || errorData.error) {
            errorMessage = errorData.message || errorData.error;
          }
          
          // Set field errors if any
          if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
          } else {
            Alert.alert('Login Error', errorMessage);
            setErrors({ email: errorMessage });
          }
        } catch (parseError) {
          // If it's not JSON, show the raw error message
          const errorText = error.message || error.toString();
          if (errorText.toLowerCase().includes('email') || errorText.toLowerCase().includes('password')) {
            newErrors.email = 'Invalid email or password.';
            newErrors.password = 'Invalid email or password.';
          } else {
            errorMessage = errorText || errorMessage;
          }
          
          if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
          } else {
            Alert.alert('Login Error', errorMessage);
            setErrors({ email: errorMessage });
          }
        }
      } finally {
        setIsLoading(false);
      }
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
              <Pressable
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: emailFocused
                      ? colors.tint
                      : errors.email
                      ? '#ef4444'
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
                    isWeb && email.length > 0 && styles.inputWebValue,
                    { color: colors.text },
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </Pressable>
              {errors.email && (
                <RNText style={styles.errorText}>{errors.email}</RNText>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <RNText style={[styles.label, { color: colors.text }]}>
                Password
              </RNText>
              <Pressable
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: passwordFocused
                      ? colors.tint
                      : errors.password
                      ? '#ef4444'
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
                    isWeb && password.length > 0 && styles.inputWebValue,
                    { color: colors.text },
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
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
                <RNText style={styles.errorText}>{errors.password}</RNText>
              )}
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
                isLoading && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <RNText style={[styles.loginButtonText, { color: colors.background }]}>
                {isLoading ? 'Signing In...' : 'Sign In'}
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
    padding: 20,
    ...Platform.select({
      web: {
        minHeight: '100vh' as any,
        justifyContent: 'center',
        alignItems: 'center',
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
    fontFamily: 'Knucklehead',
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
    fontFamily: 'FreakTurbulenceBRK',
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
    fontFamily: 'Knucklehead',
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
    fontFamily: 'FreakTurbulenceBRK',
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
    fontFamily: 'FreakTurbulenceBRK',
  } as TextStyle,
  errorText: {
    color: '#ef4444',
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
    fontFamily: 'FreakTurbulenceBRK',
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
    fontFamily: 'FreakTurbulenceBRK',
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
    fontFamily: 'FreakTurbulenceBRK',
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
    fontFamily: 'FreakTurbulenceBRK',
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
    fontFamily: 'FreakTurbulenceBRK',
    fontWeight: 'normal',
  } as TextStyle,
});
