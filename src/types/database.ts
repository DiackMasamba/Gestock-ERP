/**
 * Types du schéma Supabase (mono-entreprise).
 * Ces types reflètent les migrations dans `supabase/migrations`.
 */

export type UserRole = 'admin' | 'employee';
export type ConversationType = 'direct' | 'group';
export type AttachmentType = 'image' | 'file';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  expo_push_token: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  last_read_at: string;
  joined_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string | null;
  attachment_url: string | null;
  attachment_type: AttachmentType | null;
  attachment_name: string | null;
  created_at: string;
}

/** Message enrichi de son auteur, tel que consommé par l'UI. */
export interface MessageWithSender extends Message {
  sender: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
}

/** Conversation enrichie pour la liste (dernier message + membres). */
export interface ConversationSummary extends Conversation {
  members: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[];
  last_message: Message | null;
  unread_count: number;
}
