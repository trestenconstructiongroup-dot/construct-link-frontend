/**
 * Job detail page – full job display and Apply flow.
 * Uses theme (Colors, Fonts) and WebLayout.
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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import WebLayout from '../layout';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Colors, Fonts } from '../../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  getFindJobDetail,
  applyJob,
  type JobDetail,
  type JobSummaryRole,
} from '../../../services/api';

const BRAND_BLUE = Colors.light.accentMuted;
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

export default function JobDetailPage({ jobId }: { jobId: number | null }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const { token, user, isLoading: authLoading } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const isLoggedIn = !!token && !!user;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  const fontHeading = Fonts.display;
  const fontBody = Fonts.body;

  const loadJob = useCallback(async () => {
    if (!jobId) {
      setLoading(false);
      setJob(null);
      setLoadError('Invalid job.');
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getFindJobDetail(jobId, token || undefined);
      setJob(data);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Failed to load job.';
      setLoadError(errMsg);
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId, token]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const isIndividual = user?.is_worker ?? false;
  const isCompany = user?.is_company ?? false;

  const handleApply = useCallback(
    async (roleName?: string | null) => {
      if (!job || !token) return;

      if (!isLoggedIn) {
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
        setJob((prev) =>
          prev
            ? { ...prev, has_applied: res.has_applied, applications_count: res.applications_count }
            : prev
        );
        setRolePickerOpen(false);
      } catch (e: any) {
        const data = e?.data;
        const msg =
          typeof data?.detail === 'string'
            ? data.detail
            : e?.message ?? 'Failed to apply.';
        setModalMessage(msg);
      } finally {
        setApplying(false);
      }
    },
    [job, token, isLoggedIn, isIndividual, isCompany]
  );

  const handleRoleSelect = useCallback(
    (role: JobSummaryRole) => {
      setRolePickerOpen(false);
      handleApply(role.role_name);
    },
    [handleApply]
  );

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
              Sign in to view job details.
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
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { borderColor: colors.icon }]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <RNText style={[styles.backBtnText, { color: colors.text }, { fontFamily: fontBody as any }]}>
              Back
            </RNText>
          </Pressable>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : loadError ? (
            <View style={styles.center}>
              <RNText style={[styles.errorText, { color: colors.text }]}>{loadError}</RNText>
            </View>
          ) : !job ? null : (
            <View style={[styles.content, { borderColor: colors.icon + '40' }]}>
              <View style={styles.header}>
                <View style={styles.titleRow}>
                  <RNText style={[styles.title, { color: colors.text }, { fontFamily: fontHeading as any }]}>
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
                <RNText style={[styles.meta, { color: colors.icon }]}>
                  {job.posted_by_name} · {job.employer_type === 'company' ? 'Company' : 'Individual'}
                </RNText>
                <RNText style={[styles.meta, { color: colors.icon }]}>{job.location_text}</RNText>
              </View>

              {job.short_description ? (
                <RNText style={[styles.shortDesc, { color: colors.text }]}>
                  {job.short_description}
                </RNText>
              ) : null}

              {job.description ? (
                <View style={styles.section}>
                  <RNText style={[styles.sectionTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>
                    Description
                  </RNText>
                  <RNText style={[styles.bodyText, { color: colors.text }]}>
                    {job.description}
                  </RNText>
                </View>
              ) : null}

              {job.roles_required.length > 0 && (
                <View style={styles.section}>
                  <RNText style={[styles.sectionTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>
                    Roles required
                  </RNText>
                  <View style={styles.rolesRow}>
                    {job.roles_required.map((r, i) => (
                      <View key={i} style={[styles.roleChip, { backgroundColor: colors.tint + '20' }]}>
                        <RNText style={[styles.roleChipText, { color: colors.tint }, { fontFamily: fontBody as any }]}>
                          {r.role_name} ×{r.quantity}
                        </RNText>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {job.skills_required.length > 0 && (
                <View style={styles.section}>
                  <RNText style={[styles.sectionTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>
                    Skills
                  </RNText>
                  <View style={styles.skillsRow}>
                    {job.skills_required.map((s, i) => (
                      <View key={i} style={[styles.skillChip, { borderColor: colors.icon }]}>
                        <RNText style={[styles.skillChipText, { color: colors.text }, { fontFamily: fontBody as any }]}>
                          {s}
                        </RNText>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <RNText style={[styles.detailLabel, { color: colors.icon }]}>Job type</RNText>
                  <RNText style={[styles.detailValue, { color: colors.text }]}>
                    {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                  </RNText>
                </View>
                <View style={styles.detailItem}>
                  <RNText style={[styles.detailLabel, { color: colors.icon }]}>Pay</RNText>
                  <RNText style={[styles.detailValue, { color: colors.text }]}>
                    {job.pay_min || job.pay_max
                      ? `${job.currency} ${job.pay_min ?? '?'} - ${job.pay_max ?? '?'} (${PAY_TYPE_LABELS[job.pay_type] || job.pay_type})`
                      : 'Not specified'}
                  </RNText>
                </View>
                {job.start_date && (
                  <View style={styles.detailItem}>
                    <RNText style={[styles.detailLabel, { color: colors.icon }]}>Start date</RNText>
                    <RNText style={[styles.detailValue, { color: colors.text }]}>
                      {new Date(job.start_date).toLocaleDateString()}
                    </RNText>
                  </View>
                )}
                {job.application_deadline && (
                  <View style={styles.detailItem}>
                    <RNText style={[styles.detailLabel, { color: colors.icon }]}>Deadline</RNText>
                    <RNText style={[styles.detailValue, { color: colors.text }]}>
                      {new Date(job.application_deadline).toLocaleDateString()}
                    </RNText>
                  </View>
                )}
              </View>

              <View style={[styles.footer, { borderTopColor: colors.icon + '40' }]}>
                <RNText style={[styles.applicationsText, { color: colors.icon }]}>
                  {job.applications_count} application{job.applications_count !== 1 ? 's' : ''}
                </RNText>
                <Pressable
                  onPress={() => handleApply()}
                  disabled={job.has_applied || applying}
                  style={[
                    styles.applyBtn,
                    (job.has_applied || applying) && styles.applyBtnDisabled,
                    { backgroundColor: job.has_applied ? colors.icon : BRAND_BLUE },
                  ]}
                >
                  {applying ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <RNText style={[styles.applyBtnText, { fontFamily: fontBody as any }]}>
                      {job.has_applied ? 'Applied' : 'Apply'}
                    </RNText>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Message modal */}
      <Modal visible={!!modalMessage} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalMessage(null)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.icon }]}
            onPress={(e) => e.stopPropagation()}
          >
            <RNText style={[styles.modalText, { color: colors.text }]}>{modalMessage}</RNText>
            <Pressable
              onPress={() => setModalMessage(null)}
              style={[styles.modalBtn, { backgroundColor: colors.tint }]}
            >
              <RNText style={styles.modalBtnText}>OK</RNText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Role picker modal */}
      <Modal visible={rolePickerOpen} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRolePickerOpen(false)}
        >
          <Pressable
            style={[styles.modalContent, styles.rolePickerContent, { backgroundColor: colors.background, borderColor: colors.icon }]}
            onPress={(e) => e.stopPropagation()}
          >
            <RNText style={[styles.modalTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>
              Which role are you applying for?
            </RNText>
            {job?.roles_required.map((r, i) => (
              <Pressable
                key={i}
                onPress={() => handleRoleSelect(r)}
                disabled={applying}
                style={[styles.roleOption, { borderColor: colors.icon }]}
              >
                <RNText style={[styles.roleOptionText, { color: colors.text }, { fontFamily: fontBody as any }]}>
                  {r.role_name} (×{r.quantity})
                </RNText>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setRolePickerOpen(false)}
              style={[styles.modalBtn, styles.modalBtnSecondary, { borderColor: colors.icon }]}
            >
              <RNText style={[styles.modalBtnText, { color: colors.text }]}>Cancel</RNText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    maxWidth: 800,
    alignSelf: 'center',
    paddingHorizontal: 24,
  } as ViewStyle,
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    paddingVertical: 8,
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
  } as ViewStyle,
  backBtnText: {
    fontSize: 16,
  } as TextStyle,
  content: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
  } as ViewStyle,
  header: {
    marginBottom: 16,
  } as ViewStyle,
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  } as ViewStyle,
  title: {
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
  } as TextStyle,
  badges: {
    flexDirection: 'row',
    gap: 8,
  } as ViewStyle,
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  } as ViewStyle,
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  } as TextStyle,
  meta: {
    fontSize: 14,
    marginTop: 4,
  } as TextStyle,
  shortDesc: {
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 20,
  } as TextStyle,
  section: {
    marginBottom: 20,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  } as TextStyle,
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    whiteSpace: 'pre-wrap',
  } as TextStyle,
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  } as ViewStyle,
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  } as ViewStyle,
  roleChipText: {
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  } as ViewStyle,
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  } as ViewStyle,
  skillChipText: {
    fontSize: 14,
  } as TextStyle,
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    marginTop: 8,
  } as ViewStyle,
  detailItem: {},
  detailLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  } as TextStyle,
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  } as TextStyle,
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
  } as ViewStyle,
  applicationsText: {
    fontSize: 14,
  } as TextStyle,
  applyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  } as ViewStyle,
  applyBtnDisabled: {
    opacity: 0.8,
  } as ViewStyle,
  applyBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  } as TextStyle,
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  } as TextStyle,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  } as ViewStyle,
  modalContent: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 280,
  } as ViewStyle,
  rolePickerContent: {
    minWidth: 320,
  } as ViewStyle,
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  } as TextStyle,
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  } as TextStyle,
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  } as ViewStyle,
  modalBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    marginTop: 8,
  } as ViewStyle,
  modalBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  } as TextStyle,
  roleOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  } as ViewStyle,
  roleOptionText: {
    fontSize: 16,
  } as TextStyle,
  authOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  authBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' } as ViewStyle,
  authModal: { width: '90%', maxWidth: 380, borderRadius: 16, padding: 32, alignItems: 'center', ...Platform.select({ web: { boxShadow: '0 16px 48px rgba(0,0,0,0.3)' as any } }) } as ViewStyle,
  authTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 } as TextStyle,
  authDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 } as TextStyle,
  authBtn: { width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 } as ViewStyle,
  authBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' } as TextStyle,
  authBtnOutline: { width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', borderWidth: 2 } as ViewStyle,
  authBtnOutlineText: { fontSize: 16, fontWeight: '600' } as TextStyle,
});
