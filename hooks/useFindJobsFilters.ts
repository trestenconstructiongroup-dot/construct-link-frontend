import { useQuery } from '@tanstack/react-query';
import { getFindJobsFilters, type FindJobsFilters } from '../services/api';

const QUERY_KEY = ['findJobsFilters'] as const;

export function useFindJobsFilters(enabled = true) {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<FindJobsFilters> => {
      try {
        return await getFindJobsFilters();
      } catch {
        return {
          skills_list: [],
          roles_list: [],
          job_types: [],
          pay_range_min: 0,
          pay_range_max: 0,
          location_suggestions: [],
        };
      }
    },
    enabled,
  });
  return {
    filtersData: query.data ?? null,
    isLoading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
