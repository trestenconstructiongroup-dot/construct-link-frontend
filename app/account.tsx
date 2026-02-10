import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/theme';
import WebLayout from './web/layout';
import { Text } from '../components/Text';

function AccountContent() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];

  const isWorker = user?.is_worker;
  const accountTypeLabel = isWorker ? 'Individual' : user?.is_company ? 'Company' : 'Unassigned';

  return (
    <ScrollView contentContainerStyle={[styles.page, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]} />
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.text }]}>
            {user?.full_name || user?.email || 'Your profile'}
          </Text>
          <Text style={[styles.meta, { color: colors.text }]}>
            {accountTypeLabel}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Profile setup coming next
      </Text>
      <Text style={[styles.copy, { color: colors.text }]}>
        This page will become your main public profile — where companies find your skills
        and workers learn about your projects. Next step is wiring it to the new profile
        APIs we just discussed (individual and company profiles).
      </Text>
    </ScrollView>
  );
}

export default function AccountScreen() {
  // For now we reuse the web layout even on native; later we can split into .web / .tsx files.
  if (Platform.OS === 'web') {
    return (
      <WebLayout>
        <AccountContent />
      </WebLayout>
    );
  }

  return <AccountContent />;
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    paddingTop: 120,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
  },
  meta: {
    marginTop: 4,
    fontSize: 14,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  copy: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 640,
  },
});

