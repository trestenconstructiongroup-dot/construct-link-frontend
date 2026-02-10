import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Colors, Fonts } from '../../../../constants/theme';
import { HOW_IT_WORKS_STEPS } from './_constants';

interface HowItWorksProps {
  isSmallScreen: boolean;
}

function HowItWorksComponent({ isSmallScreen }: HowItWorksProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <View style={[styles.container, isSmallScreen && styles.containerSmall]}>
      <Text style={[styles.heading, { color: colors.text }, isSmallScreen && styles.headingSmall]}>
        How It Works
      </Text>
      <View style={[styles.stepsRow, isSmallScreen && styles.stepsColumn]}>
        {HOW_IT_WORKS_STEPS.map((step, index) => (
          <View
            key={step.title}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.stepNumber, { backgroundColor: colors.accent }]}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Ionicons
              name={step.icon as any}
              size={40}
              color={colors.accent}
              style={styles.icon}
            />
            <Text style={[styles.title, { color: colors.text }]}>{step.title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {step.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
    marginBottom: 40,
  } as ViewStyle,
  containerSmall: {
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 24,
  } as ViewStyle,
  heading: {
    fontSize: 36,
    fontFamily: Fonts.display,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 40,
  } as TextStyle,
  headingSmall: {
    fontSize: 28,
    marginBottom: 24,
  } as TextStyle,
  stepsRow: {
    flexDirection: 'row',
    gap: 32,
    width: '100%',
  } as ViewStyle,
  stepsColumn: {
    flexDirection: 'column',
    gap: 20,
  } as ViewStyle,
  card: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    gap: 12,
  } as ViewStyle,
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  stepNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: Fonts.heading,
    fontWeight: '600',
  } as TextStyle,
  icon: {
    marginVertical: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.heading,
    fontWeight: '600',
    textAlign: 'center',
  } as TextStyle,
  description: {
    fontSize: 14,
    fontFamily: Fonts.body,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
};

export default React.memo(HowItWorksComponent);
