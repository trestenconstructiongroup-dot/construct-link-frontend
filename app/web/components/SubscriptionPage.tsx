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
import { SvgXml } from 'react-native-svg';
import { useClientWidth } from '../../../hooks/useClientWidth';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Fonts } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  useSubscriptionStatus,
  useInitializeSubscription,
  useVerifyPayment,
  usePaymentHistory,
  useDeletePayment,
  useClearPaymentHistory,
} from '../../../hooks/useSubscription';
import {
  useTransferRecipient,
  useCreateTransferRecipient,
  usePayoutList,
} from '../../../hooks/usePayouts';
import WebLayout from '../layout';
import LandingFooter from './landing/LandingFooter';
import { confirmDestructive, showErrorAlert } from '../../../utils/platformDialogs';
import { siAirtel, siMastercard, siVisa } from 'simple-icons';

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

const simpleIconXml = (path: string, hex: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#${hex}" d="${path}"/></svg>`;

// Source: Wikimedia Commons `File:M-PESA_LOGO-01.svg` (public-domain textlogo)
// https://commons.wikimedia.org/wiki/File:M-PESA_LOGO-01.svg
const MPESA_XML = `<?xml version="1.0" encoding="UTF-8"?>
<svg version="1.1" viewBox="0 0 512 273" xml:space="preserve" xmlns="http://www.w3.org/2000/svg">
<path d="m361 184c-6.68-1.88-14.8-5.54-19.9-8.94-1.52-1.02-1.18-2.66 1.73-8.42l3.62-7.15 9.09 4.74c15.9 8.33 29 7.71 29-1.4 0-4.39-3.64-6.71-16.4-10.4-17.5-5.12-25.4-13.2-24.1-24.4 1.71-14 12.7-21.4 31.2-21.3 10.9 0.114 26.2 4.19 28.2 7.54 0.754 1.22-4.68 15.5-5.89 15.5-0.323 0-2.95-1.18-5.82-2.62-13.7-6.88-27.1-6.75-27.1 0.259 0 4.67 3.4 7.15 14.8 10.8 14.8 4.79 20 8.11 23.4 15.1 3.36 6.94 2.86 14-1.48 21.2-5.65 9.29-25.2 13.9-40.6 9.62zm-351-38.1v-38.8h21.2l11.3 22.6c6.22 12.4 11.6 22.6 12 22.6s5.77-10.2 12-22.6l11.3-22.6h21.2v77.6h-16.9v-24c0-13.2-0.486-24-1.08-24-0.595 0-5.3 8.88-10.5 19.7l-9.38 19.7h-13.1l-20.3-41.6-0.77 50.1h-16.9zm188-0.203v-38.9l21.7 0.73c18.6 0.626 22.7 1.18 28.2 3.85 9.45 4.57 12.7 9.93 13.3 21.9 0.942 19.9-8.5 28.6-32.1 30l-12.7 0.725v20.7h-18.3zm41.7-0.948c3.02-2.59 3.79-4.5 3.79-9.29 0-9.26-3.54-11.9-16.6-12.6l-10.6-0.533v25.7h9.79c8.21 0 10.4-0.53 13.6-3.27zm31.6 1.15v-38.8h59.2v15.5h-40.9v15.5h38.1v15.5h-38.1v15.5h42.3v15.5h-60.6zm142 30.7c1.93-4.5 9.38-21.9 16.5-38.5l13-30.3 19.7-0.805 15.1 36.4c8.32 20 15.5 37.5 16.1 38.9 0.83 2.31 0.0141 2.5-9.31 2.12l-10.2-0.417-4.68-12.7h-34.8l-4.95 12.7-20 0.828zm49.6-21.9c-6.36-17.3-10.1-26.4-10.8-26.4-0.478 7e-3 -3.09 5.84-5.81 13-2.71 7.12-5.15 13.5-5.4 14.1-0.258 0.625 4.72 1.14 11.1 1.14 8.64 0 11.4-0.443 10.9-1.76z\" fill=\"#39b54a\" stroke=\"#39b54a\" stroke-width=\"2\"/>
<path d=\"m172 80.6v9.36c-15.2 0.0524-30.2 0.0158-45.3 0.0158-12.9 0-14.4 6.09-14.4 15.7v131c0 7.81 6.44 14.1 14.4 14.1h43.1c7.99 0 14.4-6.29 14.4-14.1v-157c0-1.97-1.59-5.95-5.39-5.77-4.27 0.237-6.78 3.37-6.91 5.77zm-37.1 27.1h27.6c11.6 0 13.2 7.25 13.2 15.1v46.7c0 5.8-5.03 14.9-13.2 14.9h-27.6c-9.97 0-15.2-8.6-15.2-14.9v-46.7c0-7.81 4.13-15.1 15.2-15.1z\" fill=\"#d8e3d2\" fill-rule=\"evenodd\" stroke-width=\".998\" style=\"paint-order:stroke fill markers\"/>
<path d=\"m104 155c9.07-0.942 17.2-5.6 26.4-17.6 10.4 15.8 24.7 15.2 39.2 16.8-15.6 0.163-13.6 5.52-34.8 4.03-6.77-0.473-17.9-0.936-30.7-3.19z\" fill=\"#9d4c44\" fill-rule=\"evenodd\" stroke-width=\".998\" style=\"paint-order:stroke fill markers\"/>
<path d=\"m161 122 33.8 16.4c-24.1 26.9-58.5 25.1-90.2 16.8 17.5-0.0728 33 6.4 56.3-33.1z\" fill=\"#ed1c24\" fill-rule=\"evenodd\" stroke-width=\".998\" style=\"paint-order:stroke fill markers\"/>
</svg>`;

function paymentErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed?.detail) {
        return typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
      }
    } catch {
      return err.message;
    }
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}

export default function SubscriptionPage() {
  const { token, user } = useAuth();
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const width = useClientWidth();

  const { data: subData, isLoading: subLoading, isError: subError, refetch: refetchSub } = useSubscriptionStatus(token);
  const initMutation = useInitializeSubscription();
  const verifyMutation = useVerifyPayment();
  const { data: historyData, isLoading: historyLoading, isError: historyError } = usePaymentHistory(token);
  const deletePaymentMutation = useDeletePayment();
  const clearPaymentHistoryMutation = useClearPaymentHistory();
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

  const historyBusy =
    deletePaymentMutation.isPending || clearPaymentHistoryMutation.isPending;

  const confirmDeletePayment = (paymentId: number) => {
    confirmDestructive({
      title: 'Remove this entry?',
      message: 'This removes it from your payment history.',
      confirmLabel: 'Remove',
      onConfirm: () => {
        if (!token) return;
        deletePaymentMutation.mutate(
          { token, paymentId },
          { onError: (e) => showErrorAlert('Error', paymentErrorMessage(e)) },
        );
      },
    });
  };

  const confirmClearHistory = () => {
    confirmDestructive({
      title: 'Clear payment history',
      message:
        'This removes all entries from your payment history. This does not cancel your subscription in Paystack. This cannot be undone.',
      confirmLabel: 'Clear all',
      onConfirm: () => {
        if (!token) return;
        clearPaymentHistoryMutation.mutate(token, {
          onError: (e) => showErrorAlert('Error', paymentErrorMessage(e)),
        });
      },
    });
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
                    KSH 1,000 / annum
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
                    KSH 1,000
                  </RNText>
                  <RNText style={[styles.pricePeriod, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
                    / annum
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

                {/* Accepted payment methods */}
                <View style={styles.paymentMethodsRow}>
                  {[
                    { label: 'Visa', iconXml: simpleIconXml(siVisa.path, siVisa.hex) },
                    { label: 'Mastercard', iconXml: simpleIconXml(siMastercard.path, siMastercard.hex) },
                    { label: 'M-Pesa', iconXml: MPESA_XML },
                    { label: 'Airtel Money', iconXml: simpleIconXml(siAirtel.path, siAirtel.hex) },
                    { label: 'M-Pesa Till', iconXml: MPESA_XML },
                  ].map(({ label, iconXml }) => (
                    <View key={label} style={[styles.paymentMethodChip, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                      <SvgXml xml={iconXml} width={14} height={14} />
                      <RNText style={[styles.paymentMethodText, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
                        {label}
                      </RNText>
                    </View>
                  ))}
                </View>

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
              {!historyLoading && !historyError && (historyData?.results?.length ?? 0) > 0 ? (
                <Pressable
                  onPress={confirmClearHistory}
                  disabled={historyBusy}
                  style={({ pressed }) => [
                    styles.clearHistoryButton,
                    { opacity: historyBusy ? 0.5 : pressed ? 0.75 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all payment history"
                >
                  <RNText style={[styles.clearHistoryText, { color: colors.error, fontFamily: Fonts.accent }]}>
                    Clear history
                  </RNText>
                </Pressable>
              ) : null}
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
                  <View style={styles.cellAction} accessibilityLabel="Actions" />
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
                    <View style={styles.cellAction}>
                      <Pressable
                        onPress={() => confirmDeletePayment(payment.id)}
                        disabled={historyBusy}
                        style={({ pressed }) => [{ opacity: historyBusy ? 0.45 : pressed ? 0.7 : 1 }]}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Delete this payment entry"
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                      </Pressable>
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
        <LandingFooter isSmallScreen={width < 768} colors={colors} />
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
  clearHistoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  clearHistoryText: {
    fontSize: 14,
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
  paymentMethodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    marginBottom: 4,
  },
  paymentMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paymentMethodText: {
    fontSize: 12,
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
  cellDate: { flex: 1.75 },
  cellType: { flex: 1.75 },
  cellAmount: { flex: 1.75 },
  cellStatus: { flex: 1.35, alignItems: 'flex-end' as const },
  cellAction: {
    flex: 0.75,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
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
