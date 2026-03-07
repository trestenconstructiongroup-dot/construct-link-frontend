import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Colors, Fonts } from '../constants/theme';
import {
  useSubscriptionStatus,
  useInitializeSubscription,
  useVerifyPayment,
} from '../hooks/useSubscription';

export default function SubscriptionBanner() {
  const { token } = useAuth();
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const { data: subData, isLoading } = useSubscriptionStatus(token);
  const initMutation = useInitializeSubscription();
  const verifyMutation = useVerifyPayment();

  const status = subData?.status ?? 'none';
  const isActive = status === 'active';

  const handleSubscribe = async () => {
    if (!token) return;

    // Build callback URL for web
    const callbackUrl =
      Platform.OS === 'web' ? `${window.location.origin}/account?payment=verify` : '';

    try {
      const result = await initMutation.mutateAsync({ token, callbackUrl });

      if (Platform.OS === 'web') {
        // Redirect to Paystack checkout
        window.location.href = result.authorization_url;
      } else {
        // Open in external browser on mobile
        Linking.openURL(result.authorization_url);
      }
    } catch {
      // Error handled by mutation state
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  if (isActive) {
    const endDate = subData?.subscription?.current_period_end;
    const formattedDate = endDate
      ? new Date(endDate).toLocaleDateString()
      : '';

    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: colors.success }]}>
            <Text style={[styles.badgeText, { color: '#fff' }]}>Active</Text>
          </View>
          <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.heading }]}>
            Premium Subscription
          </Text>
        </View>
        {formattedDate ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
            Renews on {formattedDate}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.heading }]}>
        Upgrade to Premium
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
        Get full access to all features for KES 1,000/month
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accent }]}
        onPress={handleSubscribe}
        disabled={initMutation.isPending}
      >
        {initMutation.isPending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={[styles.buttonText, { fontFamily: Fonts.accent }]}>
            Subscribe Now
          </Text>
        )}
      </TouchableOpacity>
      {initMutation.isError && (
        <Text style={[styles.errorText, { color: colors.error, fontFamily: Fonts.body }]}>
          Something went wrong. Please try again.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
  },
});
