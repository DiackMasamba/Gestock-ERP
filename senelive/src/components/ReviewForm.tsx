'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { leaveReview, type ReviewState } from '@/lib/actions/review';
import { Button, ErrorText, inputClass } from '@/components/ui';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Envoi…' : 'Publier mon avis'}
    </Button>
  );
}

export function ReviewForm({ orderId }: { orderId: string }) {
  const [state, formAction] = useActionState<ReviewState, FormData>(leaveReview, {});
  const [rating, setRating] = useState(5);

  if (state.ok) {
    return <p className="text-sm text-brand-700">Merci, votre avis est publié.</p>;
  }

  return (
    <form action={formAction} className="mt-3 space-y-3 border-t border-line pt-3">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="rating" value={rating} />
      <ErrorText message={state.error} />

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
            className={`text-2xl leading-none ${value <= rating ? 'text-accent-500' : 'text-ink-400'}`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        name="comment"
        rows={2}
        placeholder="Comment s'est passée la livraison ?"
        className={inputClass}
      />
      <Submit />
    </form>
  );
}
