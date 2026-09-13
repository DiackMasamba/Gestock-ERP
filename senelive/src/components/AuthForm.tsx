'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signIn, signUp, type AuthState } from '@/lib/actions/auth';
import { Button, ErrorText, inputClass, labelClass } from '@/components/ui';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Un instant…' : label}
    </Button>
  );
}

export function AuthForm({ mode, next }: { mode: 'signin' | 'signup'; next?: string }) {
  const action = mode === 'signin' ? signIn : signUp;
  const [state, formAction] = useActionState<AuthState, FormData>(action, {});

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <ErrorText message={state.error} />

      {mode === 'signup' ? (
        <div>
          <label className={labelClass} htmlFor="full_name">
            Nom complet
          </label>
          <input id="full_name" name="full_name" required className={`${inputClass} mt-1`} />
        </div>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={`${inputClass} mt-1`}
        />
      </div>

      {mode === 'signup' ? (
        <div>
          <label className={labelClass} htmlFor="phone">
            Téléphone <span className="font-normal text-ink-400">(optionnel)</span>
          </label>
          <input
            id="phone"
            name="phone"
            inputMode="tel"
            placeholder="77 123 45 67"
            className={`${inputClass} mt-1`}
          />
          <p className="mt-1 text-xs text-ink-500">
            Indicatif +221 ajouté automatiquement. La vérification par SMS arrive bientôt.
          </p>
        </div>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          required
          minLength={mode === 'signup' ? 8 : undefined}
          className={`${inputClass} mt-1`}
        />
      </div>

      {mode === 'signup' ? (
        <label className="flex items-start gap-2 rounded-lg border border-line bg-surface p-3 text-sm">
          <input type="checkbox" name="role" value="seller" className="mt-0.5 size-4" />
          <span>
            <span className="font-medium">Je veux vendre</span>
            <span className="block text-ink-500">
              Vous pourrez ouvrir votre boutique juste après.
            </span>
          </span>
        </label>
      ) : null}

      {next ? <input type="hidden" name="suite" value={next} /> : null}

      <Submit label={mode === 'signin' ? 'Se connecter' : 'Créer mon compte'} />
    </form>
  );
}
