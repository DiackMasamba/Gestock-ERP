'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/format';

/**
 * L'URL publique du site telle que vue par la requête en cours. Évite de
 * dépendre du « Site URL » configuré dans Supabase, qui pointe sur localhost
 * tant qu'on ne l'a pas changé à la main.
 */
async function currentOrigin(): Promise<string | null> {
  const head = await headers();
  const origin = head.get('origin');
  if (origin) return origin;

  const host = head.get('x-forwarded-host') ?? head.get('host');
  if (!host) return null;
  const protocol = head.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}

export type AuthState = { error?: string };

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('suite') ?? '/');

  if (!email || !password) {
    return { error: 'Renseignez votre e-mail et votre mot de passe.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'E-mail ou mot de passe incorrect.' };
  }

  revalidatePath('/', 'layout');
  redirect(next.startsWith('/') ? next : '/');
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('full_name') ?? '').trim();
  const rawPhone = String(formData.get('phone') ?? '').trim();
  const wantsToSell = formData.get('role') === 'seller';

  if (!fullName) return { error: 'Indiquez votre nom.' };
  if (password.length < 8) {
    return { error: 'Le mot de passe doit faire au moins 8 caractères.' };
  }

  // Le téléphone est optionnel ici tant que la vérification SMS n'est pas
  // branchée, mais on le normalise déjà en E.164 (+221…) pour ne pas avoir à
  // nettoyer la base plus tard.
  let phone: string | null = null;
  if (rawPhone) {
    phone = normalizePhone(rawPhone);
    if (!phone) {
      return { error: 'Numéro invalide. Exemple : 77 123 45 67.' };
    }
  }

  const origin = await currentOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // handle_new_user() lit ces métadonnées pour créer le profil. Le rôle
      // 'admin' n'y est jamais accepté : c'est le client qui les envoie.
      data: { full_name: fullName, phone, role: wantsToSell ? 'seller' : 'buyer' },
      // Le lien de confirmation doit revenir sur la route qui échange le jeton.
      ...(origin
        ? { emailRedirectTo: `${origin}/auth/confirm?next=${wantsToSell ? '/vendeur' : '/'}` }
        : {}),
    },
  });

  if (error) {
    return {
      error:
        error.message.toLowerCase().includes('already')
          ? 'Un compte existe déjà avec cet e-mail.'
          : "L'inscription a échoué. Réessayez.",
    };
  }

  // Si la confirmation d'e-mail est active côté Supabase, signUp ne renvoie
  // pas de session : rediriger vers /vendeur enverrait l'utilisateur sur une
  // page protégée dont le middleware le ferait ressortir aussitôt.
  if (!data.session) {
    redirect('/inscription/confirmation');
  }

  revalidatePath('/', 'layout');
  redirect(wantsToSell ? '/vendeur' : '/');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
