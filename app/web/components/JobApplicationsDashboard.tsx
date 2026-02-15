/**
 * Manage Applications dashboard – company-side view of applicants per job.
 * Split-panel layout: left = company's jobs list, right = applicants for selected job.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
  Text as RNText,
  Modal,
} from 'react-native';
import { Colors, Fonts } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  useJobApplications,
  useUpdateApplicationStatus,
} from '../../../hooks/useApplications';
import { useGetOrCreateConversation } from '../../../hooks/useMessaging';
import {
  listMyJobs,
  type Job,
  type ApplicationItem,
  type ApplicationStatus,
} from '../../../services/api';
import WebLayout from '../layout';
import LandingFooter from './landing/LandingFooter';

const BRAND_BLUE = Colors.light.accentMuted;

const STATUS_COLORS: Record<string, string> = {
  pending: '#6b7280',
  reviewed: '#3b82f6',
  shortlisted: '#f59e0b',
  accepted: '#22c55e',
  rejected: '#ef4444',
  withdrawn: '#9ca3af',
};

const STATUS_FILTER_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
];

function StatusBadge({ status, fontBody }: { status: ApplicationStatus; fontBody: string }) {
  const bg = STATUS_COLORS[status] || '#6b7280';
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg + '20' }]}>
      <RNText style={[styles.statusBadgeText, { color: bg, fontFamily: fontBody as any }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </RNText>
    </View>
  );
}

export default function JobApplicationsDashboard() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { token, user, isLoading: authLoading } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const isSmall = width < 768;
  const isLoggedIn = !!token && !!user;

  const fontHeading = Fonts.display;
  const fontBody = Fonts.body;

  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showJobList, setShowJobList] = useState(true); // for mobile toggle
  const [coverLetterModal, setCoverLetterModal] = useState<ApplicationItem | null>(null);

  // Load company's jobs
  useEffect(() => {
    if (!token || !isLoggedIn) return;
    setJobsLoading(true);
    listMyJobs(token)
      .then((jobs) => {
        // Only show published/closed jobs (not drafts)
        const visible = jobs.filter((j) => j.status !== 'draft');
        setMyJobs(visible);
        if (visible.length > 0 && !selectedJobId) {
          setSelectedJobId(visible[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setJobsLoading(false));
  }, [token, isLoggedIn]);

  const { data: applicantsData, isLoading: applicantsLoading, refetch: refetchApplicants } =
    useJobApplications(token, selectedJobId, {
      status: statusFilter || undefined,
    });

  const updateStatusMutation = useUpdateApplicationStatus();
  const getOrCreateConv = useGetOrCreateConversation();

  const handleStatusChange = useCallback(
    async (applicationId: number, newStatus: ApplicationStatus) => {
      if (!token) return;
      try {
        await updateStatusMutation.mutateAsync({ token, applicationId, newStatus });
        refetchApplicants();
      } catch {
        // error handled by mutation
      }
    },
    [token, updateStatusMutation, refetchApplicants],
  );

  const handleMessage = useCallback(
    async (applicantId: number) => {
      if (!token) return;
      try {
        const conv = await getOrCreateConv.mutateAsync({ token, otherUserId: applicantId });
        router.push(`/messages?conv=${conv.id}`);
      } catch {
        // error
      }
    },
    [token, getOrCreateConv, router],
  );

  const handleSelectJob = useCallback(
    (jobId: number) => {
      setSelectedJobId(jobId);
      setStatusFilter('');
      if (isSmall) setShowJobList(false);
    },
    [isSmall],
  );

  if (authLoading) {
    return (
      <WebLayout>
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </WebLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <WebLayout>
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Ionicons name="lock-closed-outline" size={36} color={colors.tint} style={{ marginBottom: 12 }} />
          <RNText style={[styles.authTitle, { color: colors.text }]}>Sign in required</RNText>
          <RNText style={[styles.authDesc, { color: colors.icon }]}>
            Sign in to manage job applications.
          </RNText>
          <Pressable style={[styles.authBtn, { backgroundColor: BRAND_BLUE }]} onPress={() => router.push('/login')}>
            <RNText style={styles.authBtnText}>Sign In</RNText>
          </Pressable>
        </View>
      </WebLayout>
    );
  }

  const applicants = applicantsData?.results ?? [];
  const selectedJob = myJobs.find((j) => j.id === selectedJobId);

  // ---- Desktop split-panel layout ----
  const renderJobList = () => (
    <ScrollView style={[styles.jobListPanel, isSmall ? { width: '100%' } : { borderRightWidth: 1, borderRightColor: colors.icon + '30' }]}>
      {jobsLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : myJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={40} color={colors.icon} />
          <RNText style={[styles.emptyText, { color: colors.icon }]}>No jobs posted yet.</RNText>
        </View>
      ) : (
        myJobs.map((job) => {
          const isActive = job.id === selectedJobId;
          return (
            <Pressable
              key={job.id}
              onPress={() => handleSelectJob(job.id)}
              style={[
                styles.jobListItem,
                { borderBottomColor: colors.icon + '20' },
                isActive && { backgroundColor: BRAND_BLUE + '12' },
              ]}
            >
              <RNText
                style={[styles.jobListTitle, { color: isActive ? BRAND_BLUE : colors.text, fontFamily: fontHeading as any }]}
                numberOfLines={1}
              >
                {job.job_title}
              </RNText>
              <RNText style={[styles.jobListMeta, { color: colors.icon }]}>
                {job.status === 'published' ? 'Active' : job.status.charAt(0).toUpperCase() + job.status.slice(1)} · {job.location || 'No location'}
              </RNText>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );

  const renderApplicants = () => (
    <View style={styles.applicantsPanel}>
      {/* Header */}
      <View style={[styles.applicantsHeader, { borderBottomColor: colors.icon + '20' }]}>
        {isSmall && (
          <Pressable onPress={() => setShowJobList(true)} style={styles.backToJobs}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <RNText style={[styles.applicantsTitle, { color: colors.text, fontFamily: fontHeading as any }]} numberOfLines={1}>
            {selectedJob?.job_title ?? 'Select a job'}
          </RNText>
          {selectedJob && (
            <RNText style={[styles.applicantsSub, { color: colors.icon }]}>
              {applicantsData?.count ?? 0} applicant{(applicantsData?.count ?? 0) !== 1 ? 's' : ''}
            </RNText>
          )}
        </View>
      </View>

      {/* Status filter tabs */}
      {selectedJob && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {STATUS_FILTER_TABS.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <Pressable
                key={tab.value}
                onPress={() => setStatusFilter(tab.value)}
                style={[
                  styles.filterTab,
                  { borderColor: active ? BRAND_BLUE : colors.icon + '40' },
                  active && { backgroundColor: BRAND_BLUE + '15' },
                ]}
              >
                <RNText style={[styles.filterTabText, { color: active ? BRAND_BLUE : colors.icon }]}>
                  {tab.label}
                </RNText>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Applicants list */}
      <ScrollView style={styles.applicantsList} contentContainerStyle={{ paddingBottom: 24 }}>
        {!selectedJob ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color={colors.icon} />
            <RNText style={[styles.emptyText, { color: colors.icon }]}>Select a job to view applicants.</RNText>
          </View>
        ) : applicantsLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : applicants.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color={colors.icon} />
            <RNText style={[styles.emptyText, { color: colors.icon }]}>
              {statusFilter ? 'No applicants with this status.' : 'No applicants yet.'}
            </RNText>
          </View>
        ) : (
          applicants.map((app) => (
            <View
              key={app.id}
              style={[styles.applicantCard, { backgroundColor: colors.background, borderColor: colors.icon + '30' }]}
            >
              <View style={styles.applicantHeader}>
                {app.applicant_photo ? (
                  <Image source={{ uri: app.applicant_photo }} style={styles.applicantPhoto} />
                ) : (
                  <View style={[styles.applicantPhoto, { backgroundColor: colors.icon + '20', alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="person" size={18} color={colors.icon} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <RNText style={[styles.applicantName, { color: colors.text, fontFamily: fontHeading as any }]} numberOfLines={1}>
                    {app.applicant_name}
                  </RNText>
                  <View style={styles.metaRow}>
                    <View style={[styles.typeBadge, { backgroundColor: app.applicant_type === 'company' ? '#8b5cf6' + '20' : BRAND_BLUE + '20' }]}>
                      <RNText style={[styles.typeBadgeText, { color: app.applicant_type === 'company' ? '#8b5cf6' : BRAND_BLUE }]}>
                        {app.applicant_type === 'company' ? 'Company' : 'Individual'}
                      </RNText>
                    </View>
                    <StatusBadge status={app.status} fontBody={fontBody} />
                    {app.role_name && (
                      <RNText style={[styles.applicantRole, { color: colors.icon }]} numberOfLines={1}>
                        {app.role_name}
                      </RNText>
                    )}
                  </View>
                </View>
              </View>

              {app.cover_letter ? (
                <Pressable onPress={() => setCoverLetterModal(app)}>
                  <RNText style={[styles.coverLetterPreview, { color: colors.text }]} numberOfLines={2}>
                    "{app.cover_letter}"
                  </RNText>
                </Pressable>
              ) : null}

              <View style={styles.applicantFooter}>
                <RNText style={[styles.applicantDate, { color: colors.icon }]}>
                  Applied {new Date(app.created_at).toLocaleDateString()}
                </RNText>
                <View style={styles.actionButtons}>
                  <Pressable
                    onPress={() => handleMessage(app.applicant)}
                    style={[styles.actionBtn, { borderColor: colors.tint }]}
                  >
                    <Ionicons name="chatbubble-outline" size={14} color={colors.tint} />
                    <RNText style={[styles.actionBtnText, { color: colors.tint }]}>Message</RNText>
                  </Pressable>
                  {app.status === 'pending' && (
                    <Pressable
                      onPress={() => handleStatusChange(app.id, 'reviewed')}
                      disabled={updateStatusMutation.isPending}
                      style={[styles.actionBtn, { borderColor: '#3b82f6' }]}
                    >
                      <RNText style={[styles.actionBtnText, { color: '#3b82f6' }]}>Review</RNText>
                    </Pressable>
                  )}
                  {['pending', 'reviewed'].includes(app.status) && (
                    <Pressable
                      onPress={() => handleStatusChange(app.id, 'shortlisted')}
                      disabled={updateStatusMutation.isPending}
                      style={[styles.actionBtn, { borderColor: '#f59e0b' }]}
                    >
                      <RNText style={[styles.actionBtnText, { color: '#f59e0b' }]}>Shortlist</RNText>
                    </Pressable>
                  )}
                  {['pending', 'reviewed', 'shortlisted'].includes(app.status) && (
                    <>
                      <Pressable
                        onPress={() => handleStatusChange(app.id, 'accepted')}
                        disabled={updateStatusMutation.isPending}
                        style={[styles.actionBtn, { backgroundColor: '#22c55e', borderColor: '#22c55e' }]}
                      >
                        <RNText style={[styles.actionBtnText, { color: '#fff' }]}>Accept</RNText>
                      </Pressable>
                      <Pressable
                        onPress={() => handleStatusChange(app.id, 'rejected')}
                        disabled={updateStatusMutation.isPending}
                        style={[styles.actionBtn, { borderColor: '#ef4444' }]}
                      >
                        <RNText style={[styles.actionBtnText, { color: '#ef4444' }]}>Reject</RNText>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  return (
    <WebLayout>
      <View style={[styles.fullContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.pageContainer, isSmall && styles.pageContainerSmall]}>
          <RNText style={[styles.pageTitle, { color: colors.text, fontFamily: fontHeading as any }, isSmall && styles.pageTitleSmall]}>
            Manage Applications
          </RNText>

          <View style={[styles.splitPanel, { borderColor: colors.icon + '30' }]}>
            {isSmall ? (
              showJobList ? renderJobList() : renderApplicants()
            ) : (
              <>
                {renderJobList()}
                {renderApplicants()}
              </>
            )}
          </View>
        </View>
      </View>

      {/* Cover letter full-view modal */}
      <Modal visible={!!coverLetterModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setCoverLetterModal(null)}>
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.icon }]}
            onPress={(e) => e.stopPropagation()}
          >
            <RNText style={[styles.modalTitle, { color: colors.text, fontFamily: fontHeading as any }]}>
              Cover Letter
            </RNText>
            <RNText style={[styles.modalSubtitle, { color: colors.icon }]}>
              From {coverLetterModal?.applicant_name}
            </RNText>
            <ScrollView style={styles.modalScroll}>
              <RNText style={[styles.modalBody, { color: colors.text }]}>
                {coverLetterModal?.cover_letter}
              </RNText>
            </ScrollView>
            <Pressable
              onPress={() => setCoverLetterModal(null)}
              style={[styles.modalBtn, { backgroundColor: colors.tint }]}
            >
              <RNText style={styles.modalBtnText}>Close</RNText>
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
    padding: 48,
  } as ViewStyle,
  fullContainer: {
    flex: 1,
  } as ViewStyle,
  pageContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 100 : 24,
    paddingHorizontal: 24,
    paddingBottom: 24,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  } as ViewStyle,
  pageContainerSmall: {
    paddingTop: 16,
    paddingHorizontal: 12,
  } as ViewStyle,
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  } as TextStyle,
  pageTitleSmall: {
    fontSize: 22,
    marginBottom: 12,
  } as TextStyle,
  splitPanel: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  } as ViewStyle,

  // Left panel – jobs list
  jobListPanel: {
    width: 280,
    flexShrink: 0,
  } as ViewStyle,
  jobListItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  } as ViewStyle,
  jobListTitle: {
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
  jobListMeta: {
    fontSize: 12,
    marginTop: 2,
  } as TextStyle,

  // Right panel – applicants
  applicantsPanel: {
    flex: 1,
  } as ViewStyle,
  applicantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  } as ViewStyle,
  backToJobs: {
    paddingRight: 8,
  } as ViewStyle,
  applicantsTitle: {
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  applicantsSub: {
    fontSize: 12,
    marginTop: 2,
  } as TextStyle,
  filterScroll: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.15)',
  } as ViewStyle,
  filterRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  } as ViewStyle,
  filterTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  } as ViewStyle,
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
  } as TextStyle,
  applicantsList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  } as ViewStyle,

  // Applicant card
  applicantCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  } as ViewStyle,
  applicantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,
  applicantPhoto: {
    width: 34,
    height: 34,
    borderRadius: 17,
  } as ViewStyle,
  applicantName: {
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  } as ViewStyle,
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  } as ViewStyle,
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  } as TextStyle,
  applicantRole: {
    fontSize: 11,
  } as TextStyle,
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  } as ViewStyle,
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  } as TextStyle,
  coverLetterPreview: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
    opacity: 0.8,
  } as TextStyle,
  applicantFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.15)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  } as ViewStyle,
  applicantDate: {
    fontSize: 12,
  } as TextStyle,
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  } as ViewStyle,
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  } as ViewStyle,
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  } as TextStyle,

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  } as ViewStyle,
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  } as TextStyle,

  // Modal
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
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  } as ViewStyle,
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  } as TextStyle,
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  } as TextStyle,
  modalScroll: {
    maxHeight: 300,
    marginBottom: 16,
  } as ViewStyle,
  modalBody: {
    fontSize: 15,
    lineHeight: 22,
  } as TextStyle,
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  } as ViewStyle,
  modalBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  } as TextStyle,

  // Auth
  authTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  } as TextStyle,
  authDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  } as TextStyle,
  authBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  } as ViewStyle,
  authBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  } as TextStyle,
});
