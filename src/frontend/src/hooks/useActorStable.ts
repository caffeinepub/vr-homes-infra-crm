import { useInternetIdentity } from './useInternetIdentity';
import { useQuery } from '@tanstack/react-query';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { getSecretParameter } from '../utils/urlParams';
import { markStart, markEnd } from '../utils/startupPerf';

const ACTOR_QUERY_KEY = 'actor-stable';

export function useActorStable() {
  const { identity, isInitializing: identityInitializing } = useInternetIdentity();

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;
      const perfLabel = isAuthenticated ? 'actor-init-authenticated' : 'actor-init-anonymous';
      markStart(perfLabel);

      try {
        if (!isAuthenticated) {
          const actor = await createActorWithConfig();
          markEnd(perfLabel);
          return actor;
        }

        const actorOptions = {
          agentOptions: {
            identity,
          },
        };

        const actor = await createActorWithConfig(actorOptions);
        const adminToken = getSecretParameter('caffeineAdminToken') || '';
        await actor._initializeAccessControlWithSecret(adminToken);
        markEnd(perfLabel);
        return actor;
      } catch (error) {
        markEnd(perfLabel);
        throw error;
      }
    },
    staleTime: Infinity,
    enabled: !identityInitializing,
    retry: 1, // Reduced retry count for faster failure feedback in production
    retryDelay: 1000,
  });

  return {
    actor: actorQuery.data || null,
    isLoading: actorQuery.isLoading || identityInitializing,
    isError: actorQuery.isError,
    error: actorQuery.error,
  };
}
