import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Image, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/theme';

/**
 * Full-screen loader that displays the app logo with a heartbeat pulse effect.
 * Used as the loading screen while auth state is being resolved.
 */
export default function LogoLoader() {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Heartbeat: scale 1 → 1.15 → 1 → 1.08 → 1, then repeat
    const heartbeat = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ]),
    );
    heartbeat.start();

    return () => heartbeat.stop();
  }, [scale, opacity]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { minHeight: '100vh' as any },
    }),
  },
  logo: {
    width: 90,
    height: 90,
  },
});
