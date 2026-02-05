import React, { useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

type AnimatedImageSlotProps = {
  slot: any;
  index: number;
  maxImageArea: number;
  parallaxX: any;
  parallaxY: any;
  source: any;
};

// Single image slot with entrance + parallax animation
export default function AnimatedImageSlot({
  slot,
  index,
  maxImageArea,
  parallaxX,
  parallaxY,
  source,
}: AnimatedImageSlotProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const translateY = useSharedValue(50);

  useEffect(() => {
    opacity.value = withDelay(
      slot.delay,
      withTiming(1, { duration: 600 })
    );
    scale.value = withDelay(
      slot.delay,
      withSpring(1, { damping: 12, stiffness: 100 })
    );
    translateY.value = withDelay(
      slot.delay,
      withSpring(0, { damping: 12, stiffness: 100 })
    );
  }, []);

  const animatedImageStyle = useAnimatedStyle(() => {
    // Parallax effect based on position
    const parallaxIntensity = (slot.top / maxImageArea) * 0.3;
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
        {
          translateX: parallaxX.value * parallaxIntensity,
        },
        {
          translateY: parallaxY.value * parallaxIntensity,
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.imageSlot,
        {
          width: slot.size,
          height: slot.size,
          borderRadius: slot.borderRadius,
          top: slot.top,
          left: slot.left !== undefined ? slot.left : undefined,
          right: slot.right !== undefined ? slot.right : undefined,
        },
        animatedImageStyle,
      ]}
    >
      <Image
        source={source}
        style={styles.image}
        resizeMode="cover"
        onError={(error) => {
          console.log('Image load error for slot', index, error.nativeEvent.error);
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  imageSlot: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

