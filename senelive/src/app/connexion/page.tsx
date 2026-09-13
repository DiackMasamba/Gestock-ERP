import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const { suite } = await searchParams;

  return (
    <div className="mx-auto max-w-sm py-6">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <p className="mt-1 text-sm text-ink-500">Retrouvez vos commandes et votre boutique.</p>

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
