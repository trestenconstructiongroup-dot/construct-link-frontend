import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getMyApplications,
  withdrawApplication,
  getJobApplications,
  updateApplicationStatus,
  type ApplicationsResponse,
  type ApplicationItem,
  type ApplicationStatus,
} from '../services/api';

export function useMyApplications(
  token: string | null,
  params: { status?: string; page?: number; page_size?: number } = {},
) {
  return useQuery<ApplicationsResponse>({
    queryKey: ['myApplications', params.status, params.page],
    queryFn: () => getMyApplications(token!, params),
    enabled: !!token,
  });
}

export function useJobApplications(
  token: string | null,
  jobId: number | null,
  params: { status?: string; page?: number; page_size?: number } = {},
) {
  return useQuery<ApplicationsResponse>({
    queryKey: ['jobApplications', jobId, params.status, params.page],
    queryFn: () => getJobApplications(token!, jobId!, params),
    enabled: !!token && jobId != null,
  });
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message: string },
    Error,
    { token: string; applicationId: number }
  >({
    mutationFn: ({ token, applicationId }) =>
      withdrawApplication(token, applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    ApplicationItem,
    Error,
    { token: string; applicationId: number; newStatus: ApplicationStatus }
  >({
    mutationFn: ({ token, applicationId, newStatus }) =>
      updateApplicationStatus(token, applicationId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
    },
  });
}
