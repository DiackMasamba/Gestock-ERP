import Link from 'next/link';

export default function ConfirmationPage() {
  return (
    <div className="mx-auto max-w-sm py-10 text-center">
      <h1 className="text-xl font-bold">Vérifiez votre boîte mail</h1>
      <p className="mt-2 text-sm text-ink-500">
        Nous vous avons envoyé un lien de confirmation. Cliquez dessus pour activer votre compte,
        puis revenez vous connecter.
      </p>
      <Link
        href="/connexion"
        className="mt-6 inline-flex rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Aller à la connexion
      </Link>
    </div>
  );
}
