import React from 'react';
import { Platform } from 'react-native';
import CreateJobWebPage from './web/jobs-create.web';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/theme';
import CreateWorkPage from './mobile/create-work';

export default function JobsCreateRoute() {
  const { isDark } = useTheme();
  const colors = Colors[isDark ? 'dark' : 'light'];

  if (Platform.OS === 'web') {
    return <CreateJobWebPage />;
  }

  // On native, render the dedicated mobile wizard (also used by /mobile/create-work).
  return <CreateWorkPage />;
}
