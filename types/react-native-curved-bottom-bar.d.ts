declare module 'react-native-curved-bottom-bar' {
  import React from 'react';
  import { ComponentType } from 'react';

  export const CurvedBottomBarExpo: {
    Navigator: ComponentType<{
      type: 'DOWN' | 'UP';
      circlePosition?: 'CENTER' | 'LEFT' | 'RIGHT';
      initialRouteName: string;
      tabBar: (props: { routeName: string; selectedTab: string; navigate: (name: string) => void }) => JSX.Element;
      renderCircle: (props: { routeName: string; selectedTab: string; navigate: (name: string) => void }) => JSX.Element;
      circleWidth?: number;
      height?: number;
      width?: number;
      bgColor?: string;
      borderTopLeftRight?: boolean;
      style?: object;
      shadowStyle?: object;
      screenOptions?: object;
      children?: React.ReactNode;
    }>;
    Screen: ComponentType<{
      name: string;
      position: 'LEFT' | 'RIGHT' | 'CIRCLE';
      component: ComponentType<any>;
    }>;
  };
}
