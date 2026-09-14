import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/lib/actions/auth';

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Une seule boutique par compte : sa présence décide du lien « Vendre ».
  const [{ data: shop }, { data: profile }] = user
    ? await Promise.all([
        supabase.from('shops').select('slug').eq('owner_id', user.id).maybeSingle(),
        supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      ])
    : [{ data: null }, { data: null }];

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-brand-700">
          SeneLive
        </Link>

        <nav className="ml-auto flex items-center gap-1 text-sm">
          {user ? (
            <>
              <Link
                href="/commandes"
                className="rounded-lg px-3 py-2 text-ink-700 hover:bg-canvas"
              >
                Mes commandes
              </Link>
              <Link href="/vendeur" className="rounded-lg px-3 py-2 text-ink-700 hover:bg-canvas">
                {shop ? 'Ma boutique' : 'Vendre'}
              </Link>
              {profile?.role === 'admin' ? (
                <Link href="/admin" className="rounded-lg px-3 py-2 font-medium text-brand-700 hover:bg-canvas">
                  Admin
                </Link>
              ) : null}
              <form action={signOut}>
                <button className="rounded-lg px-3 py-2 text-ink-500 hover:bg-canvas">
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/connexion" className="rounded-lg px-3 py-2 text-ink-700 hover:bg-canvas">
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="rounded-lg bg-brand-600 px-3 py-2 font-medium text-white hover:bg-brand-700"
              >
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
