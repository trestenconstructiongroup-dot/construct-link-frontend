import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, View } from 'react-native';

const SubscriptionPage = lazy(() => import('./web/components/SubscriptionPage'));

function Fallback() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

/**
 * /my-subscription – Subscription management page. Lazy-loaded.
 */
export default function MySubscriptionRoute() {
  return (
    <Suspense fallback={<Fallback />}>
      <SubscriptionPage />
    </Suspense>
  );
}
