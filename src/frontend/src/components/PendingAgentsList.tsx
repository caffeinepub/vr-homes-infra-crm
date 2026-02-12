import { useGetAllAgentProfiles, useApproveAgent, useRejectAgent } from '../hooks/useQueries';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, CheckCircle, XCircle, User, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useMemo, useState } from 'react';
import { isPending } from '../utils/approvalStatus';

export default function PendingAgentsList() {
  const { data: allAgents, isLoading, isError, error, refetch } = useGetAllAgentProfiles();
  const approveAgent = useApproveAgent();
  const rejectAgent = useRejectAgent();
  const [processingMobile, setProcessingMobile] = useState<string | null>(null);

  const pendingAgents = useMemo(() => {
    if (!allAgents || !Array.isArray(allAgents)) return [];
    return allAgents.filter(agent => isPending(agent.status));
  }, [allAgents]);

  const handleApprove = async (mobile: string) => {
    setProcessingMobile(mobile);
    try {
      await approveAgent.mutateAsync(mobile);
    } finally {
      setProcessingMobile(null);
    }
  };

  const handleReject = async (mobile: string) => {
    setProcessingMobile(mobile);
    try {
      await rejectAgent.mutateAsync(mobile);
    } finally {
      setProcessingMobile(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state with retry option
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load agent profiles';
    const isAuthError = errorMessage.toLowerCase().includes('unauthorized') || 
                        errorMessage.toLowerCase().includes('permission');

    return (
      <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
        <AlertCircle className="h-5 w-5" />
        <AlertDescription className="ml-2">
          <div className="space-y-3">
            <p className="font-medium">Unable to load pending agent registrations</p>
            <p className="text-sm">
              {isAuthError 
                ? 'You do not have permission to view agent profiles. Please ensure you are logged in as an administrator.'
                : errorMessage}
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
              {isAuthError && (
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Re-login
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (pendingAgents.length === 0) {
    return (
      <Alert>
        <AlertDescription>No pending agent registrations at this time.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {pendingAgents.map((agent) => {
        const isProcessing = processingMobile === agent.mobile;
        // Convert face embeddings to blob URL for display
        // Cast to Uint8Array to ensure proper type for Blob
        const faceImageUrl = agent.faceEmbeddings.length > 0
          ? URL.createObjectURL(new Blob([new Uint8Array(agent.faceEmbeddings)], { type: 'image/jpeg' }))
          : null;

        return (
          <Card key={agent.mobile} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {faceImageUrl ? (
                      <img
                        src={faceImageUrl}
                        alt={agent.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{agent.name}</h3>
                      <Badge variant="outline" className="mt-1">
                        Pending Approval
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Mobile:</span>
                      <span className="ml-2 text-muted-foreground">{agent.mobile}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Email:</span>
                      <span className="ml-2 text-muted-foreground">{agent.email}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleApprove(agent.mobile)}
                      disabled={isProcessing}
                      size="sm"
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(agent.mobile)}
                      disabled={isProcessing}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
