import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getSubscriptionStatus,
  initializeSubscription,
  verifyPayment,
  getPaymentHistory,
  type SubscriptionStatusResponse,
  type InitializeSubscriptionResponse,
  type VerifyPaymentResponse,
  type PaymentRecord,
  type PaginatedResponse,
} from '../services/api';

export function useSubscriptionStatus(token: string | null) {
  return useQuery<SubscriptionStatusResponse>({
    queryKey: ['subscriptionStatus'],
    queryFn: () => getSubscriptionStatus(token!),
    enabled: !!token,
  });
}

export function useInitializeSubscription() {
  return useMutation<
    InitializeSubscriptionResponse,
    Error,
    { token: string; callbackUrl?: string }
  >({
    mutationFn: ({ token, callbackUrl }) =>
      initializeSubscription(token, callbackUrl),
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation<
    VerifyPaymentResponse,
    Error,
    { token: string; reference: string }
  >({
    mutationFn: ({ token, reference }) => verifyPayment(token, reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
      queryClient.invalidateQueries({ queryKey: ['paymentHistory'] });
    },
  });
}

export function usePaymentHistory(token: string | null, page = 1) {
  return useQuery<PaginatedResponse<PaymentRecord>>({
    queryKey: ['paymentHistory', page],
    queryFn: () => getPaymentHistory(token!, page),
    enabled: !!token,
  });
}
