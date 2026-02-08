import { useQuery } from '@tanstack/react-query';
import { getFindJobDetail } from '../services/api';

export function useJobDetail(jobId: number | null | undefined, token: string | null | undefined, enabled: boolean) {
  const query = useQuery({
    queryKey: ['jobDetail', jobId, !!token],
    queryFn: () => getFindJobDetail(jobId!, token ?? undefined),
    enabled: enabled && jobId != null,
  });
  return {
    job: query.data ?? null,
    loading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
