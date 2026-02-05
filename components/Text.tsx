import React from 'react';
import { Text as RNText, TextProps, Platform } from 'react-native';
import { Fonts } from '../constants/theme';

export function Text({ style, ...props }: TextProps) {
  const fonts = Fonts;
  
  return (
    <RNText
      style={[
        {
          fontFamily: fonts?.sans,
          letterSpacing: Platform.select({
            web: 0.5,
            default: 0.3,
          }),
        },
        style,
      ]}
      {...props}
    />
  );
}
