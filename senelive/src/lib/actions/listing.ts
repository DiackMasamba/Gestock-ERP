'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Enums } from '@/lib/database.types';

export type ListingState = { error?: string; ok?: boolean };

const CONDITIONS: Enums<'listing_condition'>[] = ['new', 'like_new', 'good', 'fair'];

export async function createListing(
  _prev: ListingState,
  formData: FormData,
): Promise<ListingState> {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const price = Number(formData.get('price') ?? 0);
  const quantity = Number(formData.get('quantity') ?? 1);
  const condition = String(formData.get('condition') ?? 'new') as Enums<'listing_condition'>;
  const categoryId = Number(formData.get('category_id') ?? 0) || null;
  const imagePaths = formData.getAll('image_paths').map(String).filter(Boolean);

  if (title.length < 3) return { error: 'Le titre doit faire au moins 3 caractères.' };
  if (!Number.isInteger(price) || price < 0) {
    return { error: 'Le prix doit être un entier en FCFA (sans centimes).' };
  }
  if (!Number.isInteger(quantity) || quantity < 1) return { error: 'Quantité invalide.' };
  if (!CONDITIONS.includes(condition)) return { error: 'État invalide.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Connectez-vous.' };

  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!shop) return { error: 'Créez d’abord votre boutique.' };

  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      shop_id: shop.id,
      title,
      description: description || null,
      price,
      quantity,
      condition,
      category_id: categoryId,
      status: 'active',
    })
    .select('id')
    .single();

  if (error || !listing) return { error: "L'article n'a pas pu être publié." };

  if (imagePaths.length > 0) {
    await supabase.from('listing_images').insert(
      imagePaths.map((path, position) => ({ listing_id: listing.id, path, position })),
    );
  }

  revalidatePath('/vendeur');
  revalidatePath('/');
  return { ok: true };
}

export async function setListingStatus(formData: FormData) {
  const listingId = String(formData.get('listing_id') ?? '');
  const status = String(formData.get('status') ?? '') as Enums<'listing_status'>;

  const supabase = await createClient();
  await supabase.from('listings').update({ status }).eq('id', listingId);

  revalidatePath('/vendeur');
  revalidatePath('/');
}
