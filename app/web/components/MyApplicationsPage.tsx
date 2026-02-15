/**
 * My Applications page – shows the current user's job applications
 * with status filter tabs and withdraw capability.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
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
  useMyApplications,
  useWithdrawApplication,
} from '../../../hooks/useApplications';
import type { ApplicationItem, ApplicationStatus } from '../../../services/api';
import WebLayout from '../layout';
import LandingFooter from './landing/LandingFooter';

const BRAND_BLUE = Colors.light.accentMuted;

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Withdrawn', value: 'withdrawn' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: '#6b7280',
  reviewed: '#3b82f6',
  shortlisted: '#f59e0b',
  accepted: '#22c55e',
  rejected: '#ef4444',
  withdrawn: '#9ca3af',
};

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

export default function MyApplicationsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { token, user, isLoading: authLoading } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const isSmall = width < 768;
  const isLoggedIn = !!token && !!user;

  const fontHeading = Fonts.display;
  const fontBody = Fonts.body;

  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [withdrawTarget, setWithdrawTarget] = useState<ApplicationItem | null>(null);

  const { data, isLoading, refetch } = useMyApplications(token, {
    status: statusFilter || undefined,
    page,
    page_size: 20,
  });

  const withdrawMutation = useWithdrawApplication();

  const handleWithdraw = useCallback(async () => {
    if (!withdrawTarget || !token) return;
    try {
      await withdrawMutation.mutateAsync({ token, applicationId: withdrawTarget.id });
      setWithdrawTarget(null);
      refetch();
    } catch {
      // error handled by mutation
    }
  }, [withdrawTarget, token, withdrawMutation, refetch]);

  const handleTabPress = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

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
            Sign in to view your applications.
          </RNText>
          <Pressable style={[styles.authBtn, { backgroundColor: BRAND_BLUE }]} onPress={() => router.push('/login')}>
            <RNText style={styles.authBtnText}>Sign In</RNText>
          </Pressable>
        </View>
      </WebLayout>
    );
  }

  const applications = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const hasNext = !!data?.next;
  const hasPrev = page > 1;

  const canWithdraw = (app: ApplicationItem) =>
    ['pending', 'reviewed', 'shortlisted'].includes(app.status);

  return (
    <WebLayout>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.container, isSmall && styles.containerSmall]}>
          <RNText style={[styles.pageTitle, { color: colors.text, fontFamily: fontHeading as any }, isSmall && styles.pageTitleSmall]}>
            My Applications
          </RNText>
          <RNText style={[styles.subtitle, { color: colors.icon }]}>
            {totalCount} application{totalCount !== 1 ? 's' : ''} total
          </RNText>

          {/* Status filter tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
            contentContainerStyle={styles.tabsRow}
          >
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.value;
              return (
                <Pressable
                  key={tab.value}
                  onPress={() => handleTabPress(tab.value)}
                  style={[
                    styles.tab,
                    { borderColor: active ? BRAND_BLUE : colors.icon + '40' },
                    active && { backgroundColor: BRAND_BLUE + '15' },
                  ]}
                >
                  <RNText
                    style={[
                      styles.tabText,
                      { color: active ? BRAND_BLUE : colors.icon, fontFamily: fontBody as any },
                    ]}
                  >
                    {tab.label}
                  </RNText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Applications list */}
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : applications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={colors.icon} />
              <RNText style={[styles.emptyText, { color: colors.icon }]}>
                {statusFilter ? 'No applications with this status.' : 'You haven\'t applied to any jobs yet.'}
              </RNText>
              {!statusFilter && (
                <Pressable
                  style={[styles.emptyBtn, { backgroundColor: BRAND_BLUE }]}
                  onPress={() => router.push('/find-jobs')}
                >
                  <RNText style={styles.emptyBtnText}>Browse Jobs</RNText>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.cardsList}>
              {applications.map((app) => (
                <View
                  key={app.id}
                  style={[styles.appCard, { backgroundColor: colors.background, borderColor: colors.icon + '30' }]}
                >
                  <View style={styles.appCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Pressable onPress={() => router.push(`/jobs/${app.job}`)}>
                        <RNText style={[styles.appJobTitle, { color: colors.tint, fontFamily: fontHeading as any }]}>
                          {app.job_title}
                        </RNText>
                      </Pressable>
                      {app.role_name && (
                        <RNText style={[styles.appRole, { color: colors.icon }]}>
                          Role: {app.role_name}
                        </RNText>
                      )}
                    </View>
                    <StatusBadge status={app.status} fontBody={fontBody} />
                  </View>

                  {app.cover_letter ? (
                    <RNText style={[styles.appCoverLetter, { color: colors.text }]} numberOfLines={2}>
                      {app.cover_letter}
                    </RNText>
                  ) : null}

                  <View style={styles.appCardFooter}>
                    <RNText style={[styles.appDate, { color: colors.icon }]}>
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </RNText>
                    <View style={styles.appActions}>
                      {canWithdraw(app) && (
                        <Pressable
                          onPress={() => setWithdrawTarget(app)}
                          style={[styles.withdrawBtn, { borderColor: '#ef4444' }]}
                        >
                          <RNText style={[styles.withdrawBtnText, { color: '#ef4444' }]}>Withdraw</RNText>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              ))}

              {/* Pagination */}
              {(hasPrev || hasNext) && (
                <View style={styles.pagination}>
                  <Pressable
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!hasPrev}
                    style={[styles.pageBtn, !hasPrev && { opacity: 0.4 }]}
                  >
                    <Ionicons name="chevron-back" size={18} color={colors.text} />
                    <RNText style={[styles.pageBtnText, { color: colors.text }]}>Previous</RNText>
                  </Pressable>
                  <RNText style={[styles.pageIndicator, { color: colors.icon }]}>Page {page}</RNText>
                  <Pressable
                    onPress={() => setPage((p) => p + 1)}
                    disabled={!hasNext}
                    style={[styles.pageBtn, !hasNext && { opacity: 0.4 }]}
                  >
                    <RNText style={[styles.pageBtnText, { color: colors.text }]}>Next</RNText>
                    <Ionicons name="chevron-forward" size={18} color={colors.text} />
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>
        <LandingFooter isSmallScreen={isSmall} colors={colors} />
      </ScrollView>

      {/* Withdraw confirmation modal */}
      <Modal visible={!!withdrawTarget} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setWithdrawTarget(null)}>
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.icon }]}
            onPress={(e) => e.stopPropagation()}
          >
            <RNText style={[styles.modalTitle, { color: colors.text, fontFamily: fontHeading as any }]}>
              Withdraw Application?
            </RNText>
            <RNText style={[styles.modalText, { color: colors.icon }]}>
              Are you sure you want to withdraw your application for "{withdrawTarget?.job_title}"? This cannot be undone.
            </RNText>
            <Pressable
              onPress={handleWithdraw}
              disabled={withdrawMutation.isPending}
              style={[styles.modalBtn, { backgroundColor: '#ef4444' }]}
            >
              {withdrawMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <RNText style={styles.modalBtnText}>Withdraw</RNText>
              )}
            </Pressable>
            <Pressable
              onPress={() => setWithdrawTarget(null)}
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
    padding: 48,
  } as ViewStyle,
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
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  } as ViewStyle,
  containerSmall: {
    paddingTop: 16,
    paddingHorizontal: 16,
  } as ViewStyle,
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  } as TextStyle,
  pageTitleSmall: {
    fontSize: 22,
  } as TextStyle,
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  } as TextStyle,
  tabsScroll: {
    marginBottom: 20,
  } as ViewStyle,
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  } as ViewStyle,
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  } as ViewStyle,
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  } as TextStyle,
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  } as ViewStyle,
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  } as TextStyle,
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  } as ViewStyle,
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  } as TextStyle,
  cardsList: {
    gap: 12,
  } as ViewStyle,
  appCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  } as ViewStyle,
  appCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  } as ViewStyle,
  appJobTitle: {
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  appRole: {
    fontSize: 13,
    marginTop: 2,
  } as TextStyle,
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  } as ViewStyle,
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  } as TextStyle,
  appCoverLetter: {
    fontSize: 13,
    marginTop: 8,
    opacity: 0.8,
    fontStyle: 'italic',
  } as TextStyle,
  appCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.15)',
  } as ViewStyle,
  appDate: {
    fontSize: 12,
  } as TextStyle,
  appActions: {
    flexDirection: 'row',
    gap: 8,
  } as ViewStyle,
  withdrawBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  } as ViewStyle,
  withdrawBtnText: {
    fontSize: 13,
    fontWeight: '600',
  } as TextStyle,
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
  } as ViewStyle,
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  } as ViewStyle,
  pageBtnText: {
    fontSize: 14,
    fontWeight: '500',
  } as TextStyle,
  pageIndicator: {
    fontSize: 14,
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
    maxWidth: 400,
  } as ViewStyle,
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  } as TextStyle,
  modalText: {
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 22,
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
