/**
 * Worker or company detail page – full display for one worker/company by user_id.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Text as RNText,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import WebLayout from '../layout';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Colors, Fonts } from '../../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  getFindWorkerDetail,
  type WorkerSearchResultIndividual,
  type WorkerSearchResultCompany,
} from '../../../services/api';

const BRAND_BLUE = Colors.light.accentMuted;
const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Expert',
  master: 'Master / Veteran',
};

function isIndividual(
  r: WorkerSearchResultIndividual | WorkerSearchResultCompany
): r is WorkerSearchResultIndividual {
  return r.type === 'individual';
}

export default function WorkerDetailPage({ userId }: { userId: number | null }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const { token, user, isLoading: authLoading } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const isLoggedIn = !!token && !!user;
  const isSelf = user?.id != null && userId === user.id;

  const [data, setData] = useState<WorkerSearchResultIndividual | WorkerSearchResultCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fontHeading = Fonts.display;
  const fontBody = Fonts.body;

  const loadWorker = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setData(null);
      setLoadError('Invalid worker.');
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getFindWorkerDetail(userId, token || undefined);
      setData(res);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    loadWorker();
  }, [loadWorker]);

  if (authLoading) {
    return (
      <WebLayout>
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.tint} />
          <RNText style={[styles.centerText, { color: colors.text }]}>Loading…</RNText>
        </View>
      </WebLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <WebLayout>
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <RNText style={[styles.centerText, { color: colors.text }]}>
            You need to be logged in to view worker profiles.
          </RNText>
        </View>
      </WebLayout>
    );
  }

  return (
    <WebLayout>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.icon }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <RNText style={[styles.backBtnText, { color: colors.text }, { fontFamily: fontBody as any }]}>Back</RNText>
          </Pressable>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : loadError ? (
            <View style={styles.center}>
              <RNText style={[styles.errorText, { color: colors.text }]}>{loadError}</RNText>
            </View>
          ) : !data ? null : isIndividual(data) ? (
            <View style={[styles.content, { borderColor: colors.icon + '40' }]}>
              <View style={styles.header}>
                {data.profile_image ? (
                  <Image source={{ uri: data.profile_image }} style={styles.avatarLarge} />
                ) : (
                  <View style={[styles.avatarPlaceholderLarge, { backgroundColor: colors.icon + '30' }]}>
                    <Ionicons name="person" size={64} color={colors.icon} />
                  </View>
                )}
                <View style={styles.headerText}>
                  <RNText style={[styles.title, { color: colors.text }, { fontFamily: fontHeading as any }]}>{data.name}</RNText>
                  {data.primary_category ? <RNText style={[styles.subtitle, { color: colors.icon }]}>{data.primary_category}</RNText> : null}
                  {data.location ? <RNText style={[styles.meta, { color: colors.icon }]}>{data.location}</RNText> : null}
                </View>
              </View>
              {data.tagline ? <RNText style={[styles.tagline, { color: colors.text }]}>{data.tagline}</RNText> : null}
              {data.top_skills.length > 0 && (
                <View style={styles.section}>
                  <RNText style={[styles.sectionTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>Skills</RNText>
                  <View style={styles.chipRow}>
                    {data.top_skills.map((s, i) => (
                      <View key={i} style={[styles.chip, { backgroundColor: colors.tint + '20' }]}>
                        <RNText style={[styles.chipText, { color: colors.tint }, { fontFamily: fontBody as any }]}>{s}</RNText>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              <View style={styles.details}>
                <RNText style={[styles.detailLabel, { color: colors.icon }]}>Experience</RNText>
                <RNText style={[styles.detailValue, { color: colors.text }]}>
                  {data.experience_years != null ? `${EXPERIENCE_LABELS[data.experience_level] || data.experience_level} · ${data.experience_years} years` : (EXPERIENCE_LABELS[data.experience_level] || data.experience_level || '—')}
                </RNText>
                {(data.rating != null || data.reviews_count > 0) && (
                  <>
                    <RNText style={[styles.detailLabel, { color: colors.icon }]}>Rating</RNText>
                    <RNText style={[styles.detailValue, { color: colors.text }]}>{data.rating ?? '—'} ({data.reviews_count} reviews)</RNText>
                  </>
                )}
                <RNText style={[styles.detailLabel, { color: colors.icon }]}>Rate</RNText>
                <RNText style={[styles.detailValue, { color: colors.text }]}>{data.hourly_rate || data.daily_rate || 'Contact for rate'}</RNText>
              </View>
              <View style={[styles.footer, { borderTopColor: colors.icon + '40' }]}>
                {isSelf ? (
                  <Pressable onPress={() => router.push('/profile')} style={[styles.primaryBtn, { backgroundColor: BRAND_BLUE }]}>
                    <RNText style={[styles.primaryBtnText, { fontFamily: fontBody as any }]}>View your profile</RNText>
                  </Pressable>
                ) : (
                  <>
                    <Pressable style={[styles.secondaryBtn, { borderColor: colors.tint }]}>
                      <RNText style={[styles.secondaryBtnText, { color: colors.tint }, { fontFamily: fontBody as any }]}>Hire / Contact</RNText>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          ) : (
            <View style={[styles.content, { borderColor: colors.icon + '40' }]}>
              <View style={styles.header}>
                {data.company_logo ? (
                  <Image source={{ uri: data.company_logo }} style={styles.avatarLarge} />
                ) : (
                  <View style={[styles.avatarPlaceholderLarge, { backgroundColor: colors.icon + '30' }]}>
                    <Ionicons name="business" size={64} color={colors.icon} />
                  </View>
                )}
                <View style={styles.headerText}>
                  <RNText style={[styles.title, { color: colors.text }, { fontFamily: fontHeading as any }]}>{data.company_name}</RNText>
                  {data.company_type.length > 0 ? <RNText style={[styles.subtitle, { color: colors.icon }]}>{data.company_type.join(', ')}</RNText> : null}
                  {data.location ? <RNText style={[styles.meta, { color: colors.icon }]}>{data.location}</RNText> : null}
                </View>
              </View>
              {data.tagline ? <RNText style={[styles.tagline, { color: colors.text }]}>{data.tagline}</RNText> : null}
              {data.services_offered.length > 0 && (
                <View style={styles.section}>
                  <RNText style={[styles.sectionTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>Services</RNText>
                  <View style={styles.chipRow}>
                    {data.services_offered.map((s, i) => (
                      <View key={i} style={[styles.chip, { backgroundColor: colors.tint + '20' }]}>
                        <RNText style={[styles.chipText, { color: colors.tint }, { fontFamily: fontBody as any }]}>{s}</RNText>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              <View style={styles.details}>
                {data.team_size != null && (
                  <>
                    <RNText style={[styles.detailLabel, { color: colors.icon }]}>Team size</RNText>
                    <RNText style={[styles.detailValue, { color: colors.text }]}>{data.team_size}+ workers</RNText>
                  </>
                )}
                {data.min_project_budget && (
                  <>
                    <RNText style={[styles.detailLabel, { color: colors.icon }]}>Min project budget</RNText>
                    <RNText style={[styles.detailValue, { color: colors.text }]}>{data.min_project_budget}</RNText>
                  </>
                )}
              </View>
              <View style={[styles.footer, { borderTopColor: colors.icon + '40' }]}>
                {isSelf ? (
                  <Pressable onPress={() => router.push('/profile')} style={[styles.primaryBtn, { backgroundColor: BRAND_BLUE }]}>
                    <RNText style={[styles.primaryBtnText, { fontFamily: fontBody as any }]}>View your profile</RNText>
                  </Pressable>
                ) : (
                  <Pressable style={[styles.primaryBtn, { backgroundColor: BRAND_BLUE }]}>
                    <RNText style={[styles.primaryBtnText, { fontFamily: fontBody as any }]}>Hire / Contact</RNText>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 } as ViewStyle,
  centerText: { marginTop: 12, fontSize: 16 } as TextStyle,
  scrollView: { flex: 1, width: '100%' } as ViewStyle,
  scrollContent: { flexGrow: 1, paddingBottom: 48 } as ViewStyle,
  container: { paddingTop: Platform.OS === 'web' ? 100 : 24, paddingBottom: 24, maxWidth: 700, alignSelf: 'center', paddingHorizontal: 24 } as ViewStyle,
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24, alignSelf: 'flex-start' } as ViewStyle,
  backBtnText: { fontSize: 16 } as TextStyle,
  content: { padding: 24, borderRadius: 12, borderWidth: 1 } as ViewStyle,
  header: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 } as ViewStyle,
  avatarLarge: { width: 100, height: 100, borderRadius: 50 } as ViewStyle,
  avatarPlaceholderLarge: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  headerText: { flex: 1, minWidth: 0 } as ViewStyle,
  title: { fontSize: 28, fontWeight: '700' } as TextStyle,
  subtitle: { fontSize: 16, marginTop: 4 } as TextStyle,
  meta: { fontSize: 14, marginTop: 4 } as TextStyle,
  tagline: { fontSize: 16, opacity: 0.9, marginBottom: 20 } as TextStyle,
  section: { marginBottom: 20 } as ViewStyle,
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 } as TextStyle,
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } as ViewStyle,
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 } as ViewStyle,
  chipText: { fontSize: 14, fontWeight: '600' } as TextStyle,
  details: { marginTop: 8 } as ViewStyle,
  detailLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 4 } as TextStyle,
  detailValue: { fontSize: 15, fontWeight: '600' } as TextStyle,
  footer: { marginTop: 24, paddingTop: 20, borderTopWidth: 1 } as ViewStyle,
  primaryBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center' } as ViewStyle,
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' } as TextStyle,
  secondaryBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', borderWidth: 1 } as ViewStyle,
  secondaryBtnText: { fontSize: 16, fontWeight: '600' } as TextStyle,
  errorText: { fontSize: 16, textAlign: 'center' } as TextStyle,
});
