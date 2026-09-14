'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone, slugify } from '@/lib/format';

export type ShopState = { error?: string };

export async function createShop(_prev: ShopState, formData: FormData): Promise<ShopState> {
  const name = String(formData.get('name') ?? '').trim();
  const cityId = Number(formData.get('city_id') ?? 0) || null;
  const neighborhood = String(formData.get('neighborhood') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const rawWhatsapp = String(formData.get('whatsapp') ?? '').trim();

  if (name.length < 2) return { error: 'Donnez un nom à votre boutique.' };
  if (!cityId) return { error: 'Choisissez votre ville : les acheteurs proches vous verront en premier.' };

  let whatsapp: string | null = null;
  if (rawWhatsapp) {
    whatsapp = normalizePhone(rawWhatsapp);
    if (!whatsapp) return { error: 'Numéro WhatsApp invalide. Exemple : 77 123 45 67.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Connectez-vous pour ouvrir une boutique.' };

  // Le slug est l'adresse publique de la boutique : il doit rester unique et
  // lisible, d'où le suffixe court en cas de collision.
  const base = slugify(name) || 'boutique';
  let slug = base;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: taken } = await supabase.from('shops').select('id').eq('slug', slug).maybeSingle();
    if (!taken) break;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { error } = await supabase.from('shops').insert({
    owner_id: user.id,
    name,
    slug,
    city_id: cityId,
    neighborhood: neighborhood || null,
    description: description || null,
    whatsapp,
  });

  if (error) {
    return {
      error: error.message.includes('shops_owner_unique')
        ? 'Vous avez déjà une boutique.'
        : "La boutique n'a pas pu être créée.",
    };
  }

  // Le rôle passe à 'seller' : la vérification du compte, elle, reste à la main
  // d'un administrateur (un trigger empêche de se l'attribuer soi-même).
  await supabase.from('profiles').update({ role: 'seller' }).eq('id', user.id);

  revalidatePath('/vendeur');
  revalidatePath('/');
  return {};
}

/**
 * Le vendeur demande la vérification. Il ne peut pas se l'accorder : le trigger
 * n'autorise que la transition unverified/rejected -> pending, et seulement
 * par le propriétaire.
 */
export async function requestVerification(formData: FormData) {
  const shopId = String(formData.get('shop_id') ?? '');

  const supabase = await createClient();
  await supabase.from('shops').update({ verification: 'pending' }).eq('id', shopId);

  revalidatePath('/vendeur');
  revalidatePath('/admin');
}
