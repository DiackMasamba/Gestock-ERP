import Link from 'next/link';
import { formatCfa } from '@/lib/format';

export function Price({ amount, className = '' }: { amount: number; className?: string }) {
  return <span className={`font-semibold tabular-nums ${className}`}>{formatCfa(amount)}</span>;
}

/**
 * Le badge de confiance : un vendeur vérifié a prouvé son numéro et son
 * identité. C'est ce qui remplace l'anonymat des captures d'écran.
 */
export function VerifiedBadge({ status }: { status: string }) {
  if (status !== 'verified') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-ink-500">
        Non vérifié
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden>
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
          clipRule="evenodd"
        />
      </svg>
      Vérifié
    </span>
  );
}

export function Rating({ average, count }: { average: number; count: number }) {
  if (count === 0) {
    return <span className="text-xs text-ink-400">Pas encore d&apos;avis</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-700">
      <span className="text-accent-500">★</span>
      <span className="font-medium tabular-nums">{Number(average).toFixed(1)}</span>
      <span className="text-ink-400">({count})</span>
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-accent-100 text-accent-600',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-brand-100 text-brand-700',
  cancelled: 'bg-gray-100 text-ink-500',
  refunded: 'bg-gray-100 text-ink-500',
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? 'bg-gray-100 text-ink-500'
      }`}
    >
      {label}
    </span>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <p className="font-medium text-ink-700">{title}</p>
      {hint ? <p className="mt-1 text-sm text-ink-500">{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) {
  const styles =
    variant === 'primary'
      ? 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-200'
      : 'border border-line bg-surface text-ink-700 hover:bg-canvas';
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

// Les variantes sont exclusives : concaténer `bg-white` après `bg-brand-600`
// ne suffirait pas, deux utilitaires de même spécificité se départagent par
// leur ordre dans la feuille générée, pas par l'ordre dans l'attribut class.
const LINK_VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  inverse: 'bg-white text-brand-700 hover:bg-brand-50',
} as const;

export function LinkButton({
  href,
  children,
  variant = 'primary',
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof LINK_VARIANTS;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${LINK_VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export const inputClass =
  'w-full rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export const labelClass = 'block text-sm font-medium text-ink-700';
