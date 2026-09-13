import type { NextConfig } from 'next';

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Le dépôt parent a son propre lockfile (app Expo) : sans cette ancre, Next
  // remonte trop haut pour déterminer la racine du workspace.
  outputFileTracingRoot: import.meta.dirname,
  images: supabaseHost
    ? { remotePatterns: [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }] }
    : undefined,
};

export default nextConfig;
