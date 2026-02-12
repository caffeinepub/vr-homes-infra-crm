import { ReactNode } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface StartupGateProps {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
  children: ReactNode;
}

export default function StartupGate({ isLoading, isError, error, onRetry, children }: StartupGateProps) {
  if (isError) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Unable to Load Dashboard</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>{error?.message || 'An error occurred while loading your dashboard. Please try again.'}</p>
            <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-8 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  return <>{children}</>;
}
