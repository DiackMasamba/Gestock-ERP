'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { placeOrder, type OrderState } from '@/lib/actions/order';
import { Button, ErrorText, Price, inputClass, labelClass } from '@/components/ui';
import { PAYMENT_METHOD_LABELS } from '@/lib/format';

const METHODS = ['wave', 'orange_money', 'free_money', 'cash_on_delivery'] as const;

function Submit({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Envoi…' : <>Commander — <Price amount={total} className="ml-1" /></>}
    </Button>
  );
}

export function OrderForm({
  listingId,
  unitPrice,
  maxQuantity,
  cities,
  defaultCityId,
  defaultPhone,
}: {
  listingId: string;
  unitPrice: number;
  maxQuantity: number;
  cities: { id: number; name: string }[];
  defaultCityId: number | null;
  defaultPhone: string | null;
}) {
  const [state, formAction] = useActionState<OrderState, FormData>(placeOrder, {});
  const [quantity, setQuantity] = useState(1);

  // Les frais réels sont recalculés par la base ; cet aperçu suit la même règle
  // pour éviter une surprise au moment de valider.
  const estimatedTotal = unitPrice * quantity;

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-line bg-surface p-4">
      <input type="hidden" name="listing_id" value={listingId} />
      <ErrorText message={state.error} />

      <div className="flex items-center gap-3">
        <label className={labelClass} htmlFor="quantity">
          Quantité
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          max={maxQuantity}
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
          className="w-20 rounded-lg border border-line bg-surface px-3 py-2 text-center"
        />
        <span className="text-sm text-ink-500">{maxQuantity} disponible(s)</span>
      </div>

      <div>
        <span className={labelClass}>Paiement</span>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {METHODS.map((method, index) => (
            <label
              key={method}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm has-checked:border-brand-500 has-checked:bg-brand-50"
            >
              <input
                type="radio"
                name="payment_method"
                value={method}
                defaultChecked={index === 0}
                className="size-4"
              />
              {PAYMENT_METHOD_LABELS[method]}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="delivery_city_id">
          Ville de livraison
        </label>
        <select
          id="delivery_city_id"
          name="delivery_city_id"
          required
          defaultValue={defaultCityId ?? ''}
          className={`${inputClass} mt-1`}
        >
          <option value="">Choisir…</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="delivery_address">
          Quartier et repère
        </label>
        <input
          id="delivery_address"
          name="delivery_address"
          required
          placeholder="Sacré-Cœur 3, en face de la pharmacie"
          className={`${inputClass} mt-1`}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="delivery_phone">
          Téléphone
        </label>
        <input
          id="delivery_phone"
          name="delivery_phone"
          inputMode="tel"
          required
          defaultValue={defaultPhone ?? ''}
          placeholder="77 123 45 67"
          className={`${inputClass} mt-1`}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="buyer_note">
          Message au vendeur <span className="font-normal text-ink-400">(optionnel)</span>
        </label>
        <textarea id="buyer_note" name="buyer_note" rows={2} className={`${inputClass} mt-1`} />
      </div>

      <p className="text-xs text-ink-500">
        Les frais de livraison sont ajoutés par le vendeur selon votre ville.
      </p>

      <Submit total={estimatedTotal} />
    </form>
  );
}
