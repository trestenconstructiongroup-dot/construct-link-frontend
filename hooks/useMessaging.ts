import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  getConversations,
  getOrCreateConversation,
  getConversationMessages,
  sendMessage,
  markConversationRead,
  getUnreadCount,
  type ConversationsResponse,
  type MessagesResponse,
  type MessageItem,
} from '../services/api';

export function useConversations(token: string | null, page = 1) {
  return useQuery<ConversationsResponse>({
    queryKey: ['conversations', page],
    queryFn: () => getConversations(token!, page),
    enabled: !!token,
    refetchInterval: 15_000,
  });
}

export function useConversationMessages(
  token: string | null,
  conversationId: number | null,
  page = 1,
) {
  return useQuery<MessagesResponse>({
    queryKey: ['conversationMessages', conversationId, page],
    queryFn: () => getConversationMessages(token!, conversationId!, page),
    enabled: !!token && conversationId != null,
    refetchInterval: 5_000,
  });
}

export function useUnreadCount(token: string | null) {
  return useQuery<{ unread_count: number }>({
    queryKey: ['unreadCount'],
    queryFn: () => getUnreadCount(token!),
    enabled: !!token,
    refetchInterval: 30_000,
  });
}

export function useGetOrCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ token, otherUserId }: { token: string; otherUserId: number }) =>
      getOrCreateConversation(token, otherUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation<MessageItem, Error, { token: string; conversationId: number; content: string }>({
    mutationFn: ({ token, conversationId, content }) =>
      sendMessage(token, conversationId, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversationMessages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ token, conversationId }: { token: string; conversationId: number }) =>
      markConversationRead(token, conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
}
