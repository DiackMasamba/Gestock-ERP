import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EmptyState, LinkButton, Price, StatusBadge } from '@/components/ui';
import { ReviewForm } from '@/components/ReviewForm';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, formatDate } from '@/lib/format';
import { updateOrderStatus } from '@/lib/actions/order';

export default async function CommandesPage({
  searchParams,
}: {
  searchParams: Promise<{ nouvelle?: string }>;
}) {
  const { nouvelle } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/connexion?suite=/commandes');

  const { data: orders } = await supabase
    .from('orders')
    .select(
      'id,order_number,status,payment_method,subtotal,delivery_fee,total,delivery_address,created_at,shops(slug,name),order_items(id,title,quantity,unit_price,line_total)',
    )
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

  const { data: reviews } = await supabase
    .from('reviews')
    .select('order_id')
    .in('order_id', (orders ?? []).map((order) => order.id).slice(0, 100));

  const reviewed = new Set((reviews ?? []).map((review) => review.order_id));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mes commandes</h1>

      {nouvelle ? (
        <p className="rounded-lg bg-brand-100 px-4 py-3 text-sm text-brand-700">
          Commande envoyée. Le vendeur va la confirmer — vous la suivez ici.
        </p>
      ) : null}

      {orders && orders.length > 0 ? (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-sm text-ink-500">{order.order_number}</span>
                <StatusBadge status={order.status} label={ORDER_STATUS_LABELS[order.status]} />
                <span className="ml-auto text-xs text-ink-400">{formatDate(order.created_at)}</span>
              </div>

              {order.shops ? (
                <Link
                  href={`/boutique/${order.shops.slug}`}
                  className="mt-2 inline-block text-sm font-medium hover:underline"
                >
                  {order.shops.name}
                </Link>
              ) : null}

              <ul className="mt-3 space-y-1 text-sm">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span className="truncate">
                      {item.title} <span className="text-ink-400">× {item.quantity}</span>
                    </span>
                    <Price amount={item.line_total ?? item.unit_price * item.quantity} />
                  </li>
                ))}
              </ul>

              <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-500">Sous-total</dt>
                  <dd><Price amount={order.subtotal} /></dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">Livraison</dt>
                  <dd><Price amount={order.delivery_fee} /></dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>Total</dt>
                  <dd><Price amount={order.total} className="text-brand-700" /></dd>
                </div>
              </dl>

              <p className="mt-2 text-xs text-ink-500">
                {PAYMENT_METHOD_LABELS[order.payment_method]} · {order.delivery_address}
              </p>

              {order.status === 'pending' ? (
                <form action={updateOrderStatus} className="mt-3">
                  <input type="hidden" name="order_id" value={order.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <button className="text-sm text-red-700 hover:underline">
                    Annuler la commande
                  </button>
                </form>
              ) : null}

              {order.status === 'delivered' && !reviewed.has(order.id) ? (
                <ReviewForm orderId={order.id} />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Aucune commande pour l’instant"
          hint="Vos achats apparaîtront ici, avec leur suivi."
          action={<LinkButton href="/">Voir les articles</LinkButton>}
        />
      )}
    </div>
  );
}
