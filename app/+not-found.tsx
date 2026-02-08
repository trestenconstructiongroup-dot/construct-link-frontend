/**
 * 404 Not Found Page (native / fallback)
 * Full-page centered layout with large "404" text, error messages, theme support, and back button.
 * Web uses +not-found.web.tsx with WebLayout + FuzzyText canvas effect.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { usePathname, useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function NotFoundScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      {/* Large 404 */}
      <View style={styles.errorCodeContainer}>
        <Text style={[styles.errorCode, { color: colors.text }]}>404</Text>
      </View>

      {/* Error messages */}
      <View style={styles.textContainer}>
        <Text style={[styles.heading, { color: colors.text }]}>Page Not Found</Text>
        <Text style={[styles.pathText, { color: colors.textSecondary }]}>
          The page <Text style={[styles.pathHighlight, { color: colors.accentMuted }]}>{pathname}</Text> could not be found
        </Text>
      </View>

      <Pressable
        style={[
          styles.backButton,
          {
            backgroundColor: isDark ? 'rgba(10, 126, 164, 0.2)' : 'rgba(10, 126, 164, 0.15)',
            borderColor: 'rgba(10, 126, 164, 0.5)',
          },
        ]}
        onPress={() => router.push('/')}
      >
        <Ionicons name="arrow-back" size={20} color={colors.accentMuted} />
        <Text style={styles.backButtonText}>Back to Home</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 20,
    ...(Platform.OS === 'web'
      ? ({ minHeight: '100vh' } as any)
      : null),
  },
  errorCodeContainer: {
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  errorCode: {
    fontSize: 96,
    fontWeight: 'bold' as const,
    fontFamily: Fonts.accent,
  },
  textContainer: {
    alignItems: 'center' as const,
    marginBottom: 32,
    paddingHorizontal: 20,
    gap: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    fontFamily: Fonts.display,
  },
  pathText: {
    fontSize: 15,
    textAlign: 'center' as const,
  },
  pathHighlight: {
    fontWeight: '600' as const,
  },
  backButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: '0 0 20px rgba(10, 126, 164, 0.3)',
        } as any)
      : null),
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.accentMuted,
    fontFamily: Fonts.display,
  },
});
