/**
 * Cross-platform dialogs for destructive confirmations and errors.
 *
 * react-native-web stubs `Alert.alert` as a no-op, so web users never see
 * confirmations or error alerts unless we use the browser dialog APIs.
 */

import { Alert, Platform } from 'react-native';

export type ConfirmDestructiveOptions = {
  title: string;
  message: string;
  /** Primary action label (e.g. "Remove", "Clear all") — shown on native only; web uses OK/Cancel. */
  confirmLabel: string;
  onConfirm: () => void;
};

export function confirmDestructive({
  title,
  message,
  confirmLabel,
  onConfirm,
}: ConfirmDestructiveOptions): void {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    const ok = window.confirm(`${title}\n\n${message}`);
    if (ok) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export function showErrorAlert(title: string, message: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    }
    return;
  }
  Alert.alert(title, message);
}
