'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createShop, type ShopState } from '@/lib/actions/shop';
import { Button, ErrorText, inputClass, labelClass } from '@/components/ui';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Création…' : 'Ouvrir ma boutique'}
    </Button>
  );
}

export function ShopForm({ cities }: { cities: { id: number; name: string }[] }) {
  const [state, formAction] = useActionState<ShopState, FormData>(createShop, {});

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-line bg-surface p-5">
      <ErrorText message={state.error} />

      <div>
        <label className={labelClass} htmlFor="name">
          Nom de la boutique
        </label>
        <input id="name" name="name" required maxLength={60} className={`${inputClass} mt-1`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="city_id">
            Ville
          </label>
          <select id="city_id" name="city_id" required className={`${inputClass} mt-1`}>
            <option value="">Choisir…</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="neighborhood">
            Quartier
          </label>
          <input id="neighborhood" name="neighborhood" className={`${inputClass} mt-1`} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="whatsapp">
          WhatsApp <span className="font-normal text-ink-400">(optionnel)</span>
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          inputMode="tel"
          placeholder="77 123 45 67"
          className={`${inputClass} mt-1`}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          Présentation
        </label>
        <textarea id="description" name="description" rows={3} className={`${inputClass} mt-1`} />
      </div>

      <Submit />
    </form>
  );
}
