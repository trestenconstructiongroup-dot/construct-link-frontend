import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import CreateJobWebPage from '../web/jobs-create.web';

/**
 * /jobs-edit/[id] – Edit an existing job.
 * CreateJobWebPage handles WebLayout and edit mode.
 */
export default function JobsEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const parsed = id ? parseInt(id, 10) : NaN;
  const editJobId = !isNaN(parsed) ? parsed : null;

  return <CreateJobWebPage editJobId={editJobId} />;
}
