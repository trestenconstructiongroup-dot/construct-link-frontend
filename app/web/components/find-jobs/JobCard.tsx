/**
 * Find Jobs – job result card with apply flow. Memoized for list performance.
 */

import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    Text as RNText,
    StyleSheet,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { Colors } from '../../../../constants/theme';
import { applyJob, type JobSummary, type JobSummaryRole } from '../../../../services/api';

const BRAND_BLUE = Colors.light.accentMuted;
const PAY_TYPE_LABELS: Record<string, string> = {
  hourly: 'Hourly',
  fixed: 'Fixed',
  negotiable: 'Negotiable',
};

export interface JobCardProps {
  job: JobSummary;
  colors: typeof Colors.light | typeof Colors.dark;
  fontHeading: string;
  fontBody: string;
  token: string | null;
  user: { is_worker?: boolean; is_company?: boolean } | null;
  onApplied: (jobId: number, applications_count: number, has_applied: boolean) => void;
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 300, maxWidth: 480, padding: 20, borderRadius: 12, borderWidth: 1 } as ViewStyle,
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 } as ViewStyle,
  cardTitle: { fontSize: 18, fontWeight: '700', flex: 1 } as TextStyle,
  badges: { flexDirection: 'row', gap: 6 } as ViewStyle,
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 } as ViewStyle,
  badgeText: { fontSize: 11, fontWeight: '600', color: '#fff' } as TextStyle,
  cardDesc: { fontSize: 14, marginTop: 8, opacity: 0.9 } as TextStyle,
  cardMeta: { marginTop: 10 } as ViewStyle,
  cardMetaText: { fontSize: 13, marginBottom: 2 } as TextStyle,
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 } as ViewStyle,
  roleChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 } as ViewStyle,
  roleChipText: { fontSize: 12, fontWeight: '600' } as TextStyle,
  payText: { fontSize: 14, marginTop: 8, fontWeight: '600' } as TextStyle,
  deadlineText: { fontSize: 12, marginTop: 4 } as TextStyle,
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto' as any,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
    gap: 12,
  } as ViewStyle,
  applicationsText: { fontSize: 12 } as TextStyle,
  applyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 } as ViewStyle,
  applyBtnDisabled: { opacity: 0.8 } as ViewStyle,
  applyBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' } as TextStyle,
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 } as ViewStyle,
  modalContent: { padding: 24, borderRadius: 12, borderWidth: 1, minWidth: 280 } as ViewStyle,
  rolePickerContent: { minWidth: 320 } as ViewStyle,
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 } as TextStyle,
  modalText: { fontSize: 16, marginBottom: 20 } as TextStyle,
  modalBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center' } as ViewStyle,
  modalBtnSecondary: { backgroundColor: 'transparent', borderWidth: 1, marginTop: 8 } as ViewStyle,
  modalBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' } as TextStyle,
  roleOption: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, marginBottom: 8 } as ViewStyle,
  roleOptionText: { fontSize: 16 } as TextStyle,
});

function JobCardComponent({
  job,
  colors,
  fontHeading,
  fontBody,
  token,
  user,
  onApplied,
}: JobCardProps) {
  const router = useRouter();
  const [applying, setApplying] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

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
      } catch (e: unknown) {
        const err = e as { data?: { detail?: string }; message?: string };
        const msg = typeof err?.data?.detail === 'string' ? err.data.detail : err?.message ?? 'Failed to apply.';
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

  const handleViewJob = useCallback(() => {
    router.push(`/jobs/${job.job_id}`);
  }, [router, job.job_id]);

  const payLabel =
    job.pay_min || job.pay_max
      ? `${job.currency} ${job.pay_min ?? '?'} - ${job.pay_max ?? '?'} (${PAY_TYPE_LABELS[job.pay_type] || job.pay_type})`
      : 'Pay not specified';

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.icon + '40' }]}>
        <Pressable onPress={handleViewJob} style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}>
          <View style={styles.cardHeader}>
            <RNText style={[styles.cardTitle, { color: colors.text }, { fontFamily: fontHeading as any }]} numberOfLines={2}>
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
                  <RNText style={[styles.roleChipText, { color: colors.tint }, { fontFamily: fontBody as any }]}>
                    {r.role_name} ×{r.quantity}
                  </RNText>
                </View>
              ))}
            </View>
          )}
          <RNText style={[styles.payText, { color: colors.text }]}>{payLabel}</RNText>
          {job.application_deadline && (
            <RNText style={[styles.deadlineText, { color: colors.icon }]}>
              Deadline: {new Date(job.application_deadline).toLocaleDateString()}
            </RNText>
          )}
        </Pressable>
        <View style={styles.cardFooter}>
          <RNText style={[styles.applicationsText, { color: colors.icon }]}>
            {job.applications_count} application{job.applications_count !== 1 ? 's' : ''}
          </RNText>
          <Pressable
            onPress={() => handleApply()}
            style={[styles.applyBtn, job.has_applied && styles.applyBtnDisabled, { backgroundColor: job.has_applied ? colors.icon : '#F99324' }]}
            disabled={job.has_applied || applying}
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
            <RNText style={[styles.modalTitle, { color: colors.text }, { fontFamily: fontHeading as any }]}>
              Which role are you applying for?
            </RNText>
            {job.roles_required.map((r, i) => (
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
            <Pressable onPress={() => setRolePickerOpen(false)} style={[styles.modalBtn, styles.modalBtnSecondary, { borderColor: colors.icon }]}>
              <RNText style={[styles.modalBtnText, { color: colors.text }]}>Cancel</RNText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default React.memo(JobCardComponent);
