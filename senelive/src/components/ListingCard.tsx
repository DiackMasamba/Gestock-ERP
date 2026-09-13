import Link from 'next/link';
import { Price, Rating, VerifiedBadge } from '@/components/ui';
import { publicUrl } from '@/lib/media';

export type ListingCardData = {
  id: string;
  title: string;
  price: number;
  compare_at_price: number | null;
  listing_images: { path: string }[];
  shops: {
    slug: string;
    name: string;
    verification: string;
    rating_avg: number;
    rating_count: number;
    cities: { name: string } | null;
  } | null;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const cover = publicUrl('listing-images', listing.listing_images[0]?.path);
  const shop = listing.shops;

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-surface transition hover:shadow-sm">
      <Link href={`/produit/${listing.id}`} className="block">
        <div className="aspect-square w-full bg-canvas">
          {cover ? (
            // Bucket public : une balise img évite de dépendre de la config
            // d'optimisation d'images pour un contenu uploadé par les vendeurs.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={listing.title}
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-ink-400">
              Pas de photo
            </div>
          )}
        </div>

        <div className="space-y-1.5 p-3">
          <h3 className="line-clamp-2 text-sm font-medium">{listing.title}</h3>
          <div className="flex items-baseline gap-2">
            <Price amount={listing.price} className="text-brand-700" />
            {listing.compare_at_price ? (
              <span className="text-xs text-ink-400 line-through tabular-nums">
                {listing.compare_at_price.toLocaleString('fr-SN')}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {shop ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line px-3 py-2">
          <Link
            href={`/boutique/${shop.slug}`}
            className="truncate text-xs font-medium text-ink-700 hover:underline"
          >
            {shop.name}
          </Link>
          <VerifiedBadge status={shop.verification} />
          {shop.cities ? <span className="text-xs text-ink-400">· {shop.cities.name}</span> : null}
          <div className="ml-auto">
            <Rating average={shop.rating_avg} count={shop.rating_count} />
          </div>
        </div>
      ) : null}
    </article>
  );
}
