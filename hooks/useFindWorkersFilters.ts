import { useQuery } from '@tanstack/react-query';
import { getFindWorkersFilters, type FindWorkersFilters } from '../services/api';

const QUERY_KEY = ['findWorkersFilters'] as const;

export function useFindWorkersFilters(enabled = true) {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<FindWorkersFilters> => {
      try {
        return await getFindWorkersFilters();
      } catch {
        return {
          skills_list: [],
          categories_list: [],
          company_types_list: [],
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
