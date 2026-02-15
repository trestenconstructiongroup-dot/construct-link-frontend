/**
 * Find Jobs – web page: list published jobs with filters and pagination.
 * Uses theme (Colors, Fonts) and WebLayout.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TextInput,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, Fonts } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useFindJobs } from '../../hooks/useFindJobs';
import { useFindJobsFilters } from '../../hooks/useFindJobsFilters';
import type { JobSummary } from '../../services/api';
import JobCard from './components/find-jobs/JobCard';
import LandingFooter from './components/landing/LandingFooter';
import WebLayout from './layout';

const BRAND_BLUE = Colors.light.accentMuted;
const JOB_TYPES = ['one_time', 'short_project', 'long_term'] as const;
const JOB_TYPE_LABELS: Record<string, string> = {
  one_time: 'One-time Task',
  short_project: 'Short Project',
  long_term: 'Long-term Engagement',
};

export default function FindJobsWebPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { token, user, isLoading: authLoading } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const isSmall = width < 900;
  const isLoggedIn = !!token && !!user;

  const { filtersData } = useFindJobsFilters(isLoggedIn);
  const params = useMemo(() => ({}), []);
  const {
    results,
    count,
    nextPage,
    loading,
    loadingMore,
    error: loadError,
    fetchNextPage,
    hasNextPage,
    refetch,
    updateJobInCache,
  } = useFindJobs(params, token ?? null, isLoggedIn);

  const [filtersOpen, setFiltersOpen] = useState(!isSmall);
  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [jobType, setJobType] = useState<string>('');
  const [payMin, setPayMin] = useState<string>('');
  const [payMax, setPayMax] = useState<string>('');
  const [location, setLocation] = useState('');

  const handleApplied = useCallback(
    (jobId: number, applications_count: number, has_applied: boolean) => {
      updateJobInCache(jobId, { applications_count, has_applied });
    },
    [updateJobInCache]
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !loadingMore) fetchNextPage();
  }, [hasNextPage, loadingMore, fetchNextPage]);

  const toggleSkill = useCallback((s: string) => {
    setSelectedSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }, []);

  const toggleRole = useCallback((r: string) => {
    setSelectedRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }, []);

  const toggleFiltersOpen = useCallback(() => {
    setFiltersOpen((o) => !o);
  }, []);

  const fontHeading = Fonts.display;
  const fontBody = Fonts.body;

  const renderItem = useCallback(
    ({ item }: { item: JobSummary }) => (
      <View style={isSmall ? { width: '100%' } : undefined}>
        <JobCard
          job={item}
          colors={colors}
          fontHeading={fontHeading}
          fontBody={fontBody}
          token={token}
          user={user}
          onApplied={handleApplied}
        />
      </View>
    ),
    [colors, fontHeading, fontBody, token, user, handleApplied, isSmall]
  );

  const keyExtractor = useCallback((item: JobSummary) => String(item.job_id), []);

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

  return (
    <WebLayout>
      {!isLoggedIn && (
        <View style={styles.authOverlay}>
          <Pressable style={styles.authBackdrop} onPress={() => router.back()} />
          <View style={[styles.authModal, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
            <Ionicons name="lock-closed-outline" size={36} color={colors.tint} style={{ marginBottom: 12 }} />
            <RNText style={[styles.authTitle, { color: colors.text }]}>Sign in required</RNText>
            <RNText style={[styles.authDesc, { color: colors.icon }]}>
              Sign in to browse available jobs.
            </RNText>
            <Pressable style={[styles.authBtn, { backgroundColor: BRAND_BLUE }]} onPress={() => router.push('/login')}>
              <RNText style={styles.authBtnText}>Sign In</RNText>
            </Pressable>
          </View>
        </View>
      )}
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={[styles.container, isSmall && styles.containerSmall, { backgroundColor: colors.background }]}>
          <View style={[styles.inner, isSmall && styles.innerStacked]}>
            {/* Header + Search */}
            <View style={styles.header}>
            <RNText style={[styles.title, { color: colors.text }, { fontFamily: fontHeading as any }]}>
              Find Jobs
            </RNText>
            <View style={[styles.searchRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <Ionicons name="search" size={22} color={colors.icon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search by title, description, or location..."
                placeholderTextColor={colors.icon}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          <View style={[styles.mainRow, isSmall && styles.mainRowStacked]}>
            {/* Filters sidebar */}
            <View style={[styles.sidebar, isSmall && styles.sidebarHidden]}>
              {isSmall && (
                <Pressable
                  onPress={toggleFiltersOpen}
                  style={[styles.filterToggle, { borderColor: colors.icon }]}
                >
                  <RNText style={{ color: colors.text, fontFamily: fontBody as any }}>Filters</RNText>
                  <Ionicons name={filtersOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.text} />
                </Pressable>
              )}
              {(!isSmall || filtersOpen) && filtersData && (
                <View style={[styles.filtersPanel, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                  <RNText style={[styles.filterTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>Filters</RNText>

                  {filtersData.skills_list.length > 0 && (
                    <View style={styles.filterBlock}>
                      <RNText style={[styles.filterLabel, { color: colors.text }]}>Skills</RNText>
                      <View style={styles.chipRow}>
                        {filtersData.skills_list.slice(0, 15).map((s) => (
                          <Pressable
                            key={s}
                            onPress={() => toggleSkill(s)}
                            style={[
                              styles.chip,
                              selectedSkills.includes(s) && { backgroundColor: colors.tint, opacity: 1 },
                              { borderColor: colors.icon },
                            ]}
                          >
                            <RNText style={[styles.chipText, { color: colors.text }, { fontFamily: fontBody as any }]} numberOfLines={1}>{s}</RNText>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}

                  {filtersData.roles_list.length > 0 && (
                    <View style={styles.filterBlock}>
                      <RNText style={[styles.filterLabel, { color: colors.text }]}>Roles</RNText>
                      <View style={styles.chipRow}>
                        {filtersData.roles_list.map((r) => (
                          <Pressable
                            key={r}
                            onPress={() => toggleRole(r)}
                            style={[
                              styles.chip,
                              selectedRoles.includes(r) && { backgroundColor: colors.tint, opacity: 1 },
                              { borderColor: colors.icon },
                            ]}
                          >
                            <RNText style={[styles.chipText, { color: colors.text }, { fontFamily: fontBody as any }]} numberOfLines={1}>{r}</RNText>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.filterBlock}>
                    <RNText style={[styles.filterLabel, { color: colors.text }]}>Job type</RNText>
                    <View style={[styles.selectWrap, { borderColor: colors.icon }]}>
                      <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                        style={{
                          width: '100%',
                          padding: 10,
                          background: colors.background,
                          color: colors.text,
                          border: 'none',
                          fontFamily: fontBody,
                          fontSize: 14,
                        } as any}
                      >
                        <option value=""> </option>
                        {JOB_TYPES.map((t) => (
                          <option key={t} value={t}>{JOB_TYPE_LABELS[t] || t}</option>
                        ))}
                      </select>
                    </View>
                  </View>

                  <View style={styles.filterBlock}>
                    <RNText style={[styles.filterLabel, { color: colors.text }]}>Pay range</RNText>
                    <View style={styles.payColumn}>
                      <TextInput
                        style={[styles.payInput, { color: colors.text, borderColor: colors.icon }]}
                        placeholder="Min"
                        placeholderTextColor={colors.icon}
                        value={payMin}
                        onChangeText={setPayMin}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={[styles.payInput, { color: colors.text, borderColor: colors.icon }]}
                        placeholder="Max"
                        placeholderTextColor={colors.icon}
                        value={payMax}
                        onChangeText={setPayMax}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  {filtersData.location_suggestions.length > 0 && (
                    <View style={styles.filterBlock}>
                      <RNText style={[styles.filterLabel, { color: colors.text }]}>Location</RNText>
                      <TextInput
                        style={[styles.locationInput, { color: colors.text, borderColor: colors.icon }]}
                        placeholder="City or region"
                        placeholderTextColor={colors.icon}
                        value={location}
                        onChangeText={setLocation}
                      />
                    </View>
                  )}

                  <Pressable
                    onPress={() => {
                      setSelectedSkills([]);
                      setSelectedRoles([]);
                      setJobType('');
                      setPayMin('');
                      setPayMax('');
                      setLocation('');
                    }}
                    style={[styles.clearBtn, { borderColor: colors.icon }]}
                  >
                    <RNText style={[styles.clearBtnText, { color: colors.text }, { fontFamily: fontBody as any }]}>Clear filters</RNText>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Boundary line then All jobs – wrapped in column so boundary doesn't steal row space */}
            <View style={styles.mainContentColumn}>
              <View style={[styles.boundaryLine, { backgroundColor: colors.icon }]} />
              <View style={styles.allJobsSection}>
              <RNText style={[styles.allJobsTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>
                All jobs
              </RNText>
              {loading ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={colors.tint} />
                </View>
              ) : loadError ? (
                <View style={styles.centered}>
                  <RNText style={[styles.emptyText, { color: colors.text }, { fontFamily: fontBody as any }]}>
                    {loadError}
                  </RNText>
                  <Pressable
                    onPress={() => refetch()}
                    style={[styles.loadMore, { backgroundColor: colors.tint, marginTop: 16 }]}
                  >
                    <RNText style={[styles.loadMoreText, { fontFamily: fontBody as any }]}>Retry</RNText>
                  </Pressable>
                </View>
              ) : results.length === 0 ? (
                <View style={styles.centered}>
                  <RNText style={[styles.emptyText, { color: colors.text }, { fontFamily: fontBody as any }]}>
                    No jobs yet.
                  </RNText>
                </View>
              ) : (
                <>
                  <RNText style={[styles.resultCount, { color: colors.text }, { fontFamily: fontBody as any }]}>
                    {count} job{count !== 1 ? 's' : ''}
                  </RNText>
                  <View style={[styles.cardGrid, isSmall && styles.cardGridSmall]}>
                    <FlatList
                      data={results}
                      keyExtractor={keyExtractor}
                      renderItem={renderItem}
                      scrollEnabled={false}
                      contentContainerStyle={[styles.cardGrid, isSmall && styles.cardGridSmall]}
                      onEndReached={handleLoadMore}
                      onEndReachedThreshold={0.3}
                      initialNumToRender={12}
                      maxToRenderPerBatch={12}
                      windowSize={5}
                      removeClippedSubviews={Platform.OS !== 'web'}
                      ListFooterComponent={
                        hasNextPage ? (
                          <Pressable
                            onPress={handleLoadMore}
                            disabled={loadingMore}
                            style={[styles.loadMore, { backgroundColor: colors.tint }]}
                          >
                            {loadingMore ? (
                              <ActivityIndicator color="#fff" size="small" />
                            ) : (
                              <RNText style={[styles.loadMoreText, { fontFamily: fontBody as any }]}>Load more</RNText>
                            )}
                          </Pressable>
                        ) : null
                      }
                    />
                  </View>
                  {nextPage != null && (
                    <Pressable
                      onPress={handleLoadMore}
                      disabled={loadingMore}
                      style={[styles.loadMore, { backgroundColor: colors.tint }]}
                    >
                      {loadingMore ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <RNText style={[styles.loadMoreText, { fontFamily: fontBody as any }]}>Load more</RNText>
                      )}
                    </Pressable>
                  )}
                </>
              )}
              </View>
            </View>
          </View>
        </View>
      </View>
      <LandingFooter isSmallScreen={width < 768} colors={colors} />
      </ScrollView>
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  } as ViewStyle,
  centerText: {
    marginTop: 12,
    fontSize: 16,
  } as TextStyle,
  scrollView: {
    flex: 1,
    width: '100%',
  } as ViewStyle,
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 48,
  } as ViewStyle,
  container: {
    paddingTop: Platform.OS === 'web' ? 100 : 24,
    paddingBottom: 24,
  } as ViewStyle,
  containerSmall: {
    paddingTop: 16,
  } as ViewStyle,
  inner: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 24,
  } as ViewStyle,
  innerStacked: {
    paddingHorizontal: 16,
  } as ViewStyle,
  header: {
    marginBottom: 24,
  } as ViewStyle,
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 16,
  } as TextStyle,
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  } as ViewStyle,
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
    ...Platform.select({ web: { outlineStyle: 'none' as any } }),
  } as TextStyle,
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  } as ViewStyle,
  mainRowStacked: {
    flexDirection: 'column',
    gap: 0,
  } as ViewStyle,
  mainContentColumn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
  } as ViewStyle,
  sidebar: {
    width: 280,
    minWidth: 280,
  } as ViewStyle,
  sidebarHidden: {
    width: '100%',
    minWidth: 0,
  } as ViewStyle,
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  } as ViewStyle,
  filtersPanel: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  } as ViewStyle,
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  } as TextStyle,
  filterBlock: {
    marginBottom: 16,
  } as ViewStyle,
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  } as ViewStyle,
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  } as ViewStyle,
  chipText: {
    fontSize: 13,
    maxWidth: 120,
  } as TextStyle,
  selectWrap: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  } as ViewStyle,
  payColumn: {
    flexDirection: 'column',
    gap: 8,
  } as ViewStyle,
  payInput: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 14,
  } as TextStyle,
  locationInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 14,
  } as TextStyle,
  clearBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
  } as ViewStyle,
  clearBtnText: {
    fontSize: 14,
  } as TextStyle,
  boundaryLine: {
    width: '100%',
    height: 1,
    marginVertical: 24,
    opacity: 0.3,
  } as ViewStyle,
  allJobsSection: {
    flex: 1,
    minWidth: 0,
  } as ViewStyle,
  allJobsTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  } as TextStyle,
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  } as ViewStyle,
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  } as TextStyle,
  resultCount: {
    fontSize: 14,
    marginBottom: 16,
  } as TextStyle,
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  } as ViewStyle,
  cardGridSmall: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  } as ViewStyle,
  loadMore: {
    alignSelf: 'center',
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  } as ViewStyle,
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  } as TextStyle,
  authOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  authBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' } as ViewStyle,
  authModal: { width: '90%', maxWidth: 380, borderRadius: 16, padding: 32, alignItems: 'center', ...Platform.select({ web: { boxShadow: '0 16px 48px rgba(0,0,0,0.3)' as any } }) } as ViewStyle,
  authTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8, fontFamily: Fonts.display } as TextStyle,
  authDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 } as TextStyle,
  authBtn: { width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 } as ViewStyle,
  authBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' } as TextStyle,
  authBtnOutline: { width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', borderWidth: 2 } as ViewStyle,
  authBtnOutlineText: { fontSize: 16, fontWeight: '600' } as TextStyle,
});
