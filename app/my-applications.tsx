import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, View } from 'react-native';

const MyApplicationsPage = lazy(() => import('./web/components/MyApplicationsPage'));

function Fallback() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

/**
 * /my-applications – Applicant's applications dashboard. Lazy-loaded.
 */
export default function MyApplicationsRoute() {
  return (
    <Suspense fallback={<Fallback />}>
      <MyApplicationsPage />
    </Suspense>
  );
}
