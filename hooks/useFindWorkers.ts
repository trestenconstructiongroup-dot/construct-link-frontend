import { useInfiniteQuery } from '@tanstack/react-query';
import {
    findWorkers,
    type FindWorkersParams,
    type FindWorkersResponse,
    type WorkerSearchResult,
} from '../services/api';

const PAGE_SIZE = 12;

export interface UseFindWorkersParams extends Omit<FindWorkersParams, 'page' | 'page_size'> {}

export function useFindWorkers(params: UseFindWorkersParams, token: string | null | undefined, enabled: boolean) {
  const query = useInfiniteQuery({
    queryKey: ['findWorkers', params, !!token],
    queryFn: async ({ pageParam = 1 }): Promise<FindWorkersResponse> => {
      return findWorkers(
        { ...params, page: pageParam, page_size: PAGE_SIZE },
        token ?? undefined
      );
    },
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    enabled: enabled && !!token,
  });

  const results: WorkerSearchResult[] = query.data?.pages.flatMap((p) => p.results) ?? [];
  const count = query.data?.pages[0]?.count ?? 0;

  return {
    results,
    count,
    nextPage: query.data?.pages.at(-1)?.next ?? null,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    error: query.error ? (query.error instanceof Error ? query.error.message : 'Failed to load workers.') : null,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    refetch: query.refetch,
  };
}
