/**
 * Mobile Jobs page – lists published jobs with filters (search, skills, roles, job type, pay, location).
 * Auth required; shows loading, error, empty, and list + Load more.
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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/theme';
import { Text } from '../../components/Text';
import {
  findJobs,
  getFindJobsFilters,
  applyJob,
  type JobSummary,
  type JobSummaryRole,
  type FindJobsFilters as FindJobsFiltersType,
} from '../../services/api';

const PAGE_SIZE = 12;
const BRAND_BLUE = '#0a7ea4';
const JOB_TYPES = ['one_time', 'short_project', 'long_term'] as const;
const JOB_TYPE_LABELS: Record<string, string> = {
  one_time: 'One-time Task',
  short_project: 'Short Project',
  long_term: 'Long-term Engagement',
};
const PAY_TYPE_LABELS: Record<string, string> = {
  hourly: 'Hourly',
  fixed: 'Fixed',
  negotiable: 'Negotiable',
};

function JobCard({
  job,
  colors,
  token,
  user,
  onApplied,
}: {
  job: JobSummary;
  colors: typeof Colors.light;
  token: string | null;
  user: { is_worker?: boolean; is_company?: boolean } | null;
  onApplied: (jobId: number, applications_count: number, has_applied: boolean) => void;
}) {
  const router = useRouter();
  const [applying, setApplying] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  const isLoggedIn = !!token && !!user;
  const isIndividual = user?.is_worker ?? false;
  const isCompany = user?.is_company ?? false;

  const handleApply = useCallback(
    async (roleName?: string | null) => {
      if (!token) {
        setModalMessage('You must log in to apply for jobs.');
        return;
      }
      if (job.has_applied) return;
      if (isIndividual && !job.accepts_individual_workers) {
        setModalMessage('This job is only accepting companies.');
        return;
      }
      if (isCompany && !job.accepts_companies) {
        setModalMessage('This job is only accepting individual workers.');
        return;
      }
      const roles = job.roles_required || [];
      if (isIndividual && roles.length > 1 && !roleName) {
        setRolePickerOpen(true);
        return;
      }
      setApplying(true);
      try {
        const res = await applyJob(token, job.job_id, roleName || undefined);
        onApplied(job.job_id, res.applications_count, res.has_applied);
        setRolePickerOpen(false);
      } catch (e: any) {
        const data = e?.data;
        const msg = typeof data?.detail === 'string' ? data.detail : e?.message ?? 'Failed to apply.';
        setModalMessage(msg);
      } finally {
        setApplying(false);
      }
    },
    [token, job, isIndividual, isCompany, onApplied]
  );

  const handleRoleSelect = useCallback(
    (role: JobSummaryRole) => {
      setRolePickerOpen(false);
      handleApply(role.role_name);
    },
    [handleApply]
  );

  const payLabel =
    job.pay_min || job.pay_max
      ? `${job.currency} ${job.pay_min ?? '?'} - ${job.pay_max ?? '?'} (${PAY_TYPE_LABELS[job.pay_type] || job.pay_type})`
      : 'Pay not specified';

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.icon + '40' }]}>
        <Pressable
          onPress={() => router.push(`/jobs/${job.job_id}`)}
          style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}
        >
          <View style={styles.cardHeader}>
            <RNText style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
              {job.title}
            </RNText>
            <View style={styles.badges}>
              {job.is_new && (
                <View style={[styles.badge, { backgroundColor: BRAND_BLUE }]}>
                  <RNText style={styles.badgeText}>New</RNText>
                </View>
              )}
              {job.is_hot && (
                <View style={[styles.badge, { backgroundColor: '#e11' }]}>
                  <RNText style={styles.badgeText}>Hot</RNText>
                </View>
              )}
            </View>
          </View>
          {job.short_description ? (
            <RNText style={[styles.cardDesc, { color: colors.text }]} numberOfLines={2}>
              {job.short_description}
            </RNText>
          ) : null}
          <View style={styles.cardMeta}>
            <RNText style={[styles.cardMetaText, { color: colors.icon }]}>
              {job.posted_by_name} · {job.employer_type === 'company' ? 'Company' : 'Individual'}
            </RNText>
            <RNText style={[styles.cardMetaText, { color: colors.icon }]}>{job.location_text}</RNText>
          </View>
          {job.roles_required.length > 0 && (
            <View style={styles.rolesRow}>
              {job.roles_required.slice(0, 3).map((r, i) => (
                <View key={i} style={[styles.roleChip, { backgroundColor: colors.tint + '20' }]}>
                  <RNText style={[styles.roleChipText, { color: colors.tint }]}>
                    {r.role_name} ×{r.quantity}
                  </RNText>
                </View>
              ))}
            </View>
          )}
          <RNText style={[styles.payText, { color: colors.text }]}>{payLabel}</RNText>
          {job.application_deadline ? (
            <RNText style={[styles.deadlineText, { color: colors.icon }]}>
              Deadline: {new Date(job.application_deadline).toLocaleDateString()}
            </RNText>
          ) : null}
        </Pressable>
        <View style={[styles.cardFooter, { borderTopColor: colors.icon + '30' }]}>
          <RNText style={[styles.applicationsText, { color: colors.icon }]}>
            {job.applications_count} application{job.applications_count !== 1 ? 's' : ''}
          </RNText>
          <Pressable
            onPress={() => handleApply()}
            style={[
              styles.applyBtn,
              job.has_applied && styles.applyBtnDisabled,
              { backgroundColor: job.has_applied ? colors.icon : BRAND_BLUE },
            ]}
            disabled={job.has_applied || applying}
          >
            {applying ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <RNText style={styles.applyBtnText}>
                {job.has_applied ? 'Applied' : 'Apply'}
              </RNText>
            )}
          </Pressable>
        </View>
      </View>

      <Modal visible={!!modalMessage} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalMessage(null)}>
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.icon }]}
            onPress={(e) => e.stopPropagation()}
          >
            <RNText style={[styles.modalText, { color: colors.text }]}>{modalMessage}</RNText>
            <Pressable onPress={() => setModalMessage(null)} style={[styles.modalBtn, { backgroundColor: colors.tint }]}>
              <RNText style={styles.modalBtnText}>OK</RNText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={rolePickerOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setRolePickerOpen(false)}>
          <Pressable
            style={[styles.modalContent, styles.rolePickerContent, { backgroundColor: colors.background, borderColor: colors.icon }]}
            onPress={(e) => e.stopPropagation()}
          >
            <RNText style={[styles.modalTitle, { color: colors.text }]}>
              Which role are you applying for?
            </RNText>
            {job.roles_required.map((r, i) => (
              <Pressable
                key={i}
                onPress={() => handleRoleSelect(r)}
                disabled={applying}
                style={[styles.roleOption, { borderColor: colors.icon }]}
              >
                <RNText style={[styles.roleOptionText, { color: colors.text }]}>
                  {r.role_name} (×{r.quantity})
                </RNText>
              </Pressable>
            ))}
            <Pressable onPress={() => setRolePickerOpen(false)} style={[styles.modalBtn, styles.modalBtnSecondary, { borderColor: colors.icon }]}>
              <RNText style={[styles.modalBtnText, { color: colors.text }]}>Cancel</RNText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default function JobsPage() {
  const { isDark } = useTheme();
  const { token, user, isLoading: authLoading } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [filtersData, setFiltersData] = useState<FindJobsFiltersType | null>(null);
  const [results, setResults] = useState<JobSummary[]>([]);
  const [count, setCount] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [jobType, setJobType] = useState<string>('');
  const [payMin, setPayMin] = useState<string>('');
  const [payMax, setPayMax] = useState<string>('');
  const [location, setLocation] = useState('');

  const isLoggedIn = !!token && !!user;

  const loadFilters = useCallback(async () => {
    try {
      const data = await getFindJobsFilters();
      setFiltersData(data);
    } catch {
      setFiltersData({
        skills_list: [],
        roles_list: [],
        job_types: [],
        pay_range_min: 0,
        pay_range_max: 0,
        location_suggestions: [],
      });
    }
  }, []);

  const loadJobs = useCallback(
    async (
      pageNum: number,
      append: boolean,
      getCancelled?: () => boolean,
      isRefresh?: boolean,
    ) => {
      if (pageNum === 1 && !append && !isRefresh) setLoading(true);
      else if (!isRefresh) setLoadingMore(true);
      setLoadError(null);
      try {
        const params = {
          search: search || undefined,
          skills: selectedSkills.length ? selectedSkills.join(',') : undefined,
          roles: selectedRoles.length ? selectedRoles.join(',') : undefined,
          job_type: jobType || undefined,
          pay_min: payMin ? Number(payMin) : undefined,
          pay_max: payMax ? Number(payMax) : undefined,
          location: location || undefined,
          page: pageNum,
          page_size: PAGE_SIZE,
        };
        const res = await findJobs(params, token || undefined);
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
        setLoadError(e instanceof Error ? e.message : 'Failed to load jobs.');
      } finally {
        if (!getCancelled?.()) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [
      token,
      search,
      selectedSkills,
      selectedRoles,
      jobType,
      payMin,
      payMax,
      location,
    ],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadJobs(1, false, undefined, true);
  }, [loadJobs]);

  const toggleSkill = (s: string) => {
    setSelectedSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };
  const toggleRole = (r: string) => {
    setSelectedRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  };
  const clearFilters = () => {
    setSelectedSkills([]);
    setSelectedRoles([]);
    setJobType('');
    setPayMin('');
    setPayMax('');
    setLocation('');
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    loadFilters();
  }, [loadFilters, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    loadJobs(1, false, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadJobs, isLoggedIn]);

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
          You need to be logged in to view jobs.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Jobs</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Browse and apply to construction jobs
        </Text>
      </View>
      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <Ionicons name="search" size={20} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by title, description, or location..."
          placeholderTextColor={colors.icon}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {/* Filters toggle */}
      <Pressable
        onPress={() => setFiltersOpen((o) => !o)}
        style={[styles.filterToggle, { borderColor: colors.icon }]}
      >
        <RNText style={[styles.filterToggleText, { color: colors.text }]}>Filters</RNText>
        <Ionicons name={filtersOpen ? 'chevron-up' : 'chevron-down'} size={22} color={colors.text} />
      </Pressable>
      {/* Collapsible filter panel */}
      {filtersOpen && (
        <View style={[styles.filtersPanel, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.icon + '40' }]}>
          {!filtersData ? (
            <View style={styles.filterLoading}>
              <ActivityIndicator size="small" color={colors.tint} />
              <RNText style={[styles.filterLoadingText, { color: colors.icon }]}>Loading filter options…</RNText>
            </View>
          ) : (
        <>
          {filtersData.skills_list.length > 0 && (
            <View style={styles.filterBlock}>
              <RNText style={[styles.filterLabel, { color: colors.icon }]}>Skills</RNText>
              <View style={styles.chipRow}>
                {filtersData.skills_list.slice(0, 12).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => toggleSkill(s)}
                    style={[
                      styles.chip,
                      selectedSkills.includes(s) && { backgroundColor: BRAND_BLUE, opacity: 1 },
                      { borderColor: colors.icon },
                    ]}
                  >
                    <RNText style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>{s}</RNText>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          {filtersData.roles_list.length > 0 && (
            <View style={styles.filterBlock}>
              <RNText style={[styles.filterLabel, { color: colors.icon }]}>Roles</RNText>
              <View style={styles.chipRow}>
                {filtersData.roles_list.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => toggleRole(r)}
                    style={[
                      styles.chip,
                      selectedRoles.includes(r) && { backgroundColor: BRAND_BLUE, opacity: 1 },
                      { borderColor: colors.icon },
                    ]}
                  >
                    <RNText style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>{r}</RNText>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          <View style={styles.filterBlock}>
            <RNText style={[styles.filterLabel, { color: colors.icon }]}>Job type</RNText>
            <View style={styles.jobTypeRow}>
              {JOB_TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setJobType((prev) => (prev === t ? '' : t))}
                  style={[
                    styles.jobTypeChip,
                    jobType === t && { backgroundColor: BRAND_BLUE },
                    { borderColor: colors.icon },
                  ]}
                >
                  <RNText style={[styles.jobTypeChipText, { color: jobType === t ? '#fff' : colors.text }]} numberOfLines={1}>
                    {JOB_TYPE_LABELS[t]}
                  </RNText>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.filterBlock}>
            <RNText style={[styles.filterLabel, { color: colors.icon }]}>Pay range</RNText>
            <View style={styles.payRow}>
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
          <Pressable
            onPress={() => loadJobs(1, false)}
            style={[styles.applyFiltersBtn, { backgroundColor: BRAND_BLUE }]}
          >
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : loadError ? (
          <View style={styles.centered}>
            <RNText style={[styles.emptyText, { color: colors.text }]}>{loadError}</RNText>
            <Pressable
              onPress={() => loadJobs(1, false)}
              style={[styles.loadMore, { backgroundColor: colors.tint }]}
            >
              <RNText style={styles.loadMoreText}>Retry</RNText>
            </Pressable>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.centered}>
            <RNText style={[styles.emptyText, { color: colors.text }]}>No jobs yet.</RNText>
          </View>
        ) : (
          <>
            <RNText style={[styles.resultCount, { color: colors.text }]}>
              {count} job{count !== 1 ? 's' : ''}
            </RNText>
            {results.map((job) => (
              <JobCard
                key={job.job_id}
                job={job}
                colors={colors}
                token={token}
                user={user}
                onApplied={(jobId, applications_count, has_applied) => {
                  setResults((prev) =>
                    prev.map((j) =>
                      j.job_id === jobId ? { ...j, applications_count, has_applied } : j
                    )
                  );
                }}
              />
            ))}
            {nextPage != null ? (
              <Pressable
                onPress={() => loadJobs(nextPage, true)}
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
  container: {
    flex: 1,
    paddingTop: 80,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
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
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 4,
  },
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
  filterToggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filtersPanel: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  filterBlock: {
    marginBottom: 14,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  jobTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  jobTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  jobTypeChipText: {
    fontSize: 14,
  },
  payRow: {
    flexDirection: 'row',
    gap: 10,
  },
  payInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 14,
  },
  locationInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 14,
  },
  clearBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  clearBtnText: {
    fontSize: 14,
  },
  applyFiltersBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyFiltersBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  filterLoadingText: {
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  resultCount: {
    fontSize: 14,
    marginBottom: 16,
  },
  loadMore: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  cardDesc: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.9,
  },
  cardMeta: {
    marginTop: 10,
  },
  cardMetaText: {
    fontSize: 13,
    marginBottom: 2,
  },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  payText: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
  deadlineText: {
    fontSize: 12,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  applicationsText: {
    fontSize: 12,
  },
  applyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  applyBtnDisabled: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 280,
    maxWidth: '90%',
  },
  rolePickerContent: {
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    marginTop: 8,
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  roleOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  roleOptionText: {
    fontSize: 16,
  },
});
