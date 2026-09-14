'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Enums } from '@/lib/database.types';

/**
 * Ces actions ne portent aucun contrôle d'accès : la RLS et le trigger
 * private.shops_guard_privileged_columns() décident. Un non-administrateur qui
 * appellerait ces actions verrait ses modifications silencieusement annulées.
 */

export async function setShopVerification(formData: FormData) {
  const shopId = String(formData.get('shop_id') ?? '');
  const verification = String(formData.get('verification') ?? '') as Enums<'verification_status'>;

  const supabase = await createClient();
  await supabase.from('shops').update({ verification }).eq('id', shopId);

  revalidatePath('/admin');
  revalidatePath('/');
}

export async function setShopActive(formData: FormData) {
  const shopId = String(formData.get('shop_id') ?? '');
  const isActive = formData.get('is_active') === 'true';

  const supabase = await createClient();
  await supabase.from('shops').update({ is_active: isActive }).eq('id', shopId);

  revalidatePath('/admin');
  revalidatePath('/');
}
