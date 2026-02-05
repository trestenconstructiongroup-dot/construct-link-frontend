import React, { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const slideAnim = useRef(new Animated.Value(isDark ? 22 : 0)).current;
  const rotateAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const starsOpacity = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const moonDotsOpacity = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isDark ? 22 : 0,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue: isDark ? 1 : 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(starsOpacity, {
        toValue: isDark ? 1 : 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(moonDotsOpacity, {
        toValue: isDark ? 1 : 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isDark]);

  const slideStyle = {
    transform: [{ translateX: slideAnim }],
  };

  const rotateStyle = {
    transform: [
      {
        rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  const handlePress = () => {
    // Subtle vibration and tap feedback on mobile only
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleTheme();
  };

  return (
    <Pressable onPress={handlePress} style={styles.switch}>
      <View style={[styles.slider, isDark && styles.sliderDark]}>
        {/* Outer animated view for translateX (useNativeDriver: false) */}
        <Animated.View style={[styles.sunMoon, slideStyle]}>
          {/* Inner animated view for rotate (useNativeDriver: true) */}
          <Animated.View style={[
            styles.sunMoonInner, 
            rotateStyle,
            isDark && styles.sunMoonInnerDark
          ]}>
            {/* Moon dots */}
            <Animated.View style={[styles.moonDotsContainer, { opacity: moonDotsOpacity }]}>
              <View style={[styles.moonDot, styles.moonDot1]} />
              <View style={[styles.moonDot, styles.moonDot2]} />
              <View style={[styles.moonDot, styles.moonDot3]} />
            </Animated.View>

            {/* Light rays (sun) */}
            {!isDark && (
              <>
                <View style={[styles.lightRay, styles.lightRay1]} />
                <View style={[styles.lightRay, styles.lightRay2]} />
                <View style={[styles.lightRay, styles.lightRay3]} />
              </>
            )}

            {/* Clouds */}
            <View style={[styles.cloud, styles.cloud1, isDark && styles.cloudDark]} />
            <View style={[styles.cloud, styles.cloud2, isDark && styles.cloudDark]} />
            <View style={[styles.cloud, styles.cloud3, isDark && styles.cloudDark]} />
            <View style={[styles.cloud, styles.cloud4]} />
            <View style={[styles.cloud, styles.cloud5]} />
            <View style={[styles.cloud, styles.cloud6]} />
          </Animated.View>
        </Animated.View>

        {/* Stars */}
        <Animated.View style={[styles.starsContainer, { opacity: starsOpacity }]}>
          <View style={[styles.star, styles.star1]} />
          <View style={[styles.star, styles.star2]} />
          <View style={[styles.star, styles.star3]} />
          <View style={[styles.star, styles.star4]} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  switch: {
    position: 'relative',
    width: 50,
    height: 28,
  },
  slider: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196f3',
    borderRadius: 28,
    overflow: 'hidden',
  },
  sliderDark: {
    backgroundColor: '#000000',
  },
  sunMoon: {
    position: 'absolute',
    height: 22,
    width: 22,
    left: 3,
    bottom: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunMoonInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFEB3B',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunMoonInnerDark: {
    backgroundColor: '#ffffff',
  },
  moonDotsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  moonDot: {
    position: 'absolute',
    backgroundColor: '#9E9E9E',
    borderRadius: 50,
  },
  moonDot1: {
    left: 8,
    top: 2,
    width: 5,
    height: 5,
  },
  moonDot2: {
    left: 2,
    top: 8,
    width: 8,
    height: 8,
  },
  moonDot3: {
    left: 13,
    top: 15,
    width: 2,
    height: 2,
  },
  lightRay: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  lightRay1: {
    left: -7,
    top: -7,
    width: 36,
    height: 36,
  },
  lightRay2: {
    left: -11,
    top: -11,
    width: 46,
    height: 46,
  },
  lightRay3: {
    left: -15,
    top: -15,
    width: 50,
    height: 50,
  },
  cloud: {
    position: 'absolute',
    backgroundColor: '#EEEEEE',
    borderRadius: 50,
  },
  cloudDark: {
    backgroundColor: '#CCCCCC',
  },
  cloud1: {
    left: 25,
    top: 12,
    width: 33,
    height: 17,
  },
  cloud2: {
    left: 37,
    top: 8,
    width: 17,
    height: 8,
  },
  cloud3: {
    left: 15,
    top: 20,
    width: 25,
    height: 12,
  },
  cloud4: {
    left: 30,
    top: 15,
    width: 33,
    height: 17,
  },
  cloud5: {
    left: 40,
    top: 12,
    width: 17,
    height: 8,
  },
  cloud6: {
    left: 18,
    top: 22,
    width: 25,
    height: 12,
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 1,
  },
  star1: {
    width: 3,
    height: 3,
    top: 2,
    left: 2,
    transform: [{ rotate: '45deg' }],
  },
  star2: {
    width: 2,
    height: 2,
    top: 13,
    left: 2,
    transform: [{ rotate: '45deg' }],
  },
  star3: {
    width: 2,
    height: 2,
    top: 17,
    left: 8,
    transform: [{ rotate: '45deg' }],
  },
  star4: {
    width: 4,
    height: 4,
    top: 0,
    left: 15,
    transform: [{ rotate: '45deg' }],
  },
});
