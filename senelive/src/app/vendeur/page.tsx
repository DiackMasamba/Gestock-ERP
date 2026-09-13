import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ShopForm } from '@/components/ShopForm';
import { NewListingForm } from '@/components/NewListingForm';
import { EmptyState, Price, Rating, StatusBadge, VerifiedBadge } from '@/components/ui';
import { ORDER_STATUS_LABELS, formatDate } from '@/lib/format';
import { updateOrderStatus } from '@/lib/actions/order';
import { setListingStatus } from '@/lib/actions/listing';

/** Prochaine étape proposée au vendeur pour chaque statut. */
const NEXT_STEP: Record<string, { status: string; label: string } | undefined> = {
  pending: { status: 'confirmed', label: 'Confirmer' },
  confirmed: { status: 'shipped', label: 'Marquer expédiée' },
  shipped: { status: 'delivered', label: 'Marquer livrée' },
};

export default async function VendeurPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Le middleware protège déjà cette route, mais une page qui suppose une
  // session doit la vérifier elle-même : sinon une erreur de configuration se
  // traduit par un 500 au lieu d'une redirection.
  if (!user) redirect('/connexion?suite=/vendeur');

  const { data: shop } = await supabase
    .from('shops')
    .select('id,name,slug,verification,rating_avg,rating_count,cities(name)')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!shop) {
    const { data: cities } = await supabase.from('cities').select('id,name').order('name');
    return (
      <div className="mx-auto max-w-lg space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Ouvrir ma boutique</h1>
          <p className="mt-1 text-sm text-ink-500">
            Votre ville détermine qui vous voit en premier et le coût de livraison.
          </p>
        </div>
        <ShopForm cities={cities ?? []} />
      </div>
    );
  }

  const [{ data: listings }, { data: orders }, { data: categories }] = await Promise.all([
    supabase
      .from('listings')
      .select('id,title,price,quantity,status,created_at')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select(
        'id,order_number,status,total,delivery_address,delivery_phone,created_at,order_items(id,title,quantity)',
      )
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id,name').order('position'),
  ]);

  const pendingCount = (orders ?? []).filter((order) => order.status === 'pending').length;

  return (
    <div className="space-y-8">
      <header className="rounded-xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold">{shop.name}</h1>
          <VerifiedBadge status={shop.verification} />
          <Link
            href={`/boutique/${shop.slug}`}
            className="ml-auto text-sm text-brand-700 hover:underline"
          >
            Voir ma vitrine
          </Link>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-500">
          {shop.cities ? <span>{shop.cities.name}</span> : null}
          <Rating average={shop.rating_avg} count={shop.rating_count} />
          <span>{listings?.length ?? 0} article(s)</span>
          {pendingCount > 0 ? (
            <span className="font-medium text-accent-600">
              {pendingCount} commande(s) à confirmer
            </span>
          ) : null}
        </div>
        {shop.verification !== 'verified' ? (
          <p className="mt-3 rounded-lg bg-accent-100 px-3 py-2 text-sm text-accent-600">
            Votre boutique n&apos;est pas encore vérifiée. Vous pouvez vendre, mais le badge
            « Vérifié » rassure les acheteurs — il est attribué après contrôle de votre numéro.
          </p>
        ) : null}
      </header>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Commandes reçues</h2>
        {orders && orders.length > 0 ? (
          <ul className="space-y-3">
            {orders.map((order) => {
              const next = NEXT_STEP[order.status];
              return (
                <li key={order.id} className="rounded-xl border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-sm text-ink-500">{order.order_number}</span>
                    <StatusBadge status={order.status} label={ORDER_STATUS_LABELS[order.status]} />
                    <span className="ml-auto text-xs text-ink-400">
                      {formatDate(order.created_at)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm">
                    {order.order_items.map((item) => `${item.title} × ${item.quantity}`).join(', ')}
                  </p>
                  <p className="mt-1 text-sm text-ink-500">
                    {order.delivery_address} · {order.delivery_phone}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <Price amount={order.total} className="text-brand-700" />
                    {next ? (
                      <form action={updateOrderStatus} className="ml-auto">
                        <input type="hidden" name="order_id" value={order.id} />
                        <input type="hidden" name="status" value={next.status} />
                        <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
                          {next.label}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="Aucune commande pour l’instant" />
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Mes articles</h2>
        {listings && listings.length > 0 ? (
          <ul className="mb-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {listings.map((listing) => (
              <li key={listing.id} className="flex flex-wrap items-center gap-3 p-3">
                <Link href={`/produit/${listing.id}`} className="min-w-0 flex-1 hover:underline">
                  <span className="block truncate text-sm font-medium">{listing.title}</span>
                  <span className="text-xs text-ink-500">
                    {listing.quantity} en stock · {listing.status}
                  </span>
                </Link>
                <Price amount={listing.price} className="text-sm" />
                <form action={setListingStatus}>
                  <input type="hidden" name="listing_id" value={listing.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={listing.status === 'active' ? 'archived' : 'active'}
                  />
                  <button className="rounded-lg border border-line px-3 py-1.5 text-xs hover:bg-canvas">
                    {listing.status === 'active' ? 'Retirer' : 'Remettre en ligne'}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}

        <h3 className="mb-3 text-sm font-semibold text-ink-700">Ajouter un article</h3>
        <NewListingForm shopId={shop.id} categories={categories ?? []} />
      </section>
    </div>
  );
}
