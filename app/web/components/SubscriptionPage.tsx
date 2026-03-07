/**
 * My Subscription page - shows subscription status, payment history,
 * and payout setup for workers.
 */

import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Text as RNText,
  Linking,
  Platform,
  TextInput,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Fonts } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  useSubscriptionStatus,
  useInitializeSubscription,
  useVerifyPayment,
  usePaymentHistory,
} from '../../../hooks/useSubscription';
import {
  useTransferRecipient,
  useCreateTransferRecipient,
  usePayoutList,
} from '../../../hooks/usePayouts';
import WebLayout from '../layout';
import LandingFooter from './landing/LandingFooter';

const BRAND_BLUE = Colors.light.accentMuted;

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: '#dcfce7', text: '#16a34a', label: 'Active' },
  non_renewing: { bg: '#fef9c3', text: '#ca8a04', label: 'Non-renewing' },
  attention: { bg: '#fee2e2', text: '#dc2626', label: 'Needs Attention' },
  cancelled: { bg: '#f3f4f6', text: '#6b7280', label: 'Cancelled' },
  expired: { bg: '#f3f4f6', text: '#6b7280', label: 'Expired' },
  none: { bg: '#f3f4f6', text: '#6b7280', label: 'No Subscription' },
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  success: '#22c55e',
  pending: '#f59e0b',
  failed: '#ef4444',
  abandoned: '#6b7280',
};

export default function SubscriptionPage() {
  const { token, user } = useAuth();
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const { data: subData, isLoading: subLoading, isError: subError, refetch: refetchSub } = useSubscriptionStatus(token);
  const initMutation = useInitializeSubscription();
  const verifyMutation = useVerifyPayment();
  const { data: historyData, isLoading: historyLoading, isError: historyError } = usePaymentHistory(token);
  const { data: recipientData, isError: recipientError } = useTransferRecipient(token);
  const { data: payoutsData, isError: payoutsError } = usePayoutList(token);

  // Payout form state
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [recipientType, setRecipientType] = useState<'mobile_money' | 'kepss'>('mobile_money');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const createRecipientMutation = useCreateTransferRecipient();

  const subStatus = subData?.status ?? 'none';
  const isActive = subStatus === 'active';
  const badge = STATUS_BADGE[subStatus] ?? STATUS_BADGE.none;

  // Auto-verify if redirected back from Paystack
  useEffect(() => {
    if (Platform.OS !== 'web' || !token) return;
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const ref = urlParams.get('reference');
    if (payment === 'verify' && ref) {
      verifyMutation.mutate(
        { token, reference: ref },
        { onSuccess: () => refetchSub() },
      );
    }
  }, [token]);

  const handleSubscribe = async () => {
    if (!token) return;
    const callbackUrl = Platform.OS === 'web'
      ? `${window.location.origin}/my-subscription?payment=verify`
      : '';
    try {
      const result = await initMutation.mutateAsync({ token, callbackUrl });
      if (Platform.OS === 'web') {
        window.location.href = result.authorization_url;
      } else {
        Linking.openURL(result.authorization_url);
      }
    } catch { /* handled by mutation state */ }
  };

  const handleSaveRecipient = async () => {
    if (!token || !accountName.trim() || !accountNumber.trim()) return;
    try {
      await createRecipientMutation.mutateAsync({
        token,
        payload: {
          recipient_type: recipientType,
          account_name: accountName.trim(),
          account_number: accountNumber.trim(),
          bank_code: recipientType === 'kepss' ? bankCode.trim() : undefined,
        },
      });
      setShowPayoutForm(false);
      setAccountName('');
      setAccountNumber('');
      setBankCode('');
    } catch { /* handled by mutation state */ }
  };

  return (
    <WebLayout>
      <ScrollView contentContainerStyle={[styles.page, { backgroundColor: colors.background }]}>
        <View style={styles.container}>

          {/* Header */}
          <RNText style={[styles.pageTitle, { color: colors.text, fontFamily: Fonts.display }]}>
            My Subscription
          </RNText>

          {/* Subscription Status Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="card-outline" size={22} color={BRAND_BLUE} />
                <RNText style={[styles.cardTitle, { color: colors.text, fontFamily: Fonts.heading }]}>
                  Subscription Status
                </RNText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                <RNText style={[styles.statusBadgeText, { color: badge.text }]}>
                  {badge.label}
                </RNText>
              </View>
            </View>

            {subLoading ? (
              <ActivityIndicator size="small" color={BRAND_BLUE} style={{ marginVertical: 20 }} />
            ) : subError ? (
              <View style={styles.cardBody}>
                <RNText style={[styles.errorText, { color: colors.error, fontFamily: Fonts.body }]}>
                  Unable to load subscription status. Please try again later.
                </RNText>
              </View>
            ) : isActive ? (
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <RNText style={[styles.infoLabel, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
                    Plan
                  </RNText>
                  <RNText style={[styles.infoValue, { color: colors.text, fontFamily: Fonts.accent }]}>
                    Construct Link Premium
                  </RNText>
                </View>
                <View style={styles.infoRow}>
                  <RNText style={[styles.infoLabel, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
                    Price
                  </RNText>
                  <RNText style={[styles.infoValue, { color: colors.text, fontFamily: Fonts.accent }]}>
                    KES 1,000 / month
                  </RNText>
                </View>
                {subData?.subscription?.current_period_end && (
                  <View style={styles.infoRow}>
                    <RNText style={[styles.infoLabel, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
                      Next billing date
                    </RNText>
                    <RNText style={[styles.infoValue, { color: colors.text, fontFamily: Fonts.accent }]}>
                      {new Date(subData.subscription.current_period_end).toLocaleDateString()}
                    </RNText>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.cardBody}>
                <RNText style={[styles.promoText, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
                  Upgrade to Construct Link Premium for full access to all platform features.
                </RNText>
                <View style={styles.priceRow}>
                  <RNText style={[styles.priceAmount, { color: colors.text, fontFamily: Fonts.display }]}>
                    KES 1,000
                  </RNText>
                  <RNText style={[styles.pricePeriod, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
                    / month
                  </RNText>
                </View>
                <Pressable
                  style={[styles.subscribeButton, { backgroundColor: BRAND_BLUE }]}
                  onPress={handleSubscribe}
                  disabled={initMutation.isPending}
                >
                  {initMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <RNText style={[styles.subscribeButtonText, { fontFamily: Fonts.accent }]}>
                      Subscribe Now
                    </RNText>
                  )}
                </Pressable>
                {initMutation.isError && (
                  <RNText style={[styles.errorText, { color: colors.error }]}>
                    Something went wrong. Please try again.
                  </RNText>
                )}
                {verifyMutation.isPending && (
                  <View style={styles.verifyingRow}>
                    <ActivityIndicator size="small" color={BRAND_BLUE} />
                    <RNText style={[styles.verifyingText, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
                      Verifying payment...
                    </RNText>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Payment History */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="receipt-outline" size={22} color={BRAND_BLUE} />
                <RNText style={[styles.cardTitle, { color: colors.text, fontFamily: Fonts.heading }]}>
                  Payment History
                </RNText>
              </View>
            </View>

            {historyLoading ? (
              <ActivityIndicator size="small" color={BRAND_BLUE} style={{ marginVertical: 20 }} />
            ) : historyError ? (
              <View style={styles.cardBody}>
                <RNText style={[styles.errorText, { color: colors.error, fontFamily: Fonts.body }]}>
                  Unable to load payment history.
                </RNText>
              </View>
            ) : !historyData?.results?.length ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={40} color={colors.textTertiary} />
                <RNText style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
                  No payment history yet
                </RNText>
              </View>
            ) : (
              <View style={styles.tableContainer}>
                <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: colors.border }]}>
                  <RNText style={[styles.tableHeaderCell, styles.cellDate, { color: colors.textSecondary, fontFamily: Fonts.accent }]}>Date</RNText>
                  <RNText style={[styles.tableHeaderCell, styles.cellType, { color: colors.textSecondary, fontFamily: Fonts.accent }]}>Type</RNText>
                  <RNText style={[styles.tableHeaderCell, styles.cellAmount, { color: colors.textSecondary, fontFamily: Fonts.accent }]}>Amount</RNText>
                  <RNText style={[styles.tableHeaderCell, styles.cellStatus, { color: colors.textSecondary, fontFamily: Fonts.accent }]}>Status</RNText>
                </View>
                {historyData.results.map((payment) => (
                  <View key={payment.id} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                    <RNText style={[styles.tableCell, styles.cellDate, { color: colors.text, fontFamily: Fonts.body }]}>
                      {new Date(payment.created_at).toLocaleDateString()}
                    </RNText>
                    <RNText style={[styles.tableCell, styles.cellType, { color: colors.text, fontFamily: Fonts.body }]}>
                      {payment.payment_type === 'subscription' ? 'Subscription' : 'Payout'}
                    </RNText>
                    <RNText style={[styles.tableCell, styles.cellAmount, { color: colors.text, fontFamily: Fonts.accent }]}>
                      {payment.currency} {parseFloat(payment.amount).toLocaleString()}
                    </RNText>
                    <View style={[styles.cellStatus]}>
                      <View style={[styles.paymentStatusBadge, { backgroundColor: (PAYMENT_STATUS_COLORS[payment.status] ?? '#6b7280') + '20' }]}>
                        <RNText style={[styles.paymentStatusText, { color: PAYMENT_STATUS_COLORS[payment.status] ?? '#6b7280' }]}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </RNText>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Payout Setup (workers only) */}
          {user?.is_worker && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="wallet-outline" size={22} color={BRAND_BLUE} />
                  <RNText style={[styles.cardTitle, { color: colors.text, fontFamily: Fonts.heading }]}>
                    Payout Account
                  </RNText>
                </View>
              </View>

              {recipientError ? (
                <View style={styles.cardBody}>
                  <RNText style={[styles.errorText, { color: colors.error, fontFamily: Fonts.body }]}>
                    Unable to load payout details.
                  </RNText>
                </View>
              ) : recipientData && !showPayoutForm ? (
                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <RNText style={[styles.infoLabel, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
                      Type
                    </RNText>
                    <RNText style={[styles.infoValue, { color: colors.text, fontFamily: Fonts.accent }]}>
                      {recipientData.recipient_type === 'mobile_money' ? 'Mobile Money' : 'Bank Account'}
                    </RNText>
                  </View>
                  <View style={styles.infoRow}>
                    <RNText style={[styles.infoLabel, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
                      Name
                    </RNText>
                    <RNText style={[styles.infoValue, { color: colors.text, fontFamily: Fonts.accent }]}>
                      {recipientData.account_name}
                    </RNText>
                  </View>
                  <View style={styles.infoRow}>
                    <RNText style={[styles.infoLabel, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
                      Account
                    </RNText>
                    <RNText style={[styles.infoValue, { color: colors.text, fontFamily: Fonts.accent }]}>
                      {recipientData.account_number}
                    </RNText>
                  </View>
                  <Pressable
                    style={[styles.outlineButton, { borderColor: BRAND_BLUE }]}
                    onPress={() => setShowPayoutForm(true)}
                  >
                    <RNText style={[styles.outlineButtonText, { color: BRAND_BLUE, fontFamily: Fonts.accent }]}>
                      Update Details
                    </RNText>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.cardBody}>
                  {!recipientData && (
                    <RNText style={[styles.promoText, { color: colors.textSecondary, fontFamily: Fonts.body, marginBottom: 12 }]}>
                      Add your bank or mobile money details to receive payments.
                    </RNText>
                  )}

                  <View style={styles.toggleRow}>
                    <Pressable
                      style={[
                        styles.toggleButton,
                        { borderColor: BRAND_BLUE },
                        recipientType === 'mobile_money' && { backgroundColor: BRAND_BLUE },
                      ]}
                      onPress={() => setRecipientType('mobile_money')}
                    >
                      <RNText style={[styles.toggleText, { fontFamily: Fonts.accent, color: recipientType === 'mobile_money' ? '#fff' : BRAND_BLUE }]}>
                        Mobile Money
                      </RNText>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.toggleButton,
                        { borderColor: BRAND_BLUE },
                        recipientType === 'kepss' && { backgroundColor: BRAND_BLUE },
                      ]}
                      onPress={() => setRecipientType('kepss')}
                    >
                      <RNText style={[styles.toggleText, { fontFamily: Fonts.accent, color: recipientType === 'kepss' ? '#fff' : BRAND_BLUE }]}>
                        Bank Account
                      </RNText>
                    </Pressable>
                  </View>

                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, fontFamily: Fonts.body }]}
                    placeholder="Account holder name"
                    placeholderTextColor={colors.textTertiary}
                    value={accountName}
                    onChangeText={setAccountName}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, fontFamily: Fonts.body }]}
                    placeholder={recipientType === 'mobile_money' ? 'Phone number' : 'Account number'}
                    placeholderTextColor={colors.textTertiary}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                  />
                  {recipientType === 'kepss' && (
                    <TextInput
                      style={[styles.input, { color: colors.text, borderColor: colors.border, fontFamily: Fonts.body }]}
                      placeholder="Bank code"
                      placeholderTextColor={colors.textTertiary}
                      value={bankCode}
                      onChangeText={setBankCode}
                    />
                  )}

                  <View style={styles.formActions}>
                    <Pressable
                      style={[styles.subscribeButton, { backgroundColor: BRAND_BLUE }]}
                      onPress={handleSaveRecipient}
                      disabled={createRecipientMutation.isPending || !accountName.trim() || !accountNumber.trim()}
                    >
                      {createRecipientMutation.isPending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <RNText style={[styles.subscribeButtonText, { fontFamily: Fonts.accent }]}>
                          Save Payout Details
                        </RNText>
                      )}
                    </Pressable>
                    {showPayoutForm && (
                      <Pressable
                        style={[styles.outlineButton, { borderColor: colors.textSecondary }]}
                        onPress={() => setShowPayoutForm(false)}
                      >
                        <RNText style={[styles.outlineButtonText, { color: colors.textSecondary, fontFamily: Fonts.accent }]}>
                          Cancel
                        </RNText>
                      </Pressable>
                    )}
                  </View>

                  {createRecipientMutation.isError && (
                    <RNText style={[styles.errorText, { color: colors.error }]}>
                      Failed to save payout details. Please try again.
                    </RNText>
                  )}
                </View>
              )}

              {/* Payout History */}
              {payoutsData?.results?.length ? (
                <View style={[styles.payoutHistorySection, { borderTopColor: colors.border }]}>
                  <RNText style={[styles.subSectionTitle, { color: colors.text, fontFamily: Fonts.heading }]}>
                    Payout History
                  </RNText>
                  {payoutsData.results.map((payout) => (
                    <View key={payout.id} style={[styles.payoutRow, { borderBottomColor: colors.border }]}>
                      <View style={{ flex: 1 }}>
                        <RNText style={[styles.payoutAmount, { color: colors.text, fontFamily: Fonts.accent }]}>
                          KES {parseFloat(payout.amount).toLocaleString()}
                        </RNText>
                        {payout.reason ? (
                          <RNText style={[styles.payoutReason, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
                            {payout.reason}
                          </RNText>
                        ) : null}
                        <RNText style={[styles.payoutDate, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
                          {new Date(payout.created_at).toLocaleDateString()}
                        </RNText>
                      </View>
                      <View style={[styles.paymentStatusBadge, { backgroundColor: (PAYMENT_STATUS_COLORS[payout.status] ?? '#6b7280') + '20' }]}>
                        <RNText style={[styles.paymentStatusText, { color: PAYMENT_STATUS_COLORS[payout.status] ?? '#6b7280' }]}>
                          {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                        </RNText>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          )}

        </View>
        <LandingFooter />
      </ScrollView>
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    paddingTop: 100,
    paddingBottom: 0,
  },
  container: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },

  // Card
  card: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cardBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Status badge
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
  },

  // Promo / subscribe
  promoText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
    gap: 4,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  pricePeriod: {
    fontSize: 16,
  },
  subscribeButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  outlineButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  outlineButtonText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  verifyingText: {
    fontSize: 14,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },

  // Payment history table
  tableContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tableHeader: {
    borderBottomWidth: 2,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCell: {
    fontSize: 14,
  },
  cellDate: { flex: 2 },
  cellType: { flex: 2 },
  cellAmount: { flex: 2 },
  cellStatus: { flex: 1.5, alignItems: 'flex-end' as const },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Payout form
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 4,
  },

  // Payout history
  payoutHistorySection: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  payoutAmount: {
    fontSize: 14,
  },
  payoutReason: {
    fontSize: 13,
    marginTop: 2,
  },
  payoutDate: {
    fontSize: 12,
    marginTop: 2,
  },
});
