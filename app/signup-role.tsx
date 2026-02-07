import { View, StyleSheet, Pressable, ScrollView, Platform, ViewStyle, TextStyle, Animated, Keyboard, TouchableWithoutFeedback, Alert } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/theme';
import WebLayout from './web/layout';
import { Text } from '../components/Text';
import { Text as RNText } from 'react-native';
import ThemeToggle from '../components/ThemeToggle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setUserRole, UserRole } from '../services/api';

type Role = UserRole;

export default function SignupRolePage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { user, token, updateUserFromServer } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (!selectedRole) {
      return;
    }

    if (!token) {
      router.replace('/signup');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await setUserRole(token, selectedRole);
      // Make sure auth context (and localStorage on web) know about the new role
      updateUserFromServer(updatedUser as any);
      router.replace('/');
    } catch (error: any) {
      console.error('Set role error:', error);
      let errorMessage = 'Unable to save your role. Please try again.';

      try {
        const errorText = error.message || error.toString();
        const errorData = JSON.parse(errorText);
        if (errorData.message || errorData.error) {
          errorMessage = errorData.message || errorData.error;
        }
      } catch {
        // ignore parse errors, use default message
      }

      Alert.alert('Signup Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.scrollContent}
      bounces={false}
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
              Choose your account type
            </RNText>
            <RNText style={[styles.subtitle, { color: colors.text }]}>
              Tell us how you&apos;ll use Tresten Construction Group Inc so we can tailor your experience for finding work, posting projects, or both.
            </RNText>
          </View>

          {/* Role cards */}
          <View style={styles.cardsRow}>
            <RoleCard
              label="I’m an individual"
              description="Find real construction jobs, post work you need done, or do both from one profile."
              selected={selectedRole === 'single'}
              onPress={() => setSelectedRole('single')}
              colors={colors}
              isDark={isDark}
            />

            <RoleCard
              label="We’re a company or team"
              description="Hire workers, bid for contracts, or manage both hiring and project work in one place."
              selected={selectedRole === 'company'}
              onPress={() => setSelectedRole('company')}
              colors={colors}
              isDark={isDark}
            />
          </View>

          {/* Continue button */}
          <Pressable
            style={[
              styles.continueButton,
              { backgroundColor: colors.tint },
              (!selectedRole || isSubmitting) && styles.continueButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedRole || isSubmitting}
          >
            <RNText style={[styles.continueButtonText, { color: colors.background }]}>
              {isSubmitting ? 'Creating account...' : 'Continue'}
            </RNText>
          </Pressable>

          {/* Back link */}
          <Pressable
            style={styles.backLink}
            onPress={() => router.back()}
          >
            <RNText style={[styles.backLinkText, { color: colors.text }]}>
              ← Back to details
            </RNText>
          </Pressable>
        </Animated.View>
      </View>
    </ScrollView>
  );

  // Web uses WebLayout, native is plain content wrapped for keyboard dismissal
  if (Platform.OS === 'web') {
    return <WebLayout>{content}</WebLayout>;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {content}
    </TouchableWithoutFeedback>
  );
}

interface RoleCardProps {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  colors: typeof Colors.light | typeof Colors.dark;
  isDark: boolean;
}

function RoleCard({
  label,
  description,
  selected,
  onPress,
  colors,
  isDark,
}: RoleCardProps) {
  return (
    <Pressable
      style={[
        styles.card,
        {
          borderColor: selected
            ? colors.tint
            : isDark
            ? 'rgba(148, 163, 184, 0.6)'
            : 'rgba(15, 23, 42, 0.08)',
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          transform: [{ translateY: selected ? -4 : 0 }],
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.cardDescription, { color: colors.text }]}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    ...Platform.select({
      web: {
        minHeight: '100vh' as any,
      },
    }),
  } as ViewStyle,
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  } as ViewStyle,
  content: {
    width: '100%',
    maxWidth: 840,
    ...Platform.select({
      web: {
        padding: '40px' as any,
        borderRadius: '24px' as any,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.18)' as any,
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
  } as ViewStyle,
  title: {
    fontSize: 32,
    fontFamily: 'Knucklehead',
    fontWeight: 'normal',
    marginBottom: 8,
    textAlign: 'left',
  } as TextStyle,
  subtitle: {
    fontSize: 16,
    fontFamily: 'FreakTurbulenceBRK',
    opacity: 0.8,
  } as TextStyle,
  cardsRow: {
    flexDirection: 'column',
    gap: 16,
    marginTop: 8,
    marginBottom: 32,
  } as ViewStyle,
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.45)' as any,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease' as any,
      },
    }),
  } as ViewStyle,
  cardImage: {
    width: '90%',
    alignSelf: 'center',
    aspectRatio: 1,
    marginTop: 16,
  } as ViewStyle,
  cardBody: {
    width: '100%',
    paddingHorizontal: 4,
  } as ViewStyle,
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Knucklehead',
    marginBottom: 8,
  } as TextStyle,
  cardDescription: {
    fontSize: 14,
    fontFamily: 'FreakTurbulenceBRK',
    opacity: 0.9,
    lineHeight: 20,
  } as TextStyle,
  continueButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'all 0.3s ease' as any,
        ':hover': {
          transform: 'translateY(-2px)' as any,
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.25)' as any,
        } as any,
      },
    }),
  } as ViewStyle,
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'FreakTurbulenceBRK',
  } as TextStyle,
  continueButtonDisabled: {
    opacity: 0.6,
  } as ViewStyle,
  backLink: {
    alignItems: 'center',
    marginTop: 4,
  } as ViewStyle,
  backLinkText: {
    fontSize: 14,
    fontFamily: 'FreakTurbulenceBRK',
    opacity: 0.8,
  } as TextStyle,
});

