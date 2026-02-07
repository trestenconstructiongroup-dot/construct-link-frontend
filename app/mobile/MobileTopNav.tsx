import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/Text';
import ThemeToggle from '../../components/ThemeToggle';
import { Colors, Fonts } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface MobileTopNavProps {
  title: string;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  showBack: boolean;
  onBack: () => void;
}

export default function MobileTopNav({
  title,
  menuOpen,
  setMenuOpen,
  showBack,
  onBack,
}: MobileTopNavProps) {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const displayName = user?.full_name || user?.username || user?.email || 'Guest';
  const email = user?.email;
  const initial = displayName.trim().charAt(0).toUpperCase();

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 4,
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.bar}>
        <View style={styles.left}>
          {showBack && (
            <Pressable onPress={onBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
          )}
          <Text style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
        </View>

        <View style={styles.right}>
          <Pressable
            onPress={() => {
              // TODO: Handle notification bell press
            }}
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => setMenuOpen(!menuOpen)}
            style={styles.avatarButton}
          >
            <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <Ionicons
              name={menuOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.text}
            />
          </Pressable>
        </View>
      </View>

      {menuOpen && (
        <>
          {/* Click outside to close */}
          <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />

          <View
            style={[
              styles.menu,
              {
                backgroundColor: isDark ? '#020617' : '#ffffff',
                borderColor: isDark ? 'rgba(148,163,184,0.4)' : 'rgba(15,23,42,0.12)',
              },
            ]}
          >
            <View style={styles.menuHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuName, { color: colors.text }]}>{displayName}</Text>
                {email && (
                  <Text style={[styles.menuEmail, { color: colors.text }]}>{email}</Text>
                )}
              </View>
            </View>

            <View style={styles.menuItem}>
              <Text style={[styles.menuItemLabel, { color: colors.text }]}>
                Theme
              </Text>
              <ThemeToggle />
            </View>

            <Pressable
              style={[styles.menuItem, styles.menuItemLogout]}
              onPress={handleLogout}
            >
              <Text
                style={[
                  styles.menuItemLabel,
                  styles.logoutText,
                ]}
              >
                Logout
              </Text>
              <Ionicons name="log-out-outline" size={18} color={colors.text} />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148,163,184,0.4)',
    position: 'relative',
    zIndex: 10,
    elevation: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.display,
    marginTop: 2,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 4,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  menu: {
    position: 'absolute',
    right: 16,
    top: 64,
    minWidth: 220,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 30,
        }),
    zIndex: 50,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 40,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  menuName: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuEmail: {
    fontSize: 13,
    opacity: 0.8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  menuItemLabel: {
    fontSize: 14,
  },
  menuItemLogout: {
    marginTop: 12,
  },
  logoutText: {
    color: Colors.light.error,
  },
});

