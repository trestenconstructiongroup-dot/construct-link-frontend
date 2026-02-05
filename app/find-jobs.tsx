import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, View } from 'react-native';

const FindJobsWebPage = lazy(() => import('./web/find-jobs.web'));

function FindJobsFallback() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

/** Find Jobs – lazy-loaded for smaller initial bundle. */
export default function FindJobsRoute() {
  return (
    <Suspense fallback={<FindJobsFallback />}>
      <FindJobsWebPage />
    </Suspense>
  );
}
