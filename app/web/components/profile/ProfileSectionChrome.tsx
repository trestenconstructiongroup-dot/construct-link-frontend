/**
 * Shared layout and actions for My Profile sections — cards, headers, dividers, buttons.
 */
import React, { type ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Colors, Fonts } from '../../../constants/theme';

export type ProfileThemeColors = (typeof Colors)['light'];

type CardProps = {
  children: ReactNode;
  isDark: boolean;
  /** Left accent bar (summary / identity block) */
  featured?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ProfileSectionCard({ children, isDark, featured, style }: CardProps) {
  const colors = Colors[isDark ? 'dark' : 'light'];
  return (
    <View
      style={[
        chromeStyles.cardShell,
        {
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : '#ffffff',
          borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(15, 23, 42, 0.07)',
        },
        featured && {
          borderLeftWidth: 4,
          borderLeftColor: colors.accent,
          paddingLeft: 18,
        },
        Platform.OS !== 'web' && !isDark && {
          borderWidth: 1,
          borderColor: 'rgba(15, 23, 42, 0.1)',
        },
        Platform.select({
          web: {
            boxShadow: isDark
              ? ('0 2px 20px rgba(0,0,0,0.35)' as any)
              : ('0 2px 14px rgba(15, 23, 42, 0.07)' as any),
          },
          default: {},
        }),
        style,
      ]}
    >
      {children}
    </View>
  );
}

type HeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel: string;
  onAction: () => void;
  colors: ProfileThemeColors;
};

export function ProfileSectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  colors,
}: HeaderProps) {
  return (
    <View style={chromeStyles.headerRow}>
      <View style={chromeStyles.headerTextCol}>
        <Text
          accessibilityRole="header"
          style={[chromeStyles.sectionTitle, { color: colors.text, fontFamily: Fonts.heading }]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[chromeStyles.sectionSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onAction}
        style={({ pressed }) => [chromeStyles.headerActionHit, pressed && { opacity: 0.65 }]}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
      >
        <Text style={[chromeStyles.headerActionText, { color: colors.accent }]}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

export function ProfileHeaderDivider({ isDark }: { isDark: boolean }) {
  return (
    <View
      style={[
        chromeStyles.divider,
        {
          backgroundColor: isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(15, 23, 42, 0.08)',
        },
      ]}
    />
  );
}

type PrimaryBtnProps = {
  label: string;
  onPress: () => void;
  colors: ProfileThemeColors;
};

export function ProfilePrimaryButton({ label, onPress, colors }: PrimaryBtnProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        chromeStyles.btnPrimary,
        { backgroundColor: colors.accent, opacity: pressed ? 0.88 : 1 },
      ]}
      accessibilityRole="button"
    >
      <Text style={[chromeStyles.btnPrimaryLabel, { color: colors.textInverse }]}>{label}</Text>
    </Pressable>
  );
}

type OutlineBtnProps = {
  label: string;
  onPress: () => void;
  colors: ProfileThemeColors;
  isDark: boolean;
};

export function ProfileOutlineButton({ label, onPress, colors, isDark }: OutlineBtnProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        chromeStyles.btnOutline,
        {
          borderColor: isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(15, 23, 42, 0.15)',
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={[chromeStyles.btnOutlineLabel, { color: colors.text, fontFamily: Fonts.accent }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ProfileFooterRow({ children }: { children: ReactNode }) {
  return <View style={chromeStyles.footerRow}>{children}</View>;
}

/** Muted text label above inputs (field group) */
export function ProfileFieldLabel({
  children,
  colors,
}: {
  children: ReactNode;
  colors: ProfileThemeColors;
}) {
  return (
    <Text style={[chromeStyles.fieldLabel, { color: colors.textSecondary }]}>{children}</Text>
  );
}

/** Empty-state callout inside a section */
export function ProfileEmptyHint({
  children,
  colors,
}: {
  children: ReactNode;
  colors: ProfileThemeColors;
}) {
  return (
    <Text style={[chromeStyles.emptyHint, { color: colors.textSecondary }]}>{children}</Text>
  );
}

const chromeStyles = StyleSheet.create({
  cardShell: {
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 22,
    marginBottom: 0,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    fontFamily: Fonts.body,
  },
  headerActionHit: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginTop: -2,
  },
  headerActionText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Fonts.accent,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 10,
    marginBottom: 14,
  },
  btnPrimary: {
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.accent,
  },
  btnOutline: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: Fonts.accent,
  },
  emptyHint: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.body,
  },
});
