import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, View } from 'react-native';

const JobApplicationsDashboard = lazy(() => import('./web/components/JobApplicationsDashboard'));

function Fallback() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

/**
 * /job-applications – Company's applicant management dashboard. Lazy-loaded.
 */
export default function JobApplicationsRoute() {
  return (
    <Suspense fallback={<Fallback />}>
      <JobApplicationsDashboard />
    </Suspense>
  );
}
