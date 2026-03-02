import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  ViewStyle,
  TextStyle,
  Animated,
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

export default function SignupPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { signupWithEmail, isAuthenticated } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) router.replace('/');
  }, [isAuthenticated]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
      full_name: '',
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
      try {
        const errorData = error.data || JSON.parse(error.message);
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
      } catch {
        // use default message
      }
      setFormError(message);
    }
  };

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
                  editable={!isSubmitting}
                />
              )}
            />
            {errors.email && (
              <RNText style={[styles.fieldError, { color: colors.error }]}>
                {errors.email.message}
              </RNText>
            )}
          </View>

          {/* Full Name field */}
          <View style={styles.fieldContainer}>
            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: errors.full_name
                        ? colors.error
                        : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                    },
                  ]}
                  placeholder="Full name"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                  autoComplete="name"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  editable={!isSubmitting}
                />
              )}
            />
            {errors.full_name && (
              <RNText style={[styles.fieldError, { color: colors.error }]}>
                {errors.full_name.message}
              </RNText>
            )}
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
                    editable={!isSubmitting}
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
                    editable={!isSubmitting}
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
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <RNText style={[styles.submitButtonText, { color: colors.background }]}>
                Create Account
              </RNText>
            )}
          </Pressable>

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
