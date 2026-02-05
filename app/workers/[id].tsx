import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import WorkerDetailPage from '../web/components/WorkerDetailPage';

/**
 * /workers/[id] – Worker or company profile view (by user_id).
 */
export default function WorkerDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const parsed = id ? parseInt(id, 10) : NaN;
  const userId = !isNaN(parsed) ? parsed : null;

  return <WorkerDetailPage userId={userId} />;
}
