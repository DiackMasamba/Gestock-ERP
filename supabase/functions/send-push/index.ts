// Edge Function : envoie une notification push (Expo) à chaque nouveau message.
//
// Déclenchement : Database Webhook Supabase sur INSERT dans `public.messages`
// (voir README). Le payload contient la ligne insérée dans `record`.
//
// Variables d'environnement requises (fournies automatiquement par Supabase) :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

interface MessageRecord {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string | null;
  attachment_type: 'image' | 'file' | null;
  attachment_name: string | null;
}

interface WebhookPayload {
  type: string;
  table: string;
  record: MessageRecord;
}

function previewOf(record: MessageRecord): string {
  if (record.content) return record.content;
  if (record.attachment_type === 'image') return '📷 Photo';
  if (record.attachment_type === 'file') return `📎 ${record.attachment_name ?? 'Fichier'}`;
  return 'Nouveau message';
}

Deno.serve(async (req) => {
  try {
    const payload = (await req.json()) as WebhookPayload;
    const record = payload?.record;
    if (!record || payload.table !== 'messages') {
      return new Response('ignored', { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Destinataires = membres de la conversation sauf l'expéditeur, avec token.
    const { data: members } = await supabase
      .from('conversation_members')
      .select('user_id, profiles:user_id(expo_push_token)')
      .eq('conversation_id', record.conversation_id)
      .neq('user_id', record.sender_id ?? '');

    // Nom de l'expéditeur + titre de conversation pour le contenu de la notif.
    const [{ data: sender }, { data: conversation }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', record.sender_id ?? '').maybeSingle(),
      supabase.from('conversations').select('type, name').eq('id', record.conversation_id).maybeSingle(),
    ]);

    const senderName = sender?.full_name ?? 'Nouveau message';
    const title = conversation?.type === 'group' && conversation?.name
      ? `${conversation.name} · ${senderName}`
      : senderName;

    const notifications = (members ?? [])
      .map((m: any) => m.profiles?.expo_push_token as string | undefined)
      .filter((t): t is string => Boolean(t))
      .map((token) => ({
        to: token,
        sound: 'default',
        title,
        body: previewOf(record),
        data: { conversationId: record.conversation_id },
      }));

    if (notifications.length > 0) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(notifications),
      });
    }

    return new Response(JSON.stringify({ sent: notifications.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(`error: ${(err as Error).message}`, { status: 500 });
  }
});
