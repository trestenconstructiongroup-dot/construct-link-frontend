import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { applyJob, type ApplyJobResponse } from '../services/api';

interface ApplyJobVariables {
  token: string;
  jobId: number;
  roleName?: string | null;
  coverLetter?: string | null;
}

export function useApplyJob(
  options?: Omit<UseMutationOptions<ApplyJobResponse, Error, ApplyJobVariables>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: ({ token, jobId, roleName, coverLetter }: ApplyJobVariables) =>
      applyJob(token, jobId, roleName, coverLetter),
    ...options,
  });
}
