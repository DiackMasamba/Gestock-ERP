'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ReviewState = { error?: string; ok?: boolean };

export async function leaveReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const orderId = String(formData.get('order_id') ?? '');
  const rating = Number(formData.get('rating') ?? 0);
  const comment = String(formData.get('comment') ?? '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Donnez une note de 1 à 5.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Connectez-vous.' };

  const { data: order } = await supabase
    .from('orders')
    .select('id,shop_id,status')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return { error: 'Commande introuvable.' };
  if (order.status !== 'delivered') {
    return { error: 'Vous pourrez noter une fois la commande livrée.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  // author_name est un instantané : profiles n'est pas lisible publiquement,
  // mais un avis doit rester signé pour être crédible.
  const { error } = await supabase.from('reviews').insert({
    order_id: order.id,
    shop_id: order.shop_id,
    buyer_id: user.id,
    author_name: profile?.full_name ?? null,
    rating,
    comment: comment || null,
  });

  if (error) {
    return {
      error: error.code === '23505' ? 'Vous avez déjà noté cette commande.' : 'Avis refusé.',
    };
  }

  revalidatePath('/commandes');
  revalidatePath('/');
  return { ok: true };
}
