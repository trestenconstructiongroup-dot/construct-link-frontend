import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, View } from 'react-native';

const FindWorkersPage = lazy(() => import('./web/components/FindWorkersPage'));

function WorkersFallback() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

/**
 * /workers – Find Workers page (search individuals + companies). Lazy-loaded for smaller initial bundle.
 */
export default function WorkersRoute() {
  return (
    <Suspense fallback={<WorkersFallback />}>
      <FindWorkersPage />
    </Suspense>
  );
}
