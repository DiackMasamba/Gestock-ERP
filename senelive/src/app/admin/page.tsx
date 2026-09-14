import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EmptyState, Rating, VerifiedBadge } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { setShopActive, setShopVerification } from '@/lib/actions/admin';

const SHOP_FIELDS =
  'id,name,slug,is_active,verification,verified_at,verification_requested_at,whatsapp,neighborhood,created_at,rating_avg,rating_count,cities(name),profiles(full_name,phone),listings(count),orders(count)';

type Shop = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  verification: string;
  verified_at: string | null;
  verification_requested_at: string | null;
  whatsapp: string | null;
  neighborhood: string | null;
  created_at: string;
  rating_avg: number;
  rating_count: number;
  cities: { name: string } | null;
  profiles: { full_name: string | null; phone: string | null } | null;
  listings: { count: number }[];
  orders: { count: number }[];
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/connexion?suite=/admin');

  const { data: moi } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  // Page réservée : la RLS empêcherait déjà toute action, mais autant ne pas
  // afficher un écran inutilisable.
  if (moi?.role !== 'admin') redirect('/');

  const { data } = await supabase
    .from('shops')
    .select(SHOP_FIELDS)
    .order('created_at', { ascending: false });

  const boutiques = (data ?? []) as unknown as Shop[];
  const enAttente = boutiques
    .filter((b) => b.verification === 'pending')
    .sort((a, b) => (a.verification_requested_at ?? '').localeCompare(b.verification_requested_at ?? ''));
  const autres = boutiques.filter((b) => b.verification !== 'pending');

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Administration</h1>
        <p className="mt-1 text-sm text-ink-500">
          Le badge « Vérifié » est la promesse du produit : ne l&apos;accordez qu&apos;après avoir
          joint le vendeur sur son numéro.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Demandes en attente{' '}
          {enAttente.length > 0 ? (
            <span className="rounded-full bg-accent-100 px-2 py-0.5 align-middle text-sm font-medium text-accent-600">
              {enAttente.length}
            </span>
          ) : null}
        </h2>
        {enAttente.length > 0 ? (
          <ul className="space-y-3">
            {enAttente.map((boutique) => (
              <ShopRow key={boutique.id} boutique={boutique} urgent />
            ))}
          </ul>
        ) : (
          <EmptyState title="Aucune demande en attente" />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Toutes les boutiques ({boutiques.length})</h2>
        {autres.length > 0 ? (
          <ul className="space-y-3">
            {autres.map((boutique) => (
              <ShopRow key={boutique.id} boutique={boutique} />
            ))}
          </ul>
        ) : (
          <EmptyState title="Aucune autre boutique" />
        )}
      </section>
    </div>
  );
}

function ShopRow({ boutique, urgent = false }: { boutique: Shop; urgent?: boolean }) {
  const annonces = boutique.listings[0]?.count ?? 0;
  const commandes = boutique.orders[0]?.count ?? 0;

  return (
    <li
      className={`rounded-xl border bg-surface p-4 ${
        urgent ? 'border-accent-500' : 'border-line'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/boutique/${boutique.slug}`} className="font-medium hover:underline">
          {boutique.name}
        </Link>
        <VerifiedBadge status={boutique.verification} />
        {boutique.verification === 'pending' ? (
          <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-600">
            En attente
          </span>
        ) : null}
        {boutique.verification === 'rejected' ? (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
            Rejetée
          </span>
        ) : null}
        {!boutique.is_active ? (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-ink-500">
            Suspendue
          </span>
        ) : null}
        <div className="ml-auto">
          <Rating average={boutique.rating_avg} count={boutique.rating_count} />
        </div>
      </div>

      <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-ink-500">Propriétaire</dt>
          <dd className="font-medium">{boutique.profiles?.full_name ?? '—'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-ink-500">Téléphone</dt>
          <dd className="font-medium tabular-nums">{boutique.profiles?.phone ?? '—'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-ink-500">WhatsApp</dt>
          <dd className="font-medium tabular-nums">{boutique.whatsapp ?? '—'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-ink-500">Où</dt>
          <dd>
            {boutique.neighborhood ? `${boutique.neighborhood}, ` : ''}
            {boutique.cities?.name ?? '—'}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-ink-500">Activité</dt>
          <dd>
            {annonces} annonce(s) · {commandes} commande(s)
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-ink-500">
            {boutique.verification === 'pending' ? 'Demandé le' : 'Inscrite le'}
          </dt>
          <dd>
            {formatDate(
              boutique.verification === 'pending' && boutique.verification_requested_at
                ? boutique.verification_requested_at
                : boutique.created_at,
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {boutique.verification !== 'verified' ? (
          <form action={setShopVerification}>
            <input type="hidden" name="shop_id" value={boutique.id} />
            <input type="hidden" name="verification" value="verified" />
            <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
              Vérifier
            </button>
          </form>
        ) : (
          <form action={setShopVerification}>
            <input type="hidden" name="shop_id" value={boutique.id} />
            <input type="hidden" name="verification" value="unverified" />
            <button className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-canvas">
              Retirer le badge
            </button>
          </form>
        )}

        {boutique.verification !== 'rejected' ? (
          <form action={setShopVerification}>
            <input type="hidden" name="shop_id" value={boutique.id} />
            <input type="hidden" name="verification" value="rejected" />
            <button className="rounded-lg border border-line px-3 py-1.5 text-sm text-red-700 hover:bg-canvas">
              Rejeter
            </button>
          </form>
        ) : null}

        <form action={setShopActive} className="ml-auto">
          <input type="hidden" name="shop_id" value={boutique.id} />
          <input type="hidden" name="is_active" value={boutique.is_active ? 'false' : 'true'} />
          <button className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-canvas">
            {boutique.is_active ? 'Suspendre' : 'Réactiver'}
          </button>
        </form>
      </div>
    </li>
  );
}
