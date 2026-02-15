import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Navbar from './components/Navbar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/theme';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { useUnreadCount } from '../../hooks/useMessaging';

export default function WebLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const { token, isAuthenticated } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;
  const { data: unreadData } = useUnreadCount(isAuthenticated ? token : null);
  const unreadCount = unreadData?.unread_count ?? 0;

  const contentPaddingTop =
    Platform.OS === 'web'
      ? (isSmallScreen ? 56 : 80)
      : 0;

  return (
    <View style={styles.container}>
      <Navbar />
      <ErrorBoundary>
        <View style={[styles.content, { paddingTop: contentPaddingTop }]}>
          {children}
        </View>
      </ErrorBoundary>
      {/* Floating notification bell - bottom-right, follows scroll */}
      <Pressable
        style={[
          styles.fabBell,
          {
            backgroundColor: colors.tint,
            ...(isSmallScreen && { width: 44, height: 44, borderRadius: 22 }),
          },
        ]}
        onPress={() => {
          router.push('/messages');
        }}
      >
        <Ionicons name="notifications-outline" size={isSmallScreen ? 20 : 24} color={colors.background} />
        {unreadCount > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
    width: '100%',
  },
  fabBell: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        cursor: 'pointer' as any,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' as any,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease' as any,
      },
    }),
  },
  fabBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F99324',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  fabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
});
