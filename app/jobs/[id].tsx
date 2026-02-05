import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import JobDetailPage from '../web/components/JobDetailPage';

/**
 * /jobs/[id] – Job display page (full job details).
 */
export default function JobDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const parsed = id ? parseInt(id, 10) : NaN;
  const jobId = !isNaN(parsed) ? parsed : null;

  return <JobDetailPage jobId={jobId} />;
}
