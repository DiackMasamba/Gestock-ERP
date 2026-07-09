import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase';

const BUCKET = 'attachments';

export interface LocalAttachment {
  uri: string;
  name: string;
  mimeType: string;
}

/**
 * Envoie un fichier local vers le bucket privé `attachments`.
 * Retourne le chemin de stockage (pas une URL publique — le bucket est privé).
 */
export async function uploadAttachment(
  conversationId: string,
  file: LocalAttachment,
): Promise<string> {
  const buffer = await new File(file.uri).arrayBuffer();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${conversationId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.mimeType,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Génère une URL signée (valable 1h) pour lire une pièce jointe privée. */
export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
