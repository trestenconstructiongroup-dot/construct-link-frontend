import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { createJob, updateJob, type Job } from '../services/api';

type CreateJobPayload = Parameters<typeof createJob>[1];

interface CreateJobVars {
  token: string;
  payload: CreateJobPayload;
}

interface UpdateJobVars {
  token: string;
  id: number;
  payload: Parameters<typeof updateJob>[2];
}

export function useCreateJob(
  options?: Omit<UseMutationOptions<Job, Error, CreateJobVars>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ token, payload }: CreateJobVars) =>
      createJob(token, payload),
    ...options,
  });
}

export function useUpdateJob(
  options?: Omit<UseMutationOptions<Job, Error, UpdateJobVars>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ token, id, payload }: UpdateJobVars) =>
      updateJob(token, id, payload),
    ...options,
  });
}
