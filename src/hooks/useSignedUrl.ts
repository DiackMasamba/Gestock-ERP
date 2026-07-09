import { useQuery } from '@tanstack/react-query';

import { getSignedUrl } from '@/services/storage';
import { queryKeys } from './queryKeys';

/** Résout une URL signée (temporaire) pour une pièce jointe privée. */
export function useSignedUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.signedUrl(path ?? ''),
    enabled: !!path,
    queryFn: () => getSignedUrl(path!),
    staleTime: 50 * 60 * 1000, // l'URL est valable 1h côté serveur
  });
}
