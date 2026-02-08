import type { InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
    findJobs,
    type FindJobsParams,
    type FindJobsResponse,
    type JobSummary,
} from '../services/api';

const PAGE_SIZE = 12;

export interface UseFindJobsParams extends Omit<FindJobsParams, 'page' | 'page_size'> {}

export function useFindJobs(params: UseFindJobsParams, token: string | null | undefined, enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ['findJobs', params, !!token],
    queryFn: async ({ pageParam }): Promise<FindJobsResponse> => {
      return findJobs(
        { ...params, page: pageParam, page_size: PAGE_SIZE },
        token ?? undefined
      );
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    enabled: enabled && !!token,
  });

  const results: JobSummary[] = query.data?.pages.flatMap((p) => p.results) ?? [];
  const count = query.data?.pages[0]?.count ?? 0;

  const updateJobInCache = useCallback(
    (jobId: number, patch: Partial<Pick<JobSummary, 'applications_count' | 'has_applied'>>) => {
      queryClient.setQueryData<InfiniteData<FindJobsResponse>>(
        ['findJobs', params, !!token],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              results: page.results.map((j) =>
                j.job_id === jobId ? { ...j, ...patch } : j
              ),
            })),
          };
        }
      );
    },
    [queryClient, params, token]
  );

  return {
    results,
    count,
    nextPage: query.data?.pages.at(-1)?.next ?? null,
    loading: query.isPending,
    loadingMore: query.isFetchingNextPage,
    error: query.error ? (query.error instanceof Error ? query.error.message : 'Failed to load jobs.') : null,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    refetch: query.refetch,
    updateJobInCache,
  };
}
