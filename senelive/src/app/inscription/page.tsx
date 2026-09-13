import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';

export default function InscriptionPage() {
  return (
    <div className="mx-auto max-w-sm py-6">
      <h1 className="text-2xl font-bold">Créer un compte</h1>
      <p className="mt-1 text-sm text-ink-500">
        Acheter, ou ouvrir votre boutique. Une seule inscription.
      </p>

      <AuthForm mode="signup" />

      <p className="mt-6 text-sm text-ink-500">
        Déjà inscrit ?{' '}
        <Link href="/connexion" className="font-medium text-brand-700 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
