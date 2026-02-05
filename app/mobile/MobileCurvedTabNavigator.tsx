import Ionicons from '@expo/vector-icons/Ionicons';
import { usePathname } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import MobileTopNav from './MobileTopNav';

import CreateWorkPage from './create-work';
import DashboardPage from './dashboard';
import JobsPage from './jobs';
import ProfilePage from './profile';
import WorkersPage from './workers';

const COMPANY_BLUE = 'rgb(0, 130, 201)';
const COMPANY_ORANGE = 'rgb(249, 147, 36)';

const TABS = [
  {
    key: 'dashboard',
    route: '/mobile/dashboard',
    icon: 'home-outline',
    component: DashboardPage,
    title: 'ConstructionLink',
  },
  {
    key: 'workers',
    route: '/mobile/workers',
    icon: 'people-outline',
    component: WorkersPage,
    title: 'Workers',
  },
  {
    key: 'create-work',
    route: '/mobile/create-work',
    icon: 'add',
    component: CreateWorkPage,
    title: 'Create Work',
  },
  {
    key: 'jobs',
    route: '/mobile/jobs',
    icon: 'briefcase-outline',
    component: JobsPage,
    title: 'Jobs',
  },
  {
    key: 'profile',
    route: '/mobile/profile',
    icon: 'person-outline',
    component: ProfilePage,
    title: 'Profile',
  },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function getActiveIndex(pathname: string): number {
  const match = TABS.findIndex((t) => pathname.startsWith(t.route));
  return match === -1 ? 0 : match;
}

export default function MobileCurvedTabNavigator() {
  const pathname = usePathname();
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const { width } = Dimensions.get('window');
  const tabWidth = width / TABS.length;

  const initialIndex = useMemo(() => getActiveIndex(pathname), [pathname]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [menuOpen, setMenuOpen] = useState(false);

  // Animated value that represents the selected tab index (drives circle/notch position)
  const indexAnim = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(indexAnim, {
      toValue: activeIndex,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();
  }, [activeIndex, indexAnim]);

  // Extra padding so blue circle and bar sit above OS nav and don't overlap
  const bottomInset = Math.max(insets.bottom, 20);

  // Positions for the moving notch and floating circle; both centered under the active tab icon.
  const NOTCH_SIZE = 84;
  const CIRCLE_SIZE = 52;
  const notchOffset = (tabWidth - NOTCH_SIZE) / 2;
  const circleOffset = (tabWidth - CIRCLE_SIZE) / 2;

  const notchTranslateX = indexAnim.interpolate({
    inputRange: [0, TABS.length - 1],
    outputRange: [notchOffset, notchOffset + tabWidth * (TABS.length - 1)],
  });

  const circleTranslateX = indexAnim.interpolate({
    inputRange: [0, TABS.length - 1],
    outputRange: [circleOffset, circleOffset + tabWidth * (TABS.length - 1)],
  });

  // Vertical alignment: circle and notch sit so the raised icon sits inside the blue circle.
  const ICON_RISE = 12;
  const NOTCH_TRANSLATE_Y = -18;
  const CIRCLE_TRANSLATE_Y = -24;

  const ActiveComponent = TABS[activeIndex].component;
  const activeTitle = TABS[activeIndex].title;
  const showBack = TABS[activeIndex].key !== 'dashboard';

  const handlePress = (tabKey: TabKey) => {
    if (menuOpen) {
      setMenuOpen(false);
    }
    const index = TABS.findIndex((t) => t.key === tabKey);
    if (index === -1 || index === activeIndex) return;
    setActiveIndex(index);
  };

  const handleBack = () => {
    if (menuOpen) {
      setMenuOpen(false);
    }
    // Navigate back to the main dashboard tab
    setActiveIndex(0);
  };

  return (
    <View
      style={[
        styles.screenRoot,
        { backgroundColor: colors.background },
      ]}
    >
      <MobileTopNav
        title={activeTitle}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        showBack={showBack}
        onBack={handleBack}
      />

      <View
        style={styles.content}
        // Tapping anywhere in the content while the menu is open should close it
        pointerEvents={menuOpen ? 'box-none' : 'auto'}
      >
        {menuOpen && (
          <Animated.View
            style={StyleSheet.absoluteFill}
            pointerEvents="auto"
          >
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setMenuOpen(false)} />
          </Animated.View>
        )}
        <ActiveComponent />
      </View>

      <View style={[styles.barWrapper, { paddingBottom: bottomInset }]}>
        <View style={[styles.barBase, { backgroundColor: isDark ? '#020617' : '#020617' }]}>
          {/* Moving notch that curves around the active tab */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.notch,
              {
                transform: [
                  { translateX: notchTranslateX },
                  { translateY: NOTCH_TRANSLATE_Y },
                ],
                backgroundColor: colors.background,
              },
            ]}
          />

          {/* Floating circle that sits behind the active icon (no own icon) */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.floatingCircle,
              {
                transform: [
                  { translateX: circleTranslateX },
                  { translateY: CIRCLE_TRANSLATE_Y },
                ],
                backgroundColor: COMPANY_BLUE,
              },
            ]}
          />

          {/* Row of icons: rise and scale driven so active icon sits in the blue circle */}
          <View style={styles.iconRow}>
            {TABS.map((tab, index) => {
              const isActive = index === activeIndex;
              const riseY = indexAnim.interpolate({
                inputRange: TABS.map((_, i) => i),
                outputRange: TABS.map((_, i) => (i === index ? -ICON_RISE : 0)),
              });
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.iconHitbox}
                  activeOpacity={0.8}
                  onPress={() => handlePress(tab.key)}
                >
                  <Animated.View
                    style={{
                      transform: [
                        { translateY: riseY },
                        { scale: isActive ? 1.05 : 1 },
                      ],
                    }}
                  >
                    <Ionicons
                      name={tab.icon as any}
                      size={24}
                      color={isActive ? '#ffffff' : '#94a3b8'}
                    />
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  barWrapper: {
    paddingHorizontal: 0,
  },
  barBase: {
    height: 72,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'visible',
    borderWidth: 0,
    justifyContent: 'flex-end',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingBottom: 14,
  },
  iconHitbox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notch: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    top: 0,
    left: 0,
  },
  floatingCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
        }),
  },
});
