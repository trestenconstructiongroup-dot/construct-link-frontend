/**
 * 404 Not Found Page (native / fallback)
 * Full-page centered layout with Lottie animation (404.json), theme support, and back button.
 * Web uses +not-found.web.tsx with WebLayout.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function NotFoundScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.animationContainer}>
        <LottieView
          source={require('../assets/images/transparentVideo/404.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.errorCode, { color: colors.text }]}>404</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    ...Platform.select({
      web: {
        minHeight: '100vh',
      },
    }),
  },
  animationContainer: {
    width: '100%',
    maxWidth: 500,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  errorCode: {
    fontSize: 72,
    fontWeight: 'bold',
    marginBottom: 8,
    ...Platform.select({
      web: {
        fontSize: 'clamp(48px, 10vw, 96px)',
      },
      default: {
        fontFamily: Fonts.accent,
      },
    }),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: '0 0 20px rgba(10, 126, 164, 0.3)',
      },
    }),
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.accentMuted,
    ...Platform.select({
      web: {
        fontSize: 'clamp(16px, 2.5vw, 20px)',
      },
      default: {
        fontFamily: Fonts.display,
      },
    }),
  },
});
