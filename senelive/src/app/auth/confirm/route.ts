import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * Point d'atterrissage des liens envoyés par e-mail (confirmation d'inscription,
 * réinitialisation de mot de passe).
 *
 * Supabase vérifie le jeton puis redirige ici ; sans cet échange, l'utilisateur
 * revient sur le site toujours déconnecté — le lien semble « ne rien faire ».
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      // `next` vient de l'URL : n'accepter qu'un chemin interne, jamais une
      // redirection vers un domaine tiers.
      const destination = next.startsWith('/') && !next.startsWith('//') ? next : '/';
      return NextResponse.redirect(new URL(destination, origin));
    }
  }

  return NextResponse.redirect(new URL('/connexion?erreur=lien', origin));
}
