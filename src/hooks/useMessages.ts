import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/auth/AuthProvider';
import {
  listMessages,
  sendMessage,
  type SendMessageInput,
} from '@/services/messages';
import type { MessageWithSender } from '@/types/database';
import { queryKeys } from './queryKeys';

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: () => listMessages(conversationId),
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const { session, profile } = useAuth();

  return useMutation({
    mutationFn: (input: Omit<SendMessageInput, 'conversationId' | 'senderId'>) =>
      sendMessage({ ...input, conversationId, senderId: session!.user.id }),

    // Insertion optimiste : le message apparaît immédiatement.
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.messages(conversationId) });
      const previous = queryClient.getQueryData<MessageWithSender[]>(
        queryKeys.messages(conversationId),
      );
      const optimistic: MessageWithSender = {
        id: `optimistic-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: session!.user.id,
        content: input.content ?? null,
        attachment_url: input.attachmentUrl ?? null,
        attachment_type: input.attachmentType ?? null,
        attachment_name: input.attachmentName ?? null,
        created_at: new Date().toISOString(),
        sender: profile
          ? { id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url }
          : null,
      };
      queryClient.setQueryData<MessageWithSender[]>(
        queryKeys.messages(conversationId),
        (old) => [...(old ?? []), optimistic],
      );
      return { previous };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.messages(conversationId), context.previous);
      }
    },

    // Remplace le message optimiste par la vraie ligne renvoyée par la BDD.
    onSuccess: (real) => {
      queryClient.setQueryData<MessageWithSender[]>(
        queryKeys.messages(conversationId),
        (old) => {
          const withoutOptimistic = (old ?? []).filter(
            (m) => !m.id.startsWith('optimistic-'),
          );
          if (withoutOptimistic.some((m) => m.id === real.id)) return withoutOptimistic;
          return [...withoutOptimistic, real];
        },
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}
