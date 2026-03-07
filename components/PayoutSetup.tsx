import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Colors, Fonts } from '../constants/theme';
import {
  useTransferRecipient,
  useCreateTransferRecipient,
} from '../hooks/usePayouts';

export default function PayoutSetup() {
  const { token } = useAuth();
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const { data: recipient, isLoading, isError } = useTransferRecipient(token);
  const createMutation = useCreateTransferRecipient();

  const [recipientType, setRecipientType] = useState<'mobile_money' | 'kepss'>('mobile_money');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async () => {
    if (!token || !accountName.trim() || !accountNumber.trim()) return;

    try {
      await createMutation.mutateAsync({
        token,
        payload: {
          recipient_type: recipientType,
          account_name: accountName.trim(),
          account_number: accountNumber.trim(),
          bank_code: recipientType === 'kepss' ? bankCode.trim() : undefined,
        },
      });
      setShowForm(false);
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

  // Has existing recipient
  if (recipient && !isError && !showForm) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.heading }]}>
          Payout Account
        </Text>
        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
            Type:
          </Text>
          <Text style={[styles.value, { color: colors.text, fontFamily: Fonts.body }]}>
            {recipient.recipient_type === 'mobile_money' ? 'Mobile Money' : 'Bank Account'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
            Name:
          </Text>
          <Text style={[styles.value, { color: colors.text, fontFamily: Fonts.body }]}>
            {recipient.account_name}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
            Account:
          </Text>
          <Text style={[styles.value, { color: colors.text, fontFamily: Fonts.body }]}>
            {recipient.account_number}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.accent }]}
          onPress={() => setShowForm(true)}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.accent, fontFamily: Fonts.accent }]}>
            Update Details
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show form (no recipient or editing)
  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.heading }]}>
        Set Up Payouts
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
        Add your bank or mobile money details to receive payments.
      </Text>

      {/* Recipient Type Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            recipientType === 'mobile_money' && { backgroundColor: colors.accent },
            { borderColor: colors.accent },
          ]}
          onPress={() => setRecipientType('mobile_money')}
        >
          <Text
            style={[
              styles.toggleText,
              { fontFamily: Fonts.accent },
              recipientType === 'mobile_money' ? { color: '#fff' } : { color: colors.accent },
            ]}
          >
            Mobile Money
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            recipientType === 'kepss' && { backgroundColor: colors.accent },
            { borderColor: colors.accent },
          ]}
          onPress={() => setRecipientType('kepss')}
        >
          <Text
            style={[
              styles.toggleText,
              { fontFamily: Fonts.accent },
              recipientType === 'kepss' ? { color: '#fff' } : { color: colors.accent },
            ]}
          >
            Bank Account
          </Text>
        </TouchableOpacity>
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
        keyboardType="number-pad"
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

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accent }]}
        onPress={handleSubmit}
        disabled={createMutation.isPending || !accountName.trim() || !accountNumber.trim()}
      >
        {createMutation.isPending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={[styles.buttonText, { fontFamily: Fonts.accent }]}>
            Save Payout Details
          </Text>
        )}
      </TouchableOpacity>

      {createMutation.isError && (
        <Text style={[styles.errorText, { color: colors.error, fontFamily: Fonts.body }]}>
          Failed to save payout details. Please try again.
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
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
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
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    width: 60,
  },
  value: {
    fontSize: 14,
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
  },
});
