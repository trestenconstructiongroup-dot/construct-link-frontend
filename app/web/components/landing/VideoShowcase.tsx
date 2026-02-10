import React from 'react';
import { View, Text, Platform, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Colors, Fonts } from '../../../../constants/theme';

const YOUTUBE_EMBED_URL = 'https://www.youtube.com/embed/4BzjUq921Y4';

interface VideoShowcaseProps {
  isSmallScreen: boolean;
}

function VideoShowcaseComponent({ isSmallScreen }: VideoShowcaseProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <View style={[styles.container, isSmallScreen && styles.containerSmall]}>
      <Text style={[styles.heading, { color: colors.text }, isSmallScreen && styles.headingSmall]}>
        See Tresten Construction Group Inc in Action
      </Text>
      {Platform.OS === 'web' ? (
        <div style={{
          position: 'relative' as const,
          width: '100%',
          maxWidth: 900,
          aspectRatio: '16 / 9',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: isDark
            ? '0 8px 32px rgba(0, 0, 0, 0.6)'
            : '0 8px 32px rgba(15, 23, 42, 0.15)',
          alignSelf: 'center',
        }}>
          <iframe
            src={YOUTUBE_EMBED_URL}
            title="Construct Link Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{
              position: 'absolute' as const,
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </div>
      ) : (
        <View style={[styles.placeholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            Video available on web
          </Text>
        </View>
      )}
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
    marginTop: 80,
    marginBottom: 40,
  } as ViewStyle,
  containerSmall: {
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 24,
  } as ViewStyle,
  heading: {
    fontSize: 36,
    fontFamily: Fonts.display,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
  } as TextStyle,
  headingSmall: {
    fontSize: 28,
    marginBottom: 20,
  } as TextStyle,
  placeholder: {
    width: '100%',
    maxWidth: 900,
    aspectRatio: 16 / 9,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  placeholderText: {
    fontSize: 16,
    fontFamily: Fonts.body,
  } as TextStyle,
};

export default React.memo(VideoShowcaseComponent);
