/**
 * 404 Not Found Page (web)
 * Uses WebLayout (Navbar); FuzzyText canvas effect for "404"; theme + web fonts.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { usePathname, useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import FuzzyText from '../components/FuzzyText';
import { Colors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import WebLayout from './web/layout';

const webFonts = {
  heading: 'Knucklehead, system-ui, sans-serif',
  button: 'Knucklehead, system-ui, sans-serif',
  body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

export default function NotFoundScreenWeb() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <WebLayout>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* FuzzyText 404 */}
        <View style={styles.fuzzyContainer}>
          <FuzzyText
            baseIntensity={0.2}
            hoverIntensity={0.5}
            enableHover
            color={colors.text}
            fontFamily={webFonts.heading}
          >
            404
          </FuzzyText>
        </View>

        {/* Error messages */}
        <View style={styles.textContainer}>
          <Text style={[styles.heading, { color: colors.text, fontFamily: webFonts.heading }]}>
            Page Not Found
          </Text>
          <Text style={[styles.pathText, { color: colors.textSecondary, fontFamily: webFonts.body }]}>
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
          <Text style={[styles.backButtonText, { fontFamily: webFonts.button }]}>
            Back to Home
          </Text>
        </Pressable>
      </ScrollView>
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    ...(Platform.OS === 'web'
      ? ({ minHeight: '100vh' } as any)
      : null),
  },
  fuzzyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
    paddingHorizontal: 20,
    gap: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    ...(Platform.OS === 'web'
      ? ({ fontSize: 'clamp(24px, 4vw, 36px)' } as any)
      : null),
  },
  pathText: {
    fontSize: 16,
    textAlign: 'center',
    ...(Platform.OS === 'web'
      ? ({ fontSize: 'clamp(14px, 2vw, 18px)' } as any)
      : null),
  },
  pathHighlight: {
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '600',
    color: Colors.light.accentMuted,
    ...(Platform.OS === 'web'
      ? ({ fontSize: 'clamp(16px, 2.5vw, 20px)' } as any)
      : null),
  },
});
