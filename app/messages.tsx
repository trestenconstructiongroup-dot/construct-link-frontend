import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, View } from 'react-native';

const MessagesPage = lazy(() => import('./web/components/MessagesPage'));

function MessagesFallback() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

/**
 * /messages – In-app messaging page. Lazy-loaded for smaller initial bundle.
 */
export default function MessagesRoute() {
  return (
    <Suspense fallback={<MessagesFallback />}>
      <MessagesPage />
    </Suspense>
  );
}
