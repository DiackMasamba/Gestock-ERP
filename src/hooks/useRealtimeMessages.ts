import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { getMessage } from '@/services/messages';
import type { Message, MessageWithSender } from '@/types/database';
import { queryKeys } from './queryKeys';

/**
 * S'abonne aux nouveaux messages d'une conversation via Supabase Realtime
 * et met à jour le cache React Query en direct.
 */
export function useRealtimeMessages(conversationId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const row = payload.new as Message;

          // Récupère le message complet (avec l'auteur) pour l'affichage.
          const full = (await getMessage(row.id)) ?? { ...row, sender: null };

          queryClient.setQueryData<MessageWithSender[]>(
            queryKeys.messages(conversationId),
            (old) => {
              const list = old ?? [];
              // Notre propre message a déjà été confirmé (même id) par la mutation :
              // on ignore alors l'écho temps réel.
              if (list.some((m) => m.id === full.id)) return list;
              return [...list, full].sort((a, b) =>
                a.created_at.localeCompare(b.created_at),
              );
            },
          );

          void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);
}
