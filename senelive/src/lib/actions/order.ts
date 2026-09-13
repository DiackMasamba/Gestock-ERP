'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/format';
import type { Enums } from '@/lib/database.types';

export type OrderState = { error?: string };

const PAYMENT_METHODS: Enums<'payment_method'>[] = [
  'wave',
  'orange_money',
  'free_money',
  'cash_on_delivery',
  'card',
];

export async function placeOrder(_prev: OrderState, formData: FormData): Promise<OrderState> {
  const listingId = String(formData.get('listing_id') ?? '');
  const quantity = Number(formData.get('quantity') ?? 1);
  const method = String(formData.get('payment_method') ?? '');
  const cityId = Number(formData.get('delivery_city_id') ?? 0);
  const address = String(formData.get('delivery_address') ?? '').trim();
  const rawPhone = String(formData.get('delivery_phone') ?? '').trim();
  const note = String(formData.get('buyer_note') ?? '').trim();

  if (!PAYMENT_METHODS.includes(method as Enums<'payment_method'>)) {
    return { error: 'Choisissez un moyen de paiement.' };
  }
  if (!address) return { error: 'Indiquez où livrer.' };
  if (!cityId) return { error: 'Choisissez la ville de livraison.' };

  const phone = normalizePhone(rawPhone);
  if (!phone) return { error: 'Numéro invalide. Exemple : 77 123 45 67.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/connexion?suite=/produit/${listingId}`);

  // Tout le contrôle est côté base : prix, stock, frais de livraison et
  // verrou anti-double-achat sont calculés dans place_order().
  const { data: orderId, error } = await supabase.rpc('place_order', {
    p_listing_id: listingId,
    p_quantity: quantity,
    p_payment_method: method as Enums<'payment_method'>,
    p_delivery_city_id: cityId,
    p_delivery_address: address,
    p_delivery_phone: phone,
    p_buyer_note: note || undefined,
  });

  if (error) {
    // Les messages de place_order() sont écrits pour être montrés tels quels.
    return { error: error.message.replace(/^.*?:\s*/, '') };
  }

  revalidatePath('/commandes');
  revalidatePath(`/produit/${listingId}`);
  redirect(`/commandes?nouvelle=${orderId}`);
}

export async function updateOrderStatus(formData: FormData) {
  const orderId = String(formData.get('order_id') ?? '');
  const status = String(formData.get('status') ?? '') as Enums<'order_status'>;

  const supabase = await createClient();
  // Les transitions autorisées sont vérifiées par un trigger : inutile de les
  // redupliquer ici, une transition interdite lèvera une erreur.
  await supabase.from('orders').update({ status }).eq('id', orderId);

  revalidatePath('/commandes');
  revalidatePath('/vendeur');
}
