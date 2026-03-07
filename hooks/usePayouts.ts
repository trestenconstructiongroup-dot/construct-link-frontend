import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getTransferRecipient,
  createTransferRecipient,
  getPayouts,
  initiatePayout,
  type TransferRecipientData,
  type PayoutRecord,
  type PaginatedResponse,
} from '../services/api';

export function useTransferRecipient(token: string | null) {
  return useQuery<TransferRecipientData>({
    queryKey: ['transferRecipient'],
    queryFn: () => getTransferRecipient(token!),
    enabled: !!token,
    retry: false, // 404 is expected when no recipient is set up
  });
}

export function useCreateTransferRecipient() {
  const queryClient = useQueryClient();

  return useMutation<
    TransferRecipientData,
    Error,
    {
      token: string;
      payload: {
        recipient_type: string;
        account_name: string;
        account_number: string;
        bank_code?: string;
      };
    }
  >({
    mutationFn: ({ token, payload }) => createTransferRecipient(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferRecipient'] });
    },
  });
}

export function usePayoutList(token: string | null, page = 1) {
  return useQuery<PaginatedResponse<PayoutRecord>>({
    queryKey: ['payouts', page],
    queryFn: () => getPayouts(token!, page),
    enabled: !!token,
    retry: false,
  });
}

export function useInitiatePayout() {
  const queryClient = useQueryClient();

  return useMutation<
    PayoutRecord,
    Error,
    { token: string; amount: number; reason?: string }
  >({
    mutationFn: ({ token, amount, reason }) =>
      initiatePayout(token, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
  });
}
