import { useGetCallerUserProfile, useIsAdmin } from './useQueries';
import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

export interface StartupGuardsState {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  userProfile: any;
  isAdmin: boolean | undefined;
  isFetched: boolean;
  retry: () => void;
}

export interface UseStartupGuardsOptions {
  enabled?: boolean;
}

export function useStartupGuards(options?: UseStartupGuardsOptions): StartupGuardsState {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const enabled = options?.enabled ?? true;

  const profileQuery = useGetCallerUserProfile({ enabled });
  const adminQuery = useIsAdmin({ enabled });

  const isAuthenticated = !!identity;

  // Only show loading when authenticated and enabled
  const isLoading = isAuthenticated && enabled && (profileQuery.isLoading || adminQuery.isLoading);
  const isError = enabled && (profileQuery.isError || adminQuery.isError);
  const error = (profileQuery.error || adminQuery.error) as Error | null;

  const retry = () => {
    // Only invalidate startup-critical queries to keep post-login transitions lightweight
    queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
  };

  return {
    isLoading,
    isError,
    error,
    userProfile: profileQuery.data,
    isAdmin: adminQuery.data,
    isFetched: profileQuery.isFetched && adminQuery.isFetched,
    retry,
  };
}
