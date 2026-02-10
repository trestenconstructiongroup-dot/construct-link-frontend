import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import {
  updateIndividualProfile,
  updateCompanyProfile,
  type IndividualProfile,
  type CompanyProfile,
} from '../services/api';

interface UpdateIndividualVariables {
  token: string;
  payload: Partial<Omit<IndividualProfile, 'id' | 'user' | 'created_at' | 'updated_at'>>;
}

interface UpdateCompanyVariables {
  token: string;
  payload: Partial<Omit<CompanyProfile, 'id' | 'user' | 'created_at' | 'updated_at'>>;
}

export function useUpdateIndividualProfile(
  options?: Omit<UseMutationOptions<IndividualProfile, Error, UpdateIndividualVariables>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ token, payload }: UpdateIndividualVariables) =>
      updateIndividualProfile(token, payload),
    ...options,
  });
}

export function useUpdateCompanyProfile(
  options?: Omit<UseMutationOptions<CompanyProfile, Error, UpdateCompanyVariables>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ token, payload }: UpdateCompanyVariables) =>
      updateCompanyProfile(token, payload),
    ...options,
  });
}
