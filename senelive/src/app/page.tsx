import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { CityFilter } from '@/components/CityFilter';
import { EmptyState, LinkButton, Rating, VerifiedBadge } from '@/components/ui';

const LISTING_FIELDS =
  'id,title,price,compare_at_price,listing_images(path),shops!inner(slug,name,verification,rating_avg,rating_count,cities(name))';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ ville?: string }>;
}) {
  const { ville } = await searchParams;
  const cityId = ville ? Number(ville) : null;
  const supabase = await createClient();

  const [{ data: cities }, { data: shops }] = await Promise.all([
    supabase.from('cities').select('id,name').order('name'),
    supabase
      .from('shops')
      .select('id,slug,name,verification,rating_avg,rating_count,cities(name)')
      .eq('is_active', true)
      .order('rating_avg', { ascending: false })
      .limit(6),
  ]);

  // La ville de l'acheteur passe avant tout : un vendeur proche, c'est une
  // livraison moins chère et un retrait possible.
  let query = supabase
    .from('listings')
    .select(LISTING_FIELDS)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(24);

  if (cityId) query = query.eq('shops.city_id', cityId);

  const { data: listings } = await query;
  const selectedCity = cities?.find((city) => city.id === cityId);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-brand-600 px-6 py-10 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">Acheter près de chez soi, en confiance</h1>
        <p className="mt-2 max-w-xl text-brand-50">
          Des boutiques sénégalaises identifiées, notées après chaque livraison. Plus de vendeur
          anonyme, plus de capture d&apos;écran.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <LinkButton href="/inscription" variant="inverse">
            Ouvrir ma boutique
          </LinkButton>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {selectedCity ? `Articles à ${selectedCity.name}` : 'Articles récents'}
          </h2>
          <Suspense fallback={null}>
            <CityFilter cities={cities ?? []} />
          </Suspense>
        </div>

        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(listings as unknown as ListingCardData[]).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={
              selectedCity
                ? `Aucun article à ${selectedCity.name} pour l'instant`
                : 'Aucun article en ligne pour l’instant'
            }
            hint="Les premières boutiques arrivent. Vous pouvez être la première."
            action={<LinkButton href="/vendeur">Ouvrir ma boutique</LinkButton>}
          />
        )}
      </section>

      {shops && shops.length > 0 ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Boutiques</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={`/boutique/${shop.slug}`}
                className="rounded-xl border border-line bg-surface p-4 transition hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{shop.name}</span>
                  <VerifiedBadge status={shop.verification} />
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                  {shop.cities ? <span>{shop.cities.name}</span> : null}
                  <Rating average={shop.rating_avg} count={shop.rating_count} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
