import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { healthCheck } from '../services/api';
import Landing from './Landing';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/theme';
import { Text } from '../components/Text';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    healthCheck()
      .then(() => setReady(true))
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  if (!ready || isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Connecting...</Text>
      </View>
    );
  }

  // When not on web (i.e., mobile app), send authenticated users straight to the main home
  if (Platform.OS !== 'web' && isAuthenticated) {
    return <Redirect href="/mobile/dashboard" />;
  }

  // Otherwise show the public landing page
  return <Landing />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
});
