import React from 'react';
import { Platform } from 'react-native';
import WebLayout from './web/layout';
import ProfilePage from './web/components/ProfilePage';
import AccountScreen from './account';

/**
 * /profile route
 *
 * - On web: renders the full modular ProfilePage inside the WebLayout shell.
 * - On native: temporarily falls back to the simpler AccountScreen; we can
 *   later introduce a dedicated profile.mobile.tsx if needed.
 */
export default function ProfileRoute() {
  if (Platform.OS === 'web') {
    return (
      <WebLayout>
        <ProfilePage />
      </WebLayout>
    );
  }

  return <AccountScreen />;
}

