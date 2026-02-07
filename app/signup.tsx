import { View, StyleSheet, Pressable, TextInput, Platform, ViewStyle, TextStyle, Animated, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/theme';
import WebLayout from './web/layout';
import { Text } from '../components/Text';
import { Text as RNText } from 'react-native';
import ThemeToggle from '../components/ThemeToggle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SignupField = 'name' | 'email' | 'password' | 'confirmPassword';

export default function SignupPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const {
    signup: authSignup,
    signInWithGoogle,
    signInWithApple,
    isSupabaseSSOEnabled,
  } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState<Record<SignupField, string>>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [focused, setFocused] = useState<Record<SignupField, boolean>>({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<SignupField, string>>>({});
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

  const handleInputChange = (field: SignupField, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const validateForm = (data: Record<SignupField, string>): Partial<Record<SignupField, string>> => {
    const nextErrors: Partial<Record<SignupField, string>> = {};

    if (!data.name.trim()) {
      nextErrors.name = 'Name is required';
    }

    if (!data.email) {
      nextErrors.email = 'Email is required';
    } else if (!validateEmail(data.email)) {
      nextErrors.email = 'Please enter a valid email';
    }

    if (!data.password) {
      nextErrors.password = 'Password is required';
    } else if (data.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    if (!data.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password';
    } else if (data.password !== data.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    return nextErrors;
  };

  const handleSignup = async () => {
    const newErrors = validateForm(formData);
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        const response = await signup({
          email: formData.email,
          full_name: formData.name,
          password: formData.password,
          confirm_password: formData.confirmPassword,
        });
        
        console.log('Signup successful:', response);

        // Automatically log in the user using auth context
        authSignup(response);

        // If no role chosen yet, send to role selection; otherwise go home
        if (!response.user.is_worker && !response.user.is_company) {
          router.replace('/signup-role');
        } else {
          router.replace('/');
        }
      } catch (error: any) {
        console.error('Signup error:', error);
        let errorMessage = 'Signup failed. Please try again.';
        const fieldErrors: Partial<Record<SignupField, string>> = {};
        
        // Try to parse error message if it's JSON
        try {
          const errorText = error.message || error.toString();
          const errorData = JSON.parse(errorText);

          if (errorData.email) {
            const emailError = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
            fieldErrors.email = emailError;
          }
          if (errorData.password) {
            const passwordError = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password;
            fieldErrors.password = passwordError;
          }
          if (errorData.full_name) {
            const nameError = Array.isArray(errorData.full_name) ? errorData.full_name[0] : errorData.full_name;
            fieldErrors.name = nameError;
          }
          if (errorData.confirm_password) {
            const confirmError = Array.isArray(errorData.confirm_password) ? errorData.confirm_password[0] : errorData.confirm_password;
            fieldErrors.confirmPassword = confirmError;
          }
          
          // If there's a general error message
          if (errorData.message || errorData.error) {
            errorMessage = errorData.message || errorData.error;
          }
          
          // Set field errors if any
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          } else {
            Alert.alert('Signup Error', errorMessage);
          }
        } catch (parseError) {
          // If it's not JSON, show the raw error message
          const errorText = error.message || error.toString();
          if (errorText.includes('email')) {
            fieldErrors.email = 'This email is already registered or invalid.';
          } else if (errorText.includes('password')) {
            fieldErrors.password = 'Password validation failed.';
          } else {
            errorMessage = errorText || errorMessage;
            Alert.alert('Signup Error', errorMessage);
          }
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const ssoProviders: { id: SsoProviderId; label: string }[] = [
    { id: 'google', label: 'Sign up with Google' },
    { id: 'apple', label: 'Sign up with Apple' },
  ];

  const handleSsoPress = async (provider: SsoProviderId) => {
    setSsoLoading(provider);
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }
      // After redirect, AuthContext + login page will complete the flow.
    } catch (e: any) {
      const friendlyProvider = provider === 'google' ? 'Google' : 'Apple';
      Alert.alert(
        'Sign up failed',
        e?.message || `Could not sign up with ${friendlyProvider}.`
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
              Create Account
            </RNText>
            <RNText style={[styles.subtitle, { color: colors.text }]}>
              Sign up to get started with Tresten Construction Group Inc
            </RNText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <RNText style={[styles.label, { color: colors.text }]}>
                Full Name
              </RNText>
              <Pressable
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: focused.name
                      ? colors.tint
                      : errors.name
                      ? '#ef4444'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)',
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.02)',
                  },
                ]}
                onPress={() => setFocused({ ...focused, name: true })}
              >
                <TextInput
                  style={[
                    styles.input,
                    Platform.OS === 'web' && formData.name.length > 0 && styles.inputWebValue,
                    { color: colors.text },
                  ]}
                  placeholder="Enter your full name"
                  placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  onFocus={() => setFocused({ ...focused, name: true })}
                  onBlur={() => setFocused({ ...focused, name: false })}
                  autoCapitalize="words"
                />
              </Pressable>
              {errors.name && (
                <RNText style={styles.errorText}>{errors.name}</RNText>
              )}
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <RNText style={[styles.label, { color: colors.text }]}>
                Email
              </RNText>
              <Pressable
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: focused.email
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
                onPress={() => setFocused({ ...focused, email: true })}
              >
                <TextInput
                  style={[
                    styles.input,
                    Platform.OS === 'web' && formData.email.length > 0 && styles.inputWebValue,
                    { color: colors.text },
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  onFocus={() => setFocused({ ...focused, email: true })}
                  onBlur={() => setFocused({ ...focused, email: false })}
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
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: focused.password
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
              >
                <TextInput
                  style={[
                    styles.input,
                    Platform.OS === 'web' && formData.password.length > 0 && styles.inputWebValue,
                    { color: colors.text },
                  ]}
                  placeholder="Create a password"
                  placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  onFocus={() => setFocused({ ...focused, password: true })}
                  onBlur={() => setFocused({ ...focused, password: false })}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <RNText style={[styles.eyeText, { color: colors.text }]}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </RNText>
                </Pressable>
              </View>
              {errors.password && (
                <RNText style={styles.errorText}>{errors.password}</RNText>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <RNText style={[styles.label, { color: colors.text }]}>
                Confirm Password
              </RNText>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: focused.confirmPassword
                      ? colors.tint
                      : errors.confirmPassword
                      ? '#ef4444'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)',
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.02)',
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    Platform.OS === 'web' && formData.confirmPassword.length > 0 && styles.inputWebValue,
                    { color: colors.text },
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleInputChange('confirmPassword', text)}
                  onFocus={() => setFocused({ ...focused, confirmPassword: true })}
                  onBlur={() => setFocused({ ...focused, confirmPassword: false })}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <RNText style={[styles.eyeText, { color: colors.text }]}>
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </RNText>
                </Pressable>
              </View>
              {errors.confirmPassword && (
                <RNText style={styles.errorText}>{errors.confirmPassword}</RNText>
              )}
            </View>

            {/* Sign Up Button */}
            <Pressable
              style={[
                styles.signupButton, 
                { backgroundColor: colors.tint },
                isLoading && styles.signupButtonDisabled
              ]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <RNText style={[styles.signupButtonText, { color: colors.background }]}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
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

            {/* SSO Sign up */}
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

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <RNText style={[styles.loginText, { color: colors.text }]}>
                Already have an account?{' '}
              </RNText>
              <Pressable onPress={() => router.push('/login')}>
                <RNText style={[styles.loginLink, { color: colors.tint }]}>
                  Sign In
                </RNText>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
  );

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
    fontSize: 40,
    fontFamily: 'Knucklehead',
    fontWeight: 'normal',
    marginBottom: 8,
    textAlign: 'center',
    ...Platform.select({
      web: {
        fontSize: 'clamp(28px, 4.5vw, 40px)' as any,
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
  signupButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
  signupButtonText: {
    fontSize: 16,
    fontFamily: 'FreakTurbulenceBRK',
    fontWeight: 'normal',
  } as TextStyle,
  signupButtonDisabled: {
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  loginText: {
    fontSize: 14,
  } as TextStyle,
  loginLink: {
    fontSize: 14,
    fontFamily: 'FreakTurbulenceBRK',
    fontWeight: 'normal',
  } as TextStyle,
});
