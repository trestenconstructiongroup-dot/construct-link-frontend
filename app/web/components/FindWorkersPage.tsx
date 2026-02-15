/**
 * Find Workers – web page: search individuals and companies with filters and pagination.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Colors, Fonts } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useFindWorkers } from '../../../hooks/useFindWorkers';
import { useFindWorkersFilters } from '../../../hooks/useFindWorkersFilters';
import { getOrCreateConversation, type WorkerSearchResult, type WorkerSearchResultIndividual } from '../../../services/api';
import WebLayout from '../layout';
import CompanyCard from './find-workers/CompanyCard';
import IndividualCard from './find-workers/IndividualCard';
import LandingFooter from './landing/LandingFooter';

const BRAND_BLUE = Colors.light.accentMuted;
const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'expert', 'master'] as const;
const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Expert',
  master: 'Master / Veteran',
};
const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently updated' },
  { value: 'experience', label: 'Most experienced' },
];

function isIndividual(r: WorkerSearchResult): r is WorkerSearchResultIndividual {
  return r.type === 'individual';
}

export default function FindWorkersPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { token, user, isLoading: authLoading } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const isSmall = width < 900;
  const isLoggedIn = !!token && !!user;

  const { filtersData } = useFindWorkersFilters(isLoggedIn);

  const [filtersOpen, setFiltersOpen] = useState(!isSmall);
  const [search, setSearch] = useState('');
  const [resultType, setResultType] = useState<'all' | 'individual' | 'company'>('all');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [yearsMin, setYearsMin] = useState('');
  const [yearsMax, setYearsMax] = useState('');
  const [location, setLocation] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [teamSizeMin, setTeamSizeMin] = useState('');
  const [sort, setSort] = useState('recent');

  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedResultType, setAppliedResultType] = useState<'all' | 'individual' | 'company'>('all');
  const [appliedSkills, setAppliedSkills] = useState<string[]>([]);
  const [appliedCategory, setAppliedCategory] = useState('');
  const [appliedExperienceLevel, setAppliedExperienceLevel] = useState('');
  const [appliedYearsMin, setAppliedYearsMin] = useState('');
  const [appliedYearsMax, setAppliedYearsMax] = useState('');
  const [appliedLocation, setAppliedLocation] = useState('');
  const [appliedCompanyType, setAppliedCompanyType] = useState('');
  const [appliedTeamSizeMin, setAppliedTeamSizeMin] = useState('');
  const [appliedSort, setAppliedSort] = useState('recent');

  // Read ?search= from URL (e.g. from hero search bar)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('search');
    if (q) {
      setSearch(q);
      setAppliedSearch(q);
    }
  }, []);

  const appliedParams = useMemo(
    () => ({
      search: appliedSearch,
      type: appliedResultType,
      skills: appliedSkills.length ? appliedSkills.join(',') : undefined,
      category: appliedCategory || undefined,
      experience_level: appliedExperienceLevel || undefined,
      years_min: appliedYearsMin ? Number(appliedYearsMin) : undefined,
      years_max: appliedYearsMax ? Number(appliedYearsMax) : undefined,
      location: appliedLocation || undefined,
      company_type: appliedCompanyType || undefined,
      team_size_min: appliedTeamSizeMin ? Number(appliedTeamSizeMin) : undefined,
      sort: appliedSort,
    }),
    [
      appliedSearch,
      appliedResultType,
      appliedSkills,
      appliedCategory,
      appliedExperienceLevel,
      appliedYearsMin,
      appliedYearsMax,
      appliedLocation,
      appliedCompanyType,
      appliedTeamSizeMin,
      appliedSort,
    ]
  );

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
  } = useFindWorkers(appliedParams, token ?? null, isLoggedIn);

  const fontHeading = Fonts.display;
  const fontBody = Fonts.body;

  const handleViewProfile = useCallback((userId: number) => {
    router.push(`/workers/${userId}`);
  }, [router]);

  const handleContact = useCallback(async (userId: number) => {
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const { id } = await getOrCreateConversation(token, userId);
      router.push(`/messages?conv=${id}`);
    } catch (err: any) {
      alert(err?.message || 'Could not start conversation.');
    }
  }, [token, router]);

  const handleApplyFilters = useCallback(() => {
    setAppliedSearch(search);
    setAppliedResultType(resultType);
    setAppliedSkills(selectedSkills);
    setAppliedCategory(category);
    setAppliedExperienceLevel(experienceLevel);
    setAppliedYearsMin(yearsMin);
    setAppliedYearsMax(yearsMax);
    setAppliedLocation(location);
    setAppliedCompanyType(companyType);
    setAppliedTeamSizeMin(teamSizeMin);
    setAppliedSort(sort);
  }, [search, resultType, selectedSkills, category, experienceLevel, yearsMin, yearsMax, location, companyType, teamSizeMin, sort]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !loadingMore) fetchNextPage();
  }, [hasNextPage, loadingMore, fetchNextPage]);

  const toggleSkill = useCallback((s: string) => {
    setSelectedSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setResultType('all');
    setSelectedSkills([]);
    setCategory('');
    setExperienceLevel('');
    setYearsMin('');
    setYearsMax('');
    setLocation('');
    setCompanyType('');
    setTeamSizeMin('');
    setSort('recent');
    setAppliedSearch('');
    setAppliedResultType('all');
    setAppliedSkills([]);
    setAppliedCategory('');
    setAppliedExperienceLevel('');
    setAppliedYearsMin('');
    setAppliedYearsMax('');
    setAppliedLocation('');
    setAppliedCompanyType('');
    setAppliedTeamSizeMin('');
    setAppliedSort('recent');
  }, []);

  const toggleFiltersOpen = useCallback(() => {
    setFiltersOpen((o) => !o);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: WorkerSearchResult }) =>
      isIndividual(item) ? (
        <IndividualCard item={item} colors={colors} fontHeading={fontHeading} fontBody={fontBody} onView={handleViewProfile} onContact={handleContact} />
      ) : (
        <CompanyCard item={item} colors={colors} fontHeading={fontHeading} fontBody={fontBody} onView={handleViewProfile} onContact={handleContact} />
      ),
    [colors, fontHeading, fontBody, handleViewProfile, handleContact]
  );

  const keyExtractor = useCallback((item: WorkerSearchResult) => `${item.type}-${item.user_id}`, []);

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
      {/* ---- Auth prompt overlay ---- */}
      {!isLoggedIn && (
        <View style={styles.authOverlay}>
          <Pressable style={styles.authBackdrop} onPress={() => router.back()} />
          <View style={[styles.authModal, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
            <Ionicons name="lock-closed-outline" size={36} color={colors.tint} style={{ marginBottom: 12 }} />
            <RNText style={[styles.authTitle, { color: colors.text }]}>Sign in required</RNText>
            <RNText style={[styles.authDesc, { color: colors.icon }]}>
              Sign in to browse workers and companies.
            </RNText>
            <Pressable
              style={[styles.authBtn, { backgroundColor: BRAND_BLUE }]}
              onPress={() => router.push('/login')}
            >
              <RNText style={styles.authBtnText}>Sign In</RNText>
            </Pressable>
          </View>
        </View>
      )}
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.inner, isSmall && styles.innerStacked]}>
            <View style={styles.header}>
              <RNText style={[styles.title, { color: colors.text }, { fontFamily: (fontHeading as any) }]}>
                Find Workers
              </RNText>
              <View style={[styles.searchRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <Ionicons name="search" size={22} color={colors.icon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search by name, skill, category, company..."
                  placeholderTextColor={colors.icon}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            </View>

            <View style={styles.mainRow}>
              <View style={[styles.sidebar, isSmall && styles.sidebarHidden]}>
                {isSmall && (
                  <Pressable
                    onPress={toggleFiltersOpen}
                    style={[styles.filterToggle, { borderColor: colors.icon }]}
                  >
                    <RNText style={{ color: colors.text, fontFamily: (fontBody as any) }}>Filters</RNText>
                    <Ionicons name={filtersOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.text} />
                  </Pressable>
                )}
                {(!isSmall || filtersOpen) && filtersData && (
                  <View style={[styles.filtersPanel, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                    <RNText style={[styles.filterTitle, { color: colors.text }, { fontFamily: (fontHeading as any) }]}>Filters</RNText>

                    <View style={styles.filterBlock}>
                      <RNText style={[styles.filterLabel, { color: colors.text }]}>Type</RNText>
                      <View style={styles.chipRow}>
                        {(['all', 'individual', 'company'] as const).map((t) => (
                          <Pressable
                            key={t}
                            onPress={() => setResultType(t)}
                            style={[styles.chip, resultType === t && { backgroundColor: BRAND_BLUE }, { borderColor: colors.icon }]}
                          >
                            <RNText style={[styles.chipText, { color: colors.text }, { fontFamily: (fontBody as any) }]}>
                              {t === 'all' ? 'All' : t === 'individual' ? 'Workers' : 'Companies'}
                            </RNText>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    {filtersData.skills_list.length > 0 && (
                      <View style={styles.filterBlock}>
                        <RNText style={[styles.filterLabel, { color: colors.text }]}>Skills</RNText>
                        <View style={styles.chipRow}>
                          {filtersData.skills_list.slice(0, 12).map((s) => (
                            <Pressable
                              key={s}
                              onPress={() => toggleSkill(s)}
                              style={[styles.chip, selectedSkills.includes(s) && { backgroundColor: colors.tint }, { borderColor: colors.icon }]}
                            >
                              <RNText style={[styles.chipText, { color: colors.text }, { fontFamily: (fontBody as any) }]} numberOfLines={1}>{s}</RNText>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}

                    {filtersData.categories_list.length > 0 && (
                      <View style={styles.filterBlock}>
                        <RNText style={[styles.filterLabel, { color: colors.text }]}>Category</RNText>
                        <View style={[styles.selectWrap, { borderColor: colors.icon }]}>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={{ width: '100%', padding: 10, background: colors.background, color: colors.text, border: 'none', fontFamily: fontBody, fontSize: 14 } as any}
                          >
                            <option value="">All</option>
                            {filtersData.categories_list.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </View>
                      </View>
                    )}

                    <View style={styles.filterBlock}>
                      <RNText style={[styles.filterLabel, { color: colors.text }]}>Experience level</RNText>
                      <View style={styles.chipRow}>
                        {EXPERIENCE_LEVELS.map((l) => (
                          <Pressable
                            key={l}
                            onPress={() => setExperienceLevel(experienceLevel === l ? '' : l)}
                            style={[styles.chip, experienceLevel === l && { backgroundColor: BRAND_BLUE }, { borderColor: colors.icon }]}
                          >
                            <RNText style={[styles.chipText, { color: colors.text }, { fontFamily: (fontBody as any) }]} numberOfLines={1}>
                              {EXPERIENCE_LABELS[l]}
                            </RNText>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    <View style={styles.filterBlock}>
                      <RNText style={[styles.filterLabel, { color: colors.text }]}>Years of experience</RNText>
                      <View style={styles.payColumn}>
                        <TextInput
                          style={[styles.payInput, { color: colors.text, borderColor: colors.icon }]}
                          placeholder="Min"
                          placeholderTextColor={colors.icon}
                          value={yearsMin}
                          onChangeText={setYearsMin}
                          keyboardType="numeric"
                        />
                        <TextInput
                          style={[styles.payInput, { color: colors.text, borderColor: colors.icon }]}
                          placeholder="Max"
                          placeholderTextColor={colors.icon}
                          value={yearsMax}
                          onChangeText={setYearsMax}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    {filtersData.company_types_list.length > 0 && (
                      <View style={styles.filterBlock}>
                        <RNText style={[styles.filterLabel, { color: colors.text }]}>Company type</RNText>
                        <View style={[styles.selectWrap, { borderColor: colors.icon }]}>
                          <select
                            value={companyType}
                            onChange={(e) => setCompanyType(e.target.value)}
                            style={{ width: '100%', padding: 10, background: colors.background, color: colors.text, border: 'none', fontFamily: fontBody, fontSize: 14 } as any}
                          >
                            <option value="">All</option>
                            {filtersData.company_types_list.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </View>
                      </View>
                    )}

                    <View style={styles.filterBlock}>
                      <RNText style={[styles.filterLabel, { color: colors.text }]}>Team size (min)</RNText>
                      <TextInput
                        style={[styles.locationInput, { color: colors.text, borderColor: colors.icon }]}
                        placeholder="e.g. 10"
                        placeholderTextColor={colors.icon}
                        value={teamSizeMin}
                        onChangeText={setTeamSizeMin}
                        keyboardType="numeric"
                      />
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

                    <View style={styles.filterBlock}>
                      <RNText style={[styles.filterLabel, { color: colors.text }]}>Sort</RNText>
                      <View style={[styles.selectWrap, { borderColor: colors.icon }]}>
                        <select
                          value={sort}
                          onChange={(e) => setSort(e.target.value)}
                          style={{ width: '100%', padding: 10, background: colors.background, color: colors.text, border: 'none', fontFamily: fontBody, fontSize: 14 } as any}
                        >
                          {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </View>
                    </View>

                    <Pressable onPress={clearFilters} style={[styles.clearBtn, { borderColor: colors.icon }]}>
                      <RNText style={[styles.clearBtnText, { color: colors.text }, { fontFamily: (fontBody as any) }]}>Clear filters</RNText>
                    </Pressable>
                    <Pressable onPress={handleApplyFilters} style={[styles.applyFiltersBtn, { backgroundColor: BRAND_BLUE }]}>
                      <RNText style={styles.applyFiltersBtnText}>Apply filters</RNText>
                    </Pressable>
                  </View>
                )}
              </View>

              <View style={styles.mainContentColumn}>
                <View style={[styles.boundaryLine, { backgroundColor: colors.icon }]} />
                <View style={styles.resultsSection}>
                  <RNText style={[styles.resultsTitle, { color: colors.text }, { fontFamily: (fontHeading as any) }]}>
                    Results
                  </RNText>
                  {loading ? (
                    <View style={styles.centered}>
                      <ActivityIndicator size="large" color={colors.tint} />
                    </View>
                  ) : loadError ? (
                    <View style={styles.centered}>
                      <RNText style={[styles.emptyText, { color: colors.text }, { fontFamily: (fontBody as any) }]}>{loadError}</RNText>
                      <Pressable onPress={() => refetch()} style={[styles.loadMore, { backgroundColor: colors.tint, marginTop: 16 }]}>
                        <RNText style={[styles.loadMoreText, { fontFamily: (fontBody as any) }]}>Retry</RNText>
                      </Pressable>
                    </View>
                  ) : results.length === 0 ? (
                    <View style={styles.centered}>
                      <RNText style={[styles.emptyText, { color: colors.text }, { fontFamily: (fontBody as any) }]}>
                        No workers or companies found.
                      </RNText>
                    </View>
                  ) : (
                    <>
                      <RNText style={[styles.resultCount, { color: colors.text }, { fontFamily: (fontBody as any) }]}>
                        {count} result{count !== 1 ? 's' : ''}
                      </RNText>
                      <FlatList
                        data={results}
                        keyExtractor={keyExtractor}
                        renderItem={renderItem}
                        scrollEnabled={false}
                        contentContainerStyle={[styles.cardGrid, isSmall && { gap: 12 }]}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.3}
                        initialNumToRender={12}
                        maxToRenderPerBatch={12}
                        windowSize={5}
                        removeClippedSubviews={Platform.OS !== 'web'}
                        ListFooterComponent={
                          hasNextPage ? (
                            <Pressable onPress={handleLoadMore} disabled={loadingMore} style={[styles.loadMore, { backgroundColor: colors.tint }]}>
                              {loadingMore ? <ActivityIndicator color="#fff" size="small" /> : <RNText style={[styles.loadMoreText, { fontFamily: (fontBody as any) }]}>Load more</RNText>}
                            </Pressable>
                          ) : null
                        }
                      />
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 } as ViewStyle,
  centerText: { marginTop: 12, fontSize: 16 } as TextStyle,
  scrollView: { flex: 1, width: '100%' } as ViewStyle,
  scrollContent: { flexGrow: 1, paddingBottom: 48 } as ViewStyle,
  container: { paddingTop: Platform.OS === 'web' ? 100 : 24, paddingBottom: 24 } as ViewStyle,
  inner: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 24 } as ViewStyle,
  innerStacked: { paddingHorizontal: 16 } as ViewStyle,
  header: { marginBottom: 24 } as ViewStyle,
  title: { fontSize: 36, fontWeight: '700', marginBottom: 16 } as TextStyle,
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, gap: 12 } as ViewStyle,
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 4, ...Platform.select({ web: { outlineStyle: 'none' as any } }) } as TextStyle,
  mainRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 } as ViewStyle,
  mainContentColumn: { flex: 1, minWidth: 0, flexDirection: 'column' } as ViewStyle,
  sidebar: { width: 280, minWidth: 280 } as ViewStyle,
  sidebarHidden: { width: '100%', minWidth: 0 } as ViewStyle,
  filterToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderRadius: 8, marginBottom: 12 } as ViewStyle,
  filtersPanel: { padding: 20, borderRadius: 12, borderWidth: 1 } as ViewStyle,
  filterTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 } as TextStyle,
  filterBlock: { marginBottom: 16 } as ViewStyle,
  filterLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 } as TextStyle,
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } as ViewStyle,
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 } as ViewStyle,
  chipText: { fontSize: 13, maxWidth: 140 } as TextStyle,
  selectWrap: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' } as ViewStyle,
  payColumn: { flexDirection: 'column', gap: 8 } as ViewStyle,
  payInput: { width: '100%', paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 8, fontSize: 14 } as TextStyle,
  locationInput: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 8, fontSize: 14 } as TextStyle,
  clearBtn: { paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderRadius: 8, marginTop: 8 } as ViewStyle,
  clearBtnText: { fontSize: 14 } as TextStyle,
  applyFiltersBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 } as ViewStyle,
  applyFiltersBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' } as TextStyle,
  boundaryLine: { width: '100%', height: 1, marginVertical: 24, opacity: 0.3 } as ViewStyle,
  resultsSection: { flex: 1, minWidth: 0 } as ViewStyle,
  resultsTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16 } as TextStyle,
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48 } as ViewStyle,
  emptyText: { fontSize: 16, textAlign: 'center' } as TextStyle,
  resultCount: { fontSize: 14, marginBottom: 16 } as TextStyle,
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 } as ViewStyle,
  loadMore: { alignSelf: 'center', marginTop: 32, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 } as ViewStyle,
  loadMoreText: { fontSize: 16, fontWeight: '600', color: '#fff' } as TextStyle,
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
