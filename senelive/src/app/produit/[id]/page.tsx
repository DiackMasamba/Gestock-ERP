import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OrderForm } from '@/components/OrderForm';
import { LinkButton, Price, Rating, VerifiedBadge } from '@/components/ui';
import { publicUrl } from '@/lib/media';

const CONDITION_LABELS: Record<string, string> = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  good: 'Bon état',
  fair: 'État correct',
};

export default async function ProduitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from('listings')
    .select(
      'id,title,description,price,compare_at_price,quantity,condition,status,listing_images(path,position),shops(id,slug,name,verification,rating_avg,rating_count,neighborhood,cities(name))',
    )
    .eq('id', id)
    .maybeSingle();

  if (!listing) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: cities }, { data: profile }] = await Promise.all([
    supabase.from('cities').select('id,name').order('name'),
    user
      ? supabase.from('profiles').select('city_id,phone').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const shop = listing.shops;
  const images = [...listing.listing_images].sort((a, b) => a.position - b.position);
  const isOwner = Boolean(user && shop && (await isShopOwner(supabase, shop.id, user.id)));
  const available = listing.status === 'active' && listing.quantity > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="aspect-square overflow-hidden rounded-xl border border-line bg-surface">
          {images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={publicUrl('listing-images', images[0].path)!}
              alt={listing.title}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-ink-400">
              Pas de photo
            </div>
          )}
        </div>
        {images.length > 1 ? (
          <div className="grid grid-cols-4 gap-2">
            {images.slice(1, 5).map((image) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={image.path}
                src={publicUrl('listing-images', image.path)!}
                alt=""
                className="aspect-square w-full rounded-lg border border-line object-cover"
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{listing.title}</h1>
          <div className="mt-2 flex items-baseline gap-3">
            <Price amount={listing.price} className="text-2xl text-brand-700" />
            {listing.compare_at_price ? (
              <span className="text-ink-400 line-through tabular-nums">
                {listing.compare_at_price.toLocaleString('fr-SN')} FCFA
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {CONDITION_LABELS[listing.condition]} · {listing.quantity} en stock
          </p>
        </div>

        {shop ? (
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/boutique/${shop.slug}`} className="font-medium hover:underline">
                {shop.name}
              </Link>
              <VerifiedBadge status={shop.verification} />
              <div className="ml-auto">
                <Rating average={shop.rating_avg} count={shop.rating_count} />
              </div>
            </div>
            {shop.cities ? (
              <p className="mt-1 text-sm text-ink-500">
                {shop.neighborhood ? `${shop.neighborhood}, ` : ''}
                {shop.cities.name}
              </p>
            ) : null}
          </div>
        ) : null}

        {listing.description ? (
          <p className="whitespace-pre-line text-sm text-ink-700">{listing.description}</p>
        ) : null}

        {!available ? (
          <p className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-ink-500">
            Cet article n&apos;est plus disponible.
          </p>
        ) : isOwner ? (
          <p className="rounded-lg bg-accent-100 px-3 py-2 text-sm text-accent-600">
            C&apos;est votre article — vous ne pouvez pas le commander.
          </p>
        ) : user ? (
          <OrderForm
            listingId={listing.id}
            unitPrice={listing.price}
            maxQuantity={listing.quantity}
            cities={cities ?? []}
            defaultCityId={profile?.city_id ?? null}
            defaultPhone={profile?.phone ?? null}
          />
        ) : (
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-sm text-ink-700">Connectez-vous pour commander en deux taps.</p>
            <LinkButton href={`/connexion?suite=/produit/${listing.id}`} className="mt-3 w-full">
              Se connecter
            </LinkButton>
          </div>
        )}
      </div>
    </div>
  );
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function isShopOwner(supabase: SupabaseClient, shopId: string, userId: string) {
  const { data } = await supabase
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_id', userId)
    .maybeSingle();
  return Boolean(data);
}
