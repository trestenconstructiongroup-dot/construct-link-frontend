import Ionicons from '@expo/vector-icons/Ionicons';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../components/Text';
import ThemeToggle from '../../../components/ThemeToggle';
import { Colors, Fonts } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import StaggeredMobileMenu from './StaggeredMobileMenu';

const PILL_NAV_LINKS: { label: string; path: string }[] = [
  { label: 'Find jobs', path: '/find-jobs' },
  { label: 'Find workers', path: '/workers' },
  { label: 'Create Job', path: '/jobs-create' },
  { label: 'Feed', path: '/feed' },
];

const PILL_H = 36;
const PILL_GAP = 10;
const PILL_PAD_X = 22;
const CIRCLE_D = 150;
const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);

function isPathActive(pathname: string, linkPath: string): boolean {
  if (linkPath === '/') return pathname === '/' || pathname === '';
  return pathname === linkPath || pathname.startsWith(linkPath + '/');
}

// Pill nav theme: hover circle + active dot use logo orange (#F99324)
function getPillTheme(isDark: boolean) {
  return isDark
    ? { base: '#F99324', pill: '#11181C', pillText: '#ffffff', hoverText: '#ffffff' }
    : { base: '#F99324', pill: '#ffffff', pillText: '#000000', hoverText: '#ffffff' };
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useTheme();
  const { isAuthenticated, user, logout, avatarUrl } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const pillTheme = getPillTheme(isDark);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pillHoverPath, setPillHoverPath] = useState<string | null>(null);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const dropdownRef = useRef<View>(null);
  const menuToggleTextAnim = useRef(new Animated.Value(0)).current;

  // Per-pill hover animation (reference: expanding circle + label swap)
  const pillAnims = useRef(
    PILL_NAV_LINKS.map(() => ({
      circleScale: new Animated.Value(0),
      defaultLabelY: new Animated.Value(0),
      hoverLabelY: new Animated.Value(PILL_H + 12),
      hoverLabelOpacity: new Animated.Value(0),
    }))
  ).current;

  const pillHoverIndex = pillHoverPath !== null ? PILL_NAV_LINKS.findIndex((p) => p.path === pillHoverPath) : -1;
  const prevPillHoverIndex = useRef(-1);

  useEffect(() => {
    const enter = (i: number) => {
      const a = pillAnims[i];
      if (!a) return;
      Animated.parallel([
        Animated.timing(a.circleScale, { toValue: 1.2, duration: 300, easing: EASE_OUT, useNativeDriver: true }),
        Animated.timing(a.defaultLabelY, { toValue: -(PILL_H + 8), duration: 300, easing: EASE_OUT, useNativeDriver: true }),
        Animated.timing(a.hoverLabelY, { toValue: 0, duration: 300, easing: EASE_OUT, useNativeDriver: true }),
        Animated.timing(a.hoverLabelOpacity, { toValue: 1, duration: 300, easing: EASE_OUT, useNativeDriver: true }),
      ]).start();
    };
    const leave = (i: number) => {
      const a = pillAnims[i];
      if (!a) return;
      Animated.parallel([
        Animated.timing(a.circleScale, { toValue: 0, duration: 200, easing: EASE_OUT, useNativeDriver: true }),
        Animated.timing(a.defaultLabelY, { toValue: 0, duration: 200, easing: EASE_OUT, useNativeDriver: true }),
        Animated.timing(a.hoverLabelY, { toValue: PILL_H + 12, duration: 200, easing: EASE_OUT, useNativeDriver: true }),
        Animated.timing(a.hoverLabelOpacity, { toValue: 0, duration: 200, easing: EASE_OUT, useNativeDriver: true }),
      ]).start();
    };
    if (prevPillHoverIndex.current !== -1 && prevPillHoverIndex.current !== pillHoverIndex) {
      leave(prevPillHoverIndex.current);
    }
    if (pillHoverIndex !== -1) {
      enter(pillHoverIndex);
    }
    prevPillHoverIndex.current = pillHoverIndex;
  }, [pillHoverIndex]);

  useEffect(() => {
    const updateLayout = () => {
      const { width } = Dimensions.get('window');
      setIsMobile(width < 768);
    };

    updateLayout();
    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription?.remove();
  }, []);

  // Animate dropdown
  useEffect(() => {
    Animated.timing(dropdownAnim, {
      toValue: isDropdownOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isDropdownOpen]);

  // Menu/Close text slide when mobile menu opens (web, reactbits-style)
  useEffect(() => {
    if (!isMobile) return;
    Animated.timing(menuToggleTextAnim, {
      toValue: isMobileMenuOpen ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isMobile, isMobileMenuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !(dropdownRef.current as any).contains?.(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (Platform.OS === 'web') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    router.replace('/');
  };

  const dropdownOpacity = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const dropdownTranslateY = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  const logoSource = Platform.OS === 'web'
    ? { uri: '/logo.png' }
    : require('../../../assets/images/logo.png');

  return (
    <View style={[
      styles.navbar, 
      { 
        backgroundColor: colors.background,
        borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      }
    ]}>
      <View style={styles.content}>
        {/* Left: Logo and Brand Name - Clickable Home Button */}
        <Pressable
          style={styles.logoSection}
          onPress={() => router.push('/')}
        >
          <Image 
            source={logoSource} 
            style={styles.logo}
            resizeMode="contain"
          />
          {!isMobile && (
            <Text style={[styles.brandName, { color: colors.text }]}>
              Tresten Construction Group Inc
            </Text>
          )}
        </Pressable>

        {/* Center: Pill Nav (reference style – expanding circle + label swap, black/white by theme) */}
        {!isMobile && isAuthenticated && (
          <View style={styles.pillNavWrapper}>
            <View style={styles.pillNavContainer}>
              {PILL_NAV_LINKS.map(({ label, path }, i) => {
                const active = isPathActive(pathname ?? '', path);
                const a = pillAnims[i];
                return (
                  <Pressable
                    key={path}
                    style={[styles.pillNavItem, { backgroundColor: pillTheme.pill }]}
                    onPress={() => router.push(path as never)}
                    {...(Platform.OS === 'web' && {
                      onMouseEnter: () => setPillHoverPath(path),
                      onMouseLeave: () => setPillHoverPath(null),
                    })}
                  >
                    {/* In-flow label so pill gets correct width (pillInner is absolute and doesn't affect layout) */}
                    <Text
                      style={[styles.pillNavText, styles.pillWidthSpacer, { fontFamily: Fonts.display, color: pillTheme.pillText }]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                    <View style={[styles.pillInner, { pointerEvents: 'none' }]}>
                      {/* Hover circle – expands from bottom center */}
                      <Animated.View
                        style={[
                          styles.pillHoverCircle,
                          {
                            width: CIRCLE_D,
                            height: CIRCLE_D,
                            borderRadius: CIRCLE_D / 2,
                            marginLeft: -CIRCLE_D / 2,
                            backgroundColor: pillTheme.base,
                            transform: [{ scale: a.circleScale }],
                          },
                        ]}
                      />
                      <View style={styles.pillLabelStack}>
                        <Animated.Text
                          style={[
                            styles.pillNavText,
                            { fontFamily: Fonts.display, color: pillTheme.pillText },
                            { transform: [{ translateY: a.defaultLabelY }] },
                          ]}
                        >
                          {label}
                        </Animated.Text>
                        <Animated.Text
                          style={[
                            styles.pillNavText,
                            styles.pillLabelHover,
                            { fontFamily: Fonts.display, color: pillTheme.hoverText },
                            {
                              opacity: a.hoverLabelOpacity,
                              transform: [{ translateY: a.hoverLabelY }],
                            },
                          ]}
                        >
                          {label}
                        </Animated.Text>
                      </View>
                    </View>
                    {active && (
                      <View style={styles.pillActiveDotWrap}>
                        <View style={[styles.pillActiveDot, { backgroundColor: pillTheme.base }]} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Right: Auth Links, User Avatar, and Theme Toggle - Desktop only */}
        {!isMobile && (
          <View style={styles.rightSection}>
            {isAuthenticated ? (
              <View style={styles.userSection}>
                {/* Notification bell - to the left of the green circle */}
                <Pressable style={styles.notificationBellBtn}>
                  <Ionicons name="notifications-outline" size={22} color={colors.text} />
                </Pressable>
                <Pressable
                  style={styles.userAvatar}
                  onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]} />
                  )}
                </Pressable>
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <Animated.View
                    ref={dropdownRef}
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: colors.background,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        opacity: dropdownOpacity,
                        transform: [{ translateY: dropdownTranslateY }],
                      },
                    ]}
                  >
                    <View style={styles.dropdownHeader}>
                      {avatarUrl ? (
                        <Image
                          source={{ uri: avatarUrl }}
                          style={styles.dropdownAvatarImage}
                        />
                      ) : (
                        <View style={[styles.dropdownAvatar, { backgroundColor: colors.accent }]} />
                      )}
                      <View style={styles.dropdownUserInfo}>
                        <Text style={[styles.dropdownUserName, { color: colors.text }]}>
                          {user?.full_name || user?.email || 'User'}
                        </Text>
                        <Text style={[styles.dropdownUserEmail, { color: colors.text }]}>
                          {user?.email}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.dropdownDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]} />
                    <Pressable
                      style={styles.dropdownItem}
                      onPress={() => {
                        setIsDropdownOpen(false);
                        router.push('/profile' as never);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                        Profile
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.dropdownItem}
                      onPress={handleLogout}
                    >
                      <Text style={[styles.dropdownItemText, { color: colors.error }]}>
                        Log Out
                      </Text>
                    </Pressable>
                  </Animated.View>
                )}
              </View>
            ) : (
              <>
                <Pressable
                  style={[styles.signUpButton, { backgroundColor: colors.text }]}
                  onPress={() => router.push('/login')}
                >
                  <Text style={[styles.signUpText, { color: colors.background }]}>
                    Sign In
                  </Text>
                </Pressable>
              </>
            )}
            <View style={styles.toggleContainer}>
              <ThemeToggle />
            </View>
          </View>
        )}

        {/* Mobile Menu Button - Mobile only */}
        {isMobile && (
          <View style={styles.mobileRightSection}>
            <View style={styles.toggleContainer}>
              <ThemeToggle />
            </View>
            <Pressable
              data-sm-toggle
              style={[
                styles.mobileMenuButton,
                Platform.OS === 'web' && styles.mobileMenuButtonWeb,
              ]}
              onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {Platform.OS === 'web' ? (
                /* Menu/Close text (left) + hamburger → X icon (reactbits-style) */
                <>
                  <View style={styles.menuToggleTextWrap}>
                    <Animated.View
                      style={[
                        styles.menuToggleTextInner,
                        {
                          transform: [
                            {
                              translateY: menuToggleTextAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, -20],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Text style={[styles.menuToggleLine, { color: colors.text }]}>
                        Menu
                      </Text>
                      <Text style={[styles.menuToggleLine, { color: colors.text }]}>
                        Close
                      </Text>
                    </Animated.View>
                  </View>
                  <View
                    style={[
                      styles.menuIconWrap,
                      isMobileMenuOpen && styles.menuIconWrapOpen,
                    ]}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: colors.text }]} />
                    <View
                      style={[
                        styles.menuIcon,
                        styles.menuIconV,
                        { backgroundColor: colors.text },
                      ]}
                    />
                  </View>
                </>
              ) : (
                /* Native: classic 3-line hamburger */
                <>
                  <View style={[styles.menuIconLine, { backgroundColor: colors.text }]} />
                  <View style={[styles.menuIconLine, { backgroundColor: colors.text }]} />
                  <View style={[styles.menuIconLine, { backgroundColor: colors.text }]} />
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* Staggered mobile menu (web only) – same design/transitions as reactbits staggered-menu */}
      {isMobile && Platform.OS === 'web' && (
        <StaggeredMobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          position="right"
          prelayerColors={
            isDark
              ? ['#005580', '#006ba3', colors.accent]
              : ['#66b3e3', '#3399d6', colors.accent]
          }
          accentColor={colors.accent}
          textColor={colors.text}
          panelBackground={colors.background}
          fontFamily={Fonts.display}
          items={
            isAuthenticated
              ? PILL_NAV_LINKS.map(({ label, path }) => ({
                  label,
                  path,
                  ariaLabel: `Go to ${label}`,
                }))
              : []
          }
          displayItemNumbering={true}
          isAuthenticated={isAuthenticated}
          user={user}
          avatarUrl={avatarUrl || undefined}
          profilePath="/account"
          onProfile={() => router.push('/account' as never)}
          onLogout={handleLogout}
          onLogin={() => router.push('/login')}
          onNavItemPress={(path) => router.push(path as never)}
          closeOnClickAway={true}
        />
      )}

      {/* Mobile Menu (native / non-web fallback) */}
      {isMobile && Platform.OS !== 'web' && isMobileMenuOpen && (
        <View
          style={[
            styles.mobileMenu,
            {
              backgroundColor: colors.background,
              borderTopColor: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
        >
          {PILL_NAV_LINKS.map(({ label, path }) => (
            <Pressable
              key={path}
              style={styles.mobileNavLink}
              onPress={() => {
                setIsMobileMenuOpen(false);
                router.push(path as never);
              }}
            >
              <Text style={[styles.mobileNavLinkText, { color: colors.text }]}>
                {label}
              </Text>
            </Pressable>
          ))}
          {isAuthenticated ? (
            <>
              <View style={styles.mobileUserInfo}>
                <View
                  style={[styles.mobileAvatar, { backgroundColor: colors.accent }]}
                />
                <View>
                  <Text style={[styles.mobileUserName, { color: colors.text }]}>
                    {user?.full_name || user?.email || 'User'}
                  </Text>
                  <Text style={[styles.mobileUserEmail, { color: colors.text }]}>
                    {user?.email}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.mobileNavLink}
                onPress={() => {
                  setIsMobileMenuOpen(false);
                  router.push('/profile' as never);
                }}
              >
                <Text style={[styles.mobileNavLinkText, { color: colors.text }]}>
                  Profile
                </Text>
              </Pressable>
              <Pressable
                style={styles.mobileLogoutButton}
                onPress={async () => {
                  setIsMobileMenuOpen(false);
                  await logout();
                  router.replace('/');
                }}
              >
                <Text style={[styles.mobileLogoutText, { color: colors.error }]}>
                  Log Out
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                style={[styles.mobileSignUpButton, { backgroundColor: colors.text }]}
                onPress={() => {
                  router.push('/login');
                  setIsMobileMenuOpen(false);
                }}
              >
                <Text style={[styles.mobileSignUpText, { color: colors.background }]}>
                  Sign In
                </Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    ...Platform.select({
      web: {
        gap: 40,
        zIndex: 1001,
        position: 'relative' as any,
      },
    }),
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'opacity 0.2s ease' as any,
        ':hover': {
          opacity: 0.8 as any,
        } as any,
      },
    }),
  },
  logo: {
    width: 32,
    height: 32,
    ...Platform.select({
      web: {
        width: 44,
        height: 44,
      },
    }),
  },
  brandName: {
    fontSize: 18,
    fontFamily: Fonts.display,
    fontWeight: 'normal',
  },
  pillNavWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    height: PILL_H + 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9999,
    gap: PILL_GAP,
  },
  pillNavItem: {
    position: 'relative',
    height: PILL_H,
    paddingHorizontal: PILL_PAD_X,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    flexGrow: 0,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
      },
    }),
  },
  pillInner: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pillHoverCircle: {
    position: 'absolute',
    left: '50%' as any,
    bottom: -CIRCLE_D / 2,
    ...Platform.select({
      web: {
        transformOrigin: '50% 100%' as any,
      },
    }),
  },
  pillLabelStack: {
    position: 'relative',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  pillNavText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
    ...Platform.select({
      web: {
        textTransform: 'uppercase' as any,
        whiteSpace: 'nowrap' as any,
        textAlign: 'center' as any,
      },
    }),
  },
  pillWidthSpacer: {
    opacity: 0,
    pointerEvents: 'none',
  },
  pillLabelHover: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActiveDotWrap: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4,
  },
  pillActiveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flexShrink: 0,
  },
  mobileRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexShrink: 0,
  },
  authLink: {
    paddingVertical: 8,
  },
  authLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signUpButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 24,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleContainer: {
    marginLeft: 8,
  },
  mobileMenuButton: {
    flexDirection: 'column',
    gap: 4,
    padding: 8,
  },
  mobileMenuButtonWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'transform 0.25s ease' as any,
      },
    }),
  },
  menuToggleTextWrap: {
    height: 20,
    minHeight: 20,
    maxHeight: 20,
    overflow: 'hidden',
    alignSelf: 'center',
    justifyContent: 'flex-start',
    ...Platform.select({
      web: {
        position: 'relative' as any,
        isolation: 'isolate' as any,
      },
    }),
  },
  menuToggleTextInner: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    height: 40,
    justifyContent: 'flex-start',
  },
  menuToggleLine: {
    height: 20,
    minHeight: 20,
    maxHeight: 20,
    lineHeight: 20,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
    marginVertical: 0,
    ...Platform.select({
      web: {
        whiteSpace: 'nowrap' as any,
        display: 'block' as any,
        overflow: 'hidden' as any,
      },
    }),
  },
  menuIconWrap: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)' as any,
      },
    }),
  },
  menuIcon: {
    position: 'absolute',
    width: 20,
    height: 2,
    borderRadius: 1,
  },
  menuIconV: {
    ...Platform.select({
      web: {
        transform: 'rotate(90deg)' as any,
      },
    }),
  },
  menuIconWrapOpen: {
    ...Platform.select({
      web: {
        transform: [{ rotate: '45deg' }] as any,
      },
    }),
  },
  menuIconLine: {
    width: 24,
    height: 2,
    borderRadius: 1,
  },
  mobileMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    padding: 20,
    gap: 16,
    borderTopWidth: 1,
  },
  mobileNavLink: {
    paddingVertical: 12,
  },
  mobileNavLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mobileSignUpButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  mobileSignUpText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userSection: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'transform 0.2s ease' as any,
        ':hover': {
          transform: 'scale(1.05)' as any,
        } as any,
      },
    }),
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  notificationBellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'opacity 0.2s ease, transform 0.2s ease' as any,
      },
    }),
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    minWidth: 220,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' as any,
        zIndex: 1001,
        maxHeight: '70vh' as any,
        overflowY: 'auto' as any,
      },
    }),
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
  },
  dropdownAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  dropdownUserInfo: {
    flex: 1,
  },
  dropdownUserName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  dropdownUserEmail: {
    fontSize: 12,
    opacity: 0.7,
  },
  dropdownDivider: {
    height: 1,
    marginVertical: 8,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'background-color 0.2s ease' as any,
        ':hover': {
          backgroundColor: 'rgba(239, 68, 68, 0.1)' as any,
        } as any,
      },
    }),
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mobileUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  mobileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  mobileUserName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  mobileUserEmail: {
    fontSize: 12,
    opacity: 0.7,
  },
  mobileLogoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  mobileLogoutText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
