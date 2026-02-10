import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Fonts } from '../constants/theme';
import ThemeToggle from '../components/ThemeToggle';
import { Text } from '../components/Text';
import AnimatedImageSlot from '../components/mobile/AnimatedImageSlot';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Alternate image source (image2) - used for a specific slot
// IMPORTANT: For mobile native, ensure you also copy
// public/images/landingPageImages/image2.png to:
// assets/images/landingPageImages/image2.png
const image2Source = Platform.select({
  web: { uri: '/images/landingPageImages/image2.png' },
  ios: require('../assets/images/landingPageImages/image2.png'),
  android: require('../assets/images/landingPageImages/image2.png'),
  default: { uri: '/images/landingPageImages/image2.png' },
});

// (We no longer use Image1 / other images on mobile landing;
// image2 is the only visible image here.)

export default function MobileLanding() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const colors = Colors[isDark ? 'dark' : 'light'];

  // Swipe gesture values
  const arrowTranslateX = useSharedValue(0); // Only arrow slides
  const swipeProgress = useSharedValue(0);
  const pageTranslateX = useSharedValue(0); // Page content slides
  const pageOpacity = useSharedValue(1); // Page fades out
  const lastHapticProgress = useRef(0);

  // Parallax values for device motion simulation
  const parallaxX = useSharedValue(0);
  const parallaxY = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);

  // We now only show a single centered image (image2) on the mobile landing,
  // but keep the same animated/parallax behavior via AnimatedImageSlot.
  // Use responsive values so the composition is consistent across devices.
  const maxImageArea = SCREEN_HEIGHT * 0.5; // reserve top ~50% for the logo

  const imageSize = Math.min(SCREEN_WIDTH * 0.7, maxImageArea * 0.7);
  const imageTop = maxImageArea / 2 - imageSize / 2;
  const imageLeft = SCREEN_WIDTH / 2 - imageSize / 2;

  const imageSlots = [
    {
      // Centered within the top image area
      top: imageTop,
      left: imageLeft,
      size: imageSize,
      borderRadius: imageSize / 3.5,
      delay: 300,
    },
  ];

  // Simulate device motion for parallax (using a simple animation)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate subtle device motion
      parallaxX.value = withSpring(Math.sin(Date.now() / 2000) * 5, { damping: 15 });
      parallaxY.value = withSpring(Math.cos(Date.now() / 2500) * 5, { damping: 15 });
    }, 50);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simple entrance animation for the text block
  useEffect(() => {
    textOpacity.value = withTiming(1, { duration: 500 });
    textTranslateY.value = withTiming(0, { duration: 500 });
  }, []);

  // Haptic feedback function - more finely graded by position
  const triggerHaptic = (intensity: number) => {
    // Clamp 0–1 just in case
    const t = Math.max(0, Math.min(1, intensity));

    // Map to more gradual bands:
    // 0.00–0.20: very soft, occasional Light
    // 0.20–0.40: Light
    // 0.40–0.60: between Light/Medium (we'll alternate)
    // 0.60–0.80: Medium
    // 0.80–1.00: Heavy
    let style: Haptics.ImpactFeedbackStyle;

    if (t < 0.2) {
      style = Haptics.ImpactFeedbackStyle.Light;
    } else if (t < 0.4) {
      style = Haptics.ImpactFeedbackStyle.Light;
    } else if (t < 0.6) {
      // Mid band: alternate between Light and Medium for more nuance
      style =
        Math.round(t * 10) % 2 === 0
          ? Haptics.ImpactFeedbackStyle.Light
          : Haptics.ImpactFeedbackStyle.Medium;
    } else if (t < 0.8) {
      style = Haptics.ImpactFeedbackStyle.Medium;
    } else {
      style = Haptics.ImpactFeedbackStyle.Heavy;
    }

    Haptics.impactAsync(style);
  };

  // Swipe gesture handler
  const panGesture = Gesture.Pan()
    .onStart(() => {
      swipeProgress.value = 0;
      arrowTranslateX.value = 0;
      pageTranslateX.value = 0;
      pageOpacity.value = 1;
    })
    .onUpdate((event) => {
      const translationX = Math.max(0, event.translationX);
      const maxSwipeDistance = SCREEN_WIDTH * 0.7;
      const progress = Math.min(1, translationX / maxSwipeDistance);
      
      swipeProgress.value = progress;
      
      // Only arrow slides, not the whole button
      arrowTranslateX.value = translationX;
      
      // Page content slides and fades
      pageTranslateX.value = translationX;
      pageOpacity.value = interpolate(
        progress,
        [0, 1],
        [1, 0],
        Extrapolate.CLAMP
      );

      // Gradual haptic feedback - intensity increases with position (closer to right = more vibration)
      const hapticIntensity = progress; // 0 to 1, increases as slider moves right
      lastHapticProgress.current = progress;
      runOnJS(triggerHaptic)(hapticIntensity);
    })
    .onEnd(() => {
      const progress = swipeProgress.value;
      if (progress > 0.67) { // 2/3 threshold
        // Complete swipe - slide page out and navigate
        pageTranslateX.value = withTiming(SCREEN_WIDTH, { duration: 400 });
        pageOpacity.value = withTiming(0, { duration: 400 });
        arrowTranslateX.value = withTiming(SCREEN_WIDTH, { duration: 400 }, () => {
          // After swipe completes, decide where to go:
          // - If authenticated: go to mobile dashboard
          // - If not authenticated: go to login page
          const targetRoute = isAuthenticated ? '/mobile/dashboard' : '/login';
          runOnJS(router.push)(targetRoute);
        });
      } else {
        // Spring back
        arrowTranslateX.value = withSpring(0);
        pageTranslateX.value = withSpring(0);
        swipeProgress.value = withSpring(0);
        pageOpacity.value = withSpring(1);
      }
    });

  // Animated styles for arrow (only arrow slides)
  const arrowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: arrowTranslateX.value }],
    };
  });

  // Animated style for blue button background (fades out at 2/3)
  const buttonBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      swipeProgress.value,
      [0, 0.67, 1],
      [1, 0, 0],
      Extrapolate.CLAMP
    );
    return {
      opacity,
    };
  });

  // Animated style for page content (slides and fades)
  const pageContentStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: pageTranslateX.value }],
      opacity: pageOpacity.value,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ translateY: textTranslateY.value }],
    };
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Page content that slides/fades */}
        <Animated.View style={pageContentStyle}>
          {/* Theme Toggle - Top Right */}
          <View style={styles.toggleContainer}>
            <ThemeToggle />
          </View>

          {/* Single centered image (image2) with animations and parallax */}
          {imageSlots.map((slot, index) => (
            <AnimatedImageSlot
              key={index}
              slot={slot}
              index={index}
              maxImageArea={maxImageArea}
              parallaxX={parallaxX}
              parallaxY={parallaxY}
              source={image2Source}
            />
          ))}

          {/* Text Section - Centered, spacing tied to logo area for consistency */}
          <Animated.View
            style={[
              styles.textContainer,
              { top: maxImageArea + 16 }, // fixed gap below image on all devices
              textAnimatedStyle,
            ]}
          >
            <Text
              style={[
                styles.heading,
                { color: colors.text, fontFamily: Fonts.display },
              ]}
            >
              Connect to Real Construction Work Faster
            </Text>
            <Text style={[styles.subHeading, { color: colors.text }]}>
              Find construction jobs and skilled workers in one powerful marketplace.
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Swipe to Start Button with gesture handler - stays fixed, only fades */}
        <GestureDetector gesture={panGesture}>
          <View style={styles.swipeButtonContainer}>
            {/* Blue button background - stays fixed, only fades out at 2/3 */}
            <Animated.View 
              style={[
                styles.swipeButton, 
                { backgroundColor: '#2196F3' },
                buttonBackgroundStyle
              ]}
            >
              <View style={styles.swipeButtonTextContainer}>
                <Text style={[styles.swipeButtonText, { color: '#ffffff' }]}>Swipe to start</Text>
              </View>
            </Animated.View>
            
            {/* Arrow icon - only this slides, positioned absolutely */}
            <Animated.View 
              style={[
                styles.arrowIconContainer,
                arrowStyle
              ]}
            >
              <View style={styles.arrowIcon} />
            </Animated.View>
          </View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    paddingBottom: 40,
  },
  toggleContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
  },
  imageSlot: {
    position: 'absolute',
    overflow: 'hidden',
    // Remove solid background so only the image is visible
    backgroundColor: 'transparent',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    position: 'absolute',
    // Place text safely above the swipe button on all screen heights
    top: SCREEN_HEIGHT * 0.58,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    alignItems: 'center',
    zIndex: 10,
    paddingTop: 2,
  },
  heading: {
    // Larger, bolder hero heading for the main tagline
    fontSize: 46,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 48,
  },
  subHeading: {
    fontSize: 16,
    // Use normal weight so Inter variant weight is applied correctly
    fontWeight: 'normal',
    textAlign: 'center',
    lineHeight: 22,
  },
  swipeButtonContainer: {
    position: 'absolute',
    bottom: 74,
    left: 20,
    right: 20,
    height: 56,
    zIndex: 10,
  },
  swipeButton: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  arrowIconContainer: {
    position: 'absolute',
    left: 16,
    top: 12, // center vertically within 56px blue bar
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 11,
  },
  swipeButtonTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    width: 12,
    height: 12,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderRightColor: '#000000',
    borderTopColor: '#000000',
    transform: [{ rotate: '45deg' }],
  },
  swipeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
