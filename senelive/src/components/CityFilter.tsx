'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function CityFilter({ cities }: { cities: { id: number; name: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get('ville') ?? '';

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-ink-500">Près de</span>
      <select
        value={current}
        onChange={(event) => {
          const next = new URLSearchParams(params);
          if (event.target.value) next.set('ville', event.target.value);
          else next.delete('ville');
          router.push(`/?${next.toString()}`);
        }}
        className="rounded-lg border border-line bg-surface px-2 py-1.5"
      >
        <option value="">Tout le Sénégal</option>
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>
    </label>
  );
}
