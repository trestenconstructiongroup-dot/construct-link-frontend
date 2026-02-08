import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import {
  createIndividualExperience,
  updateIndividualExperience,
  deleteIndividualExperience,
  createIndividualEducation,
  updateIndividualEducation,
  deleteIndividualEducation,
  createCompanyHiringFocus,
  updateCompanyHiringFocus,
  deleteCompanyHiringFocus,
  type IndividualExperience,
  type IndividualEducation,
  type CompanyHiringFocus,
} from '../services/api';

// ---- Experience ----

interface CreateExperienceVars {
  token: string;
  payload: Partial<Omit<IndividualExperience, 'id' | 'profile' | 'created_at' | 'updated_at'>>;
}

interface UpdateExperienceVars extends CreateExperienceVars {
  id: number;
}

interface DeleteVars {
  token: string;
  id: number;
}

export function useCreateExperience(
  options?: Omit<UseMutationOptions<IndividualExperience, Error, CreateExperienceVars>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ token, payload }: CreateExperienceVars) =>
      createIndividualExperience(token, payload),
    ...options,
  });
}

export function useUpdateExperience(
  options?: Omit<UseMutationOptions<IndividualExperience, Error, UpdateExperienceVars>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ token, id, payload }: UpdateExperienceVars) =>
      updateIndividualExperience(token, id, payload),
    ...options,
  });
}

export function useDeleteExperience(
  options?: Omit<UseMutationOptions<void, Error, DeleteVars>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ token, id }: DeleteVars) =>
      deleteIndividualExperience(token, id),
    ...options,
  });
}

// ---- Education ----

interface CreateEducationVars {
  token: string;
  payload: Partial<Omit<IndividualEducation, 'id' | 'profile' | 'created_at' | 'updated_at'>>;
}

interface UpdateEducationVars extends CreateEducationVars {
  id: number;
}

export function useCreateEducation(
  options?: Omit<UseMutationOptions<IndividualEducation, Error, CreateEducationVars>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ token, payload }: CreateEducationVars) =>
      createIndividualEducation(token, payload),
    ...options,
  });
}

export function useUpdateEducation(
  options?: Omit<UseMutationOptions<IndividualEducation, Error, UpdateEducationVars>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ token, id, payload }: UpdateEducationVars) =>
      updateIndividualEducation(token, id, payload),
    ...options,
  });
}

export function useDeleteEducation(
  options?: Omit<UseMutationOptions<void, Error, DeleteVars>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ token, id }: DeleteVars) =>
      deleteIndividualEducation(token, id),
    ...options,
  });
}

// ---- Hiring Focus ----

interface CreateHiringFocusVars {
  token: string;
  payload: Partial<Omit<CompanyHiringFocus, 'id' | 'profile' | 'created_at' | 'updated_at'>>;
}

interface UpdateHiringFocusVars extends CreateHiringFocusVars {
  id: number;
}

export function useCreateHiringFocus(
  options?: Omit<UseMutationOptions<CompanyHiringFocus, Error, CreateHiringFocusVars>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ token, payload }: CreateHiringFocusVars) =>
      createCompanyHiringFocus(token, payload),
    ...options,
  });
}

export function useUpdateHiringFocus(
  options?: Omit<UseMutationOptions<CompanyHiringFocus, Error, UpdateHiringFocusVars>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ token, id, payload }: UpdateHiringFocusVars) =>
      updateCompanyHiringFocus(token, id, payload),
    ...options,
  });
}

export function useDeleteHiringFocus(
  options?: Omit<UseMutationOptions<void, Error, DeleteVars>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ token, id }: DeleteVars) =>
      deleteCompanyHiringFocus(token, id),
    ...options,
  });
}
