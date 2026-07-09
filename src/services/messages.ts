import { supabase } from '@/lib/supabase';
import type { AttachmentType, MessageWithSender } from '@/types/database';

const MESSAGE_SELECT =
  '*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)';

/** Charge l'historique d'une conversation (ordre chronologique). */
export async function listMessages(conversationId: string): Promise<MessageWithSender[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as MessageWithSender[];
}

/** Récupère un message précis avec son auteur (utilisé par le temps réel). */
export async function getMessage(id: string): Promise<MessageWithSender | null> {
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('id', id)
    .single();
  if (error) return null;
  return data as unknown as MessageWithSender;
}

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  content?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: AttachmentType | null;
  attachmentName?: string | null;
}

export async function sendMessage(input: SendMessageInput): Promise<MessageWithSender> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      content: input.content ?? null,
      attachment_url: input.attachmentUrl ?? null,
      attachment_type: input.attachmentType ?? null,
      attachment_name: input.attachmentName ?? null,
    })
    .select(MESSAGE_SELECT)
    .single();
  if (error) throw error;
  return data as unknown as MessageWithSender;
}

/** Marque la conversation comme lue jusqu'à maintenant pour l'utilisateur. */
export async function markConversationRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);
}
