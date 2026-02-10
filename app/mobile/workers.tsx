/**
 * Mobile Find Workers page – search individuals and companies with filters.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text as RNText,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/theme';
import { Text } from '../../components/Text';
import {
  findWorkers,
  getFindWorkersFilters,
  type WorkerSearchResult,
  type WorkerSearchResultIndividual,
  type WorkerSearchResultCompany,
  type FindWorkersFilters as FindWorkersFiltersType,
} from '../../services/api';

const PAGE_SIZE = 12;
const BRAND_BLUE = Colors.light.accentMuted;
const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'expert', 'master'] as const;
const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Expert',
  master: 'Master',
};
const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently updated' },
  { value: 'experience', label: 'Most experienced' },
];

function isIndividual(r: WorkerSearchResult): r is WorkerSearchResultIndividual {
  return r.type === 'individual';
}

function IndividualCard({
  item,
  colors,
  onView,
}: {
  item: WorkerSearchResultIndividual;
  colors: typeof Colors.light;
  onView: () => void;
}) {
  const rateLabel = item.hourly_rate || item.daily_rate ? `Rate: ${item.hourly_rate || item.daily_rate || '—'}` : 'Contact for rate';
  const expLabel = item.experience_years != null
    ? `${EXPERIENCE_LABELS[item.experience_level] || item.experience_level} · ${item.experience_years} yrs`
    : (EXPERIENCE_LABELS[item.experience_level] || item.experience_level || '—');
  return (
    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.icon + '40' }]}>
      <Pressable onPress={onView} style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}>
        <View style={styles.cardHeader}>
          {item.profile_image ? (
            <Image source={{ uri: item.profile_image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.icon + '30' }]}>
              <Ionicons name="person" size={32} color={colors.icon} />
            </View>
          )}
          <View style={styles.cardHeaderText}>
            <RNText style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.name}</RNText>
            {item.primary_category ? <RNText style={[styles.cardSubtitle, { color: colors.icon }]}>{item.primary_category}</RNText> : null}
          </View>
        </View>
        {item.tagline ? <RNText style={[styles.cardDesc, { color: colors.text }]} numberOfLines={2}>{item.tagline}</RNText> : null}
        {item.top_skills.length > 0 && (
          <View style={styles.skillsRow}>
            {item.top_skills.slice(0, 4).map((s, i) => (
              <View key={i} style={[styles.skillChip, { backgroundColor: colors.tint + '20' }]}>
                <RNText style={[styles.skillChipText, { color: colors.tint }]} numberOfLines={1}>{s}</RNText>
              </View>
            ))}
          </View>
        )}
        <RNText style={[styles.cardMeta, { color: colors.icon }]}>{expLabel}</RNText>
        <RNText style={[styles.cardMeta, { color: colors.text }]}>{rateLabel}</RNText>
        {item.location ? <RNText style={[styles.cardMeta, { color: colors.icon }]}>{item.location}</RNText> : null}
      </Pressable>
      <View style={[styles.cardFooter, { borderTopColor: colors.icon + '30' }]}>
        <Pressable onPress={onView} style={[styles.viewBtn, { borderColor: colors.tint }]}>
          <RNText style={[styles.viewBtnText, { color: colors.tint }]}>View Profile</RNText>
        </Pressable>
        <Pressable style={[styles.contactBtn, { backgroundColor: BRAND_BLUE }]}>
          <RNText style={styles.contactBtnText}>Hire / Contact</RNText>
        </Pressable>
      </View>
    </View>
  );
}

function CompanyCard({
  item,
  colors,
  onView,
}: {
  item: WorkerSearchResultCompany;
  colors: typeof Colors.light;
  onView: () => void;
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.icon + '40' }]}>
      <Pressable onPress={onView} style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}>
        <View style={styles.cardHeader}>
          {item.company_logo ? (
            <Image source={{ uri: item.company_logo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.icon + '30' }]}>
              <Ionicons name="business" size={32} color={colors.icon} />
            </View>
          )}
          <View style={styles.cardHeaderText}>
            <RNText style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.company_name}</RNText>
            {item.company_type.length > 0 ? <RNText style={[styles.cardSubtitle, { color: colors.icon }]}>{item.company_type.join(', ')}</RNText> : null}
          </View>
        </View>
        {item.tagline ? <RNText style={[styles.cardDesc, { color: colors.text }]} numberOfLines={2}>{item.tagline}</RNText> : null}
        {item.services_offered.length > 0 && (
          <View style={styles.skillsRow}>
            {item.services_offered.slice(0, 4).map((s, i) => (
              <View key={i} style={[styles.skillChip, { backgroundColor: colors.tint + '20' }]}>
                <RNText style={[styles.skillChipText, { color: colors.tint }]} numberOfLines={1}>{s}</RNText>
              </View>
            ))}
          </View>
        )}
        {item.team_size != null && <RNText style={[styles.cardMeta, { color: colors.icon }]}>{item.team_size}+ workers</RNText>}
        {item.location ? <RNText style={[styles.cardMeta, { color: colors.icon }]}>{item.location}</RNText> : null}
      </Pressable>
      <View style={[styles.cardFooter, { borderTopColor: colors.icon + '30' }]}>
        <Pressable onPress={onView} style={[styles.viewBtn, { borderColor: colors.tint }]}>
          <RNText style={[styles.viewBtnText, { color: colors.tint }]}>View Company</RNText>
        </Pressable>
        <Pressable style={[styles.contactBtn, { backgroundColor: BRAND_BLUE }]}>
          <RNText style={styles.contactBtnText}>Hire / Contact</RNText>
        </Pressable>
      </View>
    </View>
  );
}

export default function WorkersPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { token, user, isLoading: authLoading } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [filtersData, setFiltersData] = useState<FindWorkersFiltersType | null>(null);
  const [results, setResults] = useState<WorkerSearchResult[]>([]);
  const [count, setCount] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const isLoggedIn = !!token && !!user;

  const loadFilters = useCallback(async () => {
    try {
      const data = await getFindWorkersFilters();
      setFiltersData(data);
    } catch {
      setFiltersData({
        skills_list: [],
        categories_list: [],
        company_types_list: [],
        location_suggestions: [],
      });
    }
  }, []);

  const loadWorkers = useCallback(
    async (pageNum: number, append: boolean, getCancelled?: () => boolean, isRefresh?: boolean) => {
      if (pageNum === 1 && !append && !isRefresh) setLoading(true);
      else if (!isRefresh) setLoadingMore(true);
      setLoadError(null);
      try {
        const params: Record<string, unknown> = {
          page: pageNum,
          page_size: PAGE_SIZE,
          type: resultType,
          sort,
        };
        if (search) params.search = search;
        if (selectedSkills.length) params.skills = selectedSkills.join(',');
        if (category) params.category = category;
        if (experienceLevel) params.experience_level = experienceLevel;
        if (yearsMin) params.years_min = Number(yearsMin);
        if (yearsMax) params.years_max = Number(yearsMax);
        if (location) params.location = location;
        if (companyType) params.company_type = companyType;
        if (teamSizeMin) params.team_size_min = Number(teamSizeMin);
        const res = await findWorkers(params as any, token || undefined);
        if (getCancelled?.()) return;
        const list = Array.isArray(res?.results) ? res.results : [];
        const total = typeof res?.count === 'number' ? res.count : 0;
        const next = res?.next ?? null;
        if (append) {
          setResults((prev) => [...prev, ...list]);
        } else {
          setResults(list);
        }
        setCount(total);
        setNextPage(next);
      } catch (e) {
        if (getCancelled?.()) return;
        if (!append) setResults([]);
        setLoadError(e instanceof Error ? e.message : 'Failed to load workers.');
      } finally {
        if (!getCancelled?.()) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [token, search, resultType, selectedSkills, category, experienceLevel, yearsMin, yearsMax, location, companyType, teamSizeMin, sort]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWorkers(1, false, undefined, true);
  }, [loadWorkers]);

  const toggleSkill = (s: string) => {
    setSelectedSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };
  const clearFilters = () => {
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
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    loadFilters();
  }, [loadFilters, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    loadWorkers(1, false, () => cancelled);
    return () => { cancelled = true; };
  }, [loadWorkers, isLoggedIn]);

  if (authLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading…</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          You need to be logged in to view workers.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Find Workers</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Search individuals and companies
        </Text>
      </View>
      <View style={[styles.searchRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <Ionicons name="search" size={20} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by name, skill, category..."
          placeholderTextColor={colors.icon}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <Pressable
        onPress={() => setFiltersOpen((o) => !o)}
        style={[styles.filterToggle, { borderColor: colors.icon }]}
      >
        <RNText style={[styles.filterToggleText, { color: colors.text }]}>Filters</RNText>
        <Ionicons name={filtersOpen ? 'chevron-up' : 'chevron-down'} size={22} color={colors.text} />
      </Pressable>
      {filtersOpen && (
        <View style={[styles.filtersPanel, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.icon + '40' }]}>
          {!filtersData ? (
            <View style={styles.filterLoading}>
              <ActivityIndicator size="small" color={colors.tint} />
              <RNText style={[styles.filterLoadingText, { color: colors.icon }]}>Loading filter options…</RNText>
            </View>
          ) : (
            <>
              <View style={styles.filterBlock}>
                <RNText style={[styles.filterLabel, { color: colors.icon }]}>Type</RNText>
                <View style={styles.chipRow}>
                  {(['all', 'individual', 'company'] as const).map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setResultType(t)}
                      style={[styles.chip, resultType === t && { backgroundColor: BRAND_BLUE }, { borderColor: colors.icon }]}
                    >
                      <RNText style={[styles.chipText, { color: colors.text }]}>
                        {t === 'all' ? 'All' : t === 'individual' ? 'Workers' : 'Companies'}
                      </RNText>
                    </Pressable>
                  ))}
                </View>
              </View>
              {filtersData.skills_list.length > 0 && (
                <View style={styles.filterBlock}>
                  <RNText style={[styles.filterLabel, { color: colors.icon }]}>Skills</RNText>
                  <View style={styles.chipRow}>
                    {filtersData.skills_list.slice(0, 10).map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => toggleSkill(s)}
                        style={[styles.chip, selectedSkills.includes(s) && { backgroundColor: BRAND_BLUE }, { borderColor: colors.icon }]}
                      >
                        <RNText style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>{s}</RNText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
              <View style={styles.filterBlock}>
                <RNText style={[styles.filterLabel, { color: colors.icon }]}>Experience</RNText>
                <View style={styles.chipRow}>
                  {EXPERIENCE_LEVELS.map((l) => (
                    <Pressable
                      key={l}
                      onPress={() => setExperienceLevel(experienceLevel === l ? '' : l)}
                      style={[styles.chip, experienceLevel === l && { backgroundColor: BRAND_BLUE }, { borderColor: colors.icon }]}
                    >
                      <RNText style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>{EXPERIENCE_LABELS[l]}</RNText>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.filterBlock}>
                <RNText style={[styles.filterLabel, { color: colors.icon }]}>Years</RNText>
                <View style={styles.payRow}>
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
              <View style={styles.filterBlock}>
                <RNText style={[styles.filterLabel, { color: colors.icon }]}>Location</RNText>
                <TextInput
                  style={[styles.locationInput, { color: colors.text, borderColor: colors.icon }]}
                  placeholder="City or region"
                  placeholderTextColor={colors.icon}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
              <Pressable onPress={clearFilters} style={[styles.clearBtn, { borderColor: colors.icon }]}>
                <RNText style={[styles.clearBtnText, { color: colors.text }]}>Clear filters</RNText>
              </Pressable>
              <Pressable onPress={() => loadWorkers(1, false)} style={[styles.applyFiltersBtn, { backgroundColor: BRAND_BLUE }]}>
                <RNText style={styles.applyFiltersBtnText}>Apply filters</RNText>
              </Pressable>
            </>
          )}
        </View>
      )}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : loadError ? (
          <View style={styles.centered}>
            <RNText style={[styles.emptyText, { color: colors.text }]}>{loadError}</RNText>
            <Pressable onPress={() => loadWorkers(1, false)} style={[styles.loadMore, { backgroundColor: colors.tint }]}>
              <RNText style={styles.loadMoreText}>Retry</RNText>
            </Pressable>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.centered}>
            <RNText style={[styles.emptyText, { color: colors.text }]}>No workers or companies found.</RNText>
          </View>
        ) : (
          <>
            <RNText style={[styles.resultCount, { color: colors.text }]}>
              {count} result{count !== 1 ? 's' : ''}
            </RNText>
            {results.map((item) =>
              isIndividual(item) ? (
                <IndividualCard
                  key={`i-${item.user_id}`}
                  item={item}
                  colors={colors}
                  onView={() => router.push(`/workers/${item.user_id}`)}
                />
              ) : (
                <CompanyCard
                  key={`c-${item.user_id}`}
                  item={item}
                  colors={colors}
                  onView={() => router.push(`/workers/${item.user_id}`)}
                />
              )
            )}
            {nextPage != null ? (
              <Pressable
                onPress={() => loadWorkers(nextPage, true)}
                disabled={loadingMore}
                style={[styles.loadMore, { backgroundColor: colors.tint }]}
              >
                {loadingMore ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <RNText style={styles.loadMoreText}>Load more</RNText>
                )}
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 80 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 4 },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  filterToggleText: { fontSize: 16, fontWeight: '600' },
  filtersPanel: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  filterBlock: { marginBottom: 14 },
  filterLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 13 },
  payRow: { flexDirection: 'row', gap: 10 },
  payInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 8, fontSize: 14 },
  locationInput: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 8, fontSize: 14 },
  clearBtn: { paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderRadius: 8, marginTop: 4, marginBottom: 10 },
  clearBtnText: { fontSize: 14 },
  applyFiltersBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  applyFiltersBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  filterLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  filterLoadingText: { fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  centered: { justifyContent: 'center', alignItems: 'center', paddingVertical: 48 },
  loadingText: { marginTop: 12, fontSize: 16 },
  emptyText: { fontSize: 16, textAlign: 'center' },
  resultCount: { fontSize: 14, marginBottom: 16 },
  loadMore: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 16, marginBottom: 8 },
  loadMoreText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  card: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  cardHeaderText: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardSubtitle: { fontSize: 13, marginTop: 2 },
  cardDesc: { fontSize: 14, marginTop: 8, opacity: 0.9 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  skillChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  skillChipText: { fontSize: 12, fontWeight: '600' },
  cardMeta: { fontSize: 13, marginTop: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  viewBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  viewBtnText: { fontSize: 14, fontWeight: '600' },
  contactBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  contactBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
