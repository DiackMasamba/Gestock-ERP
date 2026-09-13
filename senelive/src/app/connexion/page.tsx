import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { ErrorText } from '@/components/ui';

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string; erreur?: string }>;
}) {
  const { suite, erreur } = await searchParams;

  return (
    <div className="mx-auto max-w-sm py-6">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <p className="mt-1 text-sm text-ink-500">Retrouvez vos commandes et votre boutique.</p>

      {erreur === 'lien' ? (
        <div className="mt-4">
          <ErrorText message="Ce lien de confirmation a expiré ou a déjà été utilisé. Connectez-vous, ou refaites une inscription." />
        </div>
      ) : null}

      <AuthForm mode="signin" next={suite} />

      <p className="mt-6 text-sm text-ink-500">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="font-medium text-brand-700 hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
