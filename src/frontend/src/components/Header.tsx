import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { LogOut, LogIn, Loader2 } from 'lucide-react';

export default function Header() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        // Production: silent error handling, no console logs
        if (import.meta.env.DEV) {
          console.error('Login error:', error);
        }
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/vr-homes-logo-transparent.dim_200x200.png"
            alt="VR Homes"
            className="w-10 h-10"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">VR Homes Infra</h1>
            <p className="text-xs text-muted-foreground">CRM System</p>
          </div>
        </div>

        <Button onClick={handleAuth} disabled={disabled} variant={isAuthenticated ? 'outline' : 'default'}>
          {disabled ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : isAuthenticated ? (
            <>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
