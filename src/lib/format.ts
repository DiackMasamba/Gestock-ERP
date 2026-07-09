import type { ConversationSummary, Message, Profile } from '@/types/database';

type MemberLike = Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;

/** Titre affiché pour une conversation selon son type. */
export function conversationTitle(
  conv: Pick<ConversationSummary, 'type' | 'name'> & { members: MemberLike[] },
  currentUserId: string,
): string {
  if (conv.type === 'group') return conv.name || 'Groupe';
  const other = conv.members.find((m) => m.id !== currentUserId);
  return other?.full_name || 'Collègue';
}

/** Autre participant d'une conversation directe (pour l'avatar). */
export function directPeer(
  members: MemberLike[],
  currentUserId: string,
): MemberLike | undefined {
  return members.find((m) => m.id !== currentUserId);
}

/** Aperçu texte du dernier message pour la liste des conversations. */
export function messagePreview(message: Message | null): string {
  if (!message) return 'Aucun message';
  if (message.content) return message.content;
  if (message.attachment_type === 'image') return '📷 Photo';
  if (message.attachment_type === 'file') return `📎 ${message.attachment_name ?? 'Fichier'}`;
  return '';
}

const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

/** Horodatage court et relatif pour la liste (aujourd'hui → heure, sinon date). */
export function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return formatTime(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(date);
}
