import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Navbar from './components/Navbar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/theme';

export default function WebLayout({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <View style={styles.container}>
      <Navbar />
      <View style={styles.content}>
        {children}
      </View>
      {/* Floating notification bell - bottom-right, follows scroll */}
      <Pressable
        style={[
          styles.fabBell,
          {
            backgroundColor: colors.tint,
          },
        ]}
        onPress={() => {
          // Placeholder – you'll add behavior later
        }}
      >
        <Ionicons name="notifications-outline" size={24} color={colors.background} />
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
    // Push page content below the fixed navbar height on web
    ...Platform.select({
      web: {
        paddingTop: 80 as any,
      },
    }),
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
});
