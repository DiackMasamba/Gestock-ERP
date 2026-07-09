import { supabase } from '@/lib/supabase';
import type {
  Conversation,
  ConversationSummary,
  Message,
  Profile,
} from '@/types/database';

type MemberProfile = Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;

/** Liste les conversations de l'utilisateur avec dernier message et non-lus. */
export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  // 1. Adhésions de l'utilisateur (+ date de dernière lecture).
  const { data: memberRows, error: memberErr } = await supabase
    .from('conversation_members')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId);
  if (memberErr) throw memberErr;

  const convIds = (memberRows ?? []).map((m) => m.conversation_id);
  if (convIds.length === 0) return [];

  const lastReadByConv = new Map<string, string>(
    (memberRows ?? []).map((m) => [m.conversation_id, m.last_read_at]),
  );

  // 2. Conversations + tous leurs membres (avec profils).
  const [{ data: conversations }, { data: allMembers }] = await Promise.all([
    supabase.from('conversations').select('*').in('id', convIds),
    supabase
      .from('conversation_members')
      .select('conversation_id, profiles:user_id(id, full_name, avatar_url)')
      .in('conversation_id', convIds),
  ]);

  const membersByConv = new Map<string, MemberProfile[]>();
  for (const row of (allMembers ?? []) as any[]) {
    const list = membersByConv.get(row.conversation_id) ?? [];
    if (row.profiles) list.push(row.profiles as MemberProfile);
    membersByConv.set(row.conversation_id, list);
  }

  // 3. Dernier message par conversation (une requête, réduite côté client).
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false })
    .limit(200);

  const lastByConv = new Map<string, Message>();
  for (const msg of (recentMessages ?? []) as Message[]) {
    if (!lastByConv.has(msg.conversation_id)) lastByConv.set(msg.conversation_id, msg);
  }

  // 4. Compteurs non-lus (en parallèle, N petit pour un usage interne).
  const unreadEntries = await Promise.all(
    convIds.map(async (id) => {
      const since = lastReadByConv.get(id) ?? new Date(0).toISOString();
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', id)
        .neq('sender_id', userId)
        .gt('created_at', since);
      return [id, count ?? 0] as const;
    }),
  );
  const unreadByConv = new Map<string, number>(unreadEntries);

  const summaries: ConversationSummary[] = (conversations ?? []).map(
    (conv: Conversation) => ({
      ...conv,
      members: membersByConv.get(conv.id) ?? [],
      last_message: lastByConv.get(conv.id) ?? null,
      unread_count: unreadByConv.get(conv.id) ?? 0,
    }),
  );

  // Tri par activité récente (dernier message, sinon création).
  summaries.sort((a, b) => {
    const ta = a.last_message?.created_at ?? a.created_at;
    const tb = b.last_message?.created_at ?? b.created_at;
    return tb.localeCompare(ta);
  });

  return summaries;
}

/** Détail d'une conversation avec ses membres. */
export async function getConversation(
  id: string,
): Promise<(Conversation & { members: MemberProfile[] }) | null> {
  const { data: conv, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !conv) return null;

  const { data: members } = await supabase
    .from('conversation_members')
    .select('profiles:user_id(id, full_name, avatar_url)')
    .eq('conversation_id', id);

  return {
    ...(conv as Conversation),
    members: ((members ?? []) as any[])
      .map((m) => m.profiles as MemberProfile)
      .filter(Boolean),
  };
}

/** Crée (ou réutilise) une conversation directe 1-à-1 via RPC. */
export async function createDirectConversation(otherUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_direct_conversation', {
    other_user: otherUserId,
  });
  if (error) throw error;
  return data as string;
}

/** Crée une conversation de groupe via RPC. */
export async function createGroupConversation(
  name: string,
  memberIds: string[],
): Promise<string> {
  const { data, error } = await supabase.rpc('create_group_conversation', {
    group_name: name,
    member_ids: memberIds,
  });
  if (error) throw error;
  return data as string;
}

/** Annuaire des collègues (tout le monde sauf soi). */
export async function listColleagues(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', userId)
    .order('full_name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Profile[];
}
