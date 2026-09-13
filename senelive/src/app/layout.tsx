import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'SeneLive — acheter en direct, au Sénégal',
  description:
    'La marketplace des vendeurs vérifiés du Sénégal : des boutiques près de chez vous, des vendeurs notés, une commande en trois taps.',
};

export const viewport: Viewport = {
  themeColor: '#10a37f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <Header />
        <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto w-full max-w-5xl px-4 py-10 text-sm text-ink-500">
          SeneLive — vendeurs vérifiés, livraison de quartier.
        </footer>
      </body>
    </html>
  );
}
