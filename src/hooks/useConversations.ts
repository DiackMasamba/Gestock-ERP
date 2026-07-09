import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/auth/AuthProvider';
import { listColleagues, listConversations } from '@/services/conversations';
import { queryKeys } from './queryKeys';

export function useConversations() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: queryKeys.conversations,
    enabled: !!userId,
    queryFn: () => listConversations(userId!),
  });
}

export function useColleagues() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: queryKeys.colleagues,
    enabled: !!userId,
    queryFn: () => listColleagues(userId!),
  });
}
