import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { EmptyState, Rating, VerifiedBadge } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { publicUrl } from '@/lib/media';

export default async function BoutiquePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from('shops')
    .select(
      'id,name,slug,description,logo_url,verification,rating_avg,rating_count,neighborhood,created_at,cities(name,regions(name))',
    )
    .eq('slug', slug)
    .maybeSingle();

  if (!shop) notFound();

  const [{ data: listings }, { data: reviews }] = await Promise.all([
    supabase
      .from('listings')
      .select(
        'id,title,price,compare_at_price,listing_images(path),shops!inner(slug,name,verification,rating_avg,rating_count,cities(name))',
      )
      .eq('shop_id', shop.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('id,rating,comment,author_name,created_at')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const logo = publicUrl('shop-media', shop.logo_url);

  return (
    <div className="space-y-8">
      <header className="rounded-xl border border-line bg-surface p-5">
        <div className="flex items-start gap-4">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="size-16 rounded-full object-cover" />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
              {shop.name.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold">{shop.name}</h1>
              <VerifiedBadge status={shop.verification} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
              <Rating average={shop.rating_avg} count={shop.rating_count} />
              {shop.cities ? (
                <span>
                  {shop.neighborhood ? `${shop.neighborhood}, ` : ''}
                  {shop.cities.name}
                  {shop.cities.regions ? ` (${shop.cities.regions.name})` : ''}
                </span>
              ) : null}
              <span>Depuis {formatDate(shop.created_at)}</span>
            </div>
            {shop.description ? (
              <p className="mt-3 whitespace-pre-line text-sm text-ink-700">{shop.description}</p>
            ) : null}
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Articles en vente</h2>
        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(listings as unknown as ListingCardData[]).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState title="Aucun article en ligne pour l’instant" />
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">
          Avis {shop.rating_count > 0 ? `(${shop.rating_count})` : ''}
        </h2>
        {reviews && reviews.length > 0 ? (
          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-accent-500">{'★'.repeat(review.rating)}</span>
                  <span className="text-ink-400">{'★'.repeat(5 - review.rating)}</span>
                  <span className="font-medium">{review.author_name ?? 'Acheteur'}</span>
                  <span className="ml-auto text-xs text-ink-400">
                    {formatDate(review.created_at)}
                  </span>
                </div>
                {review.comment ? (
                  <p className="mt-2 text-sm text-ink-700">{review.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Aucun avis pour l’instant"
            hint="Seuls les acheteurs dont la commande a été livrée peuvent noter cette boutique."
          />
        )}
      </section>
    </div>
  );
}
