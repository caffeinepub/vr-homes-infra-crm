import { useEffect } from 'react';
import { useCamera } from '../camera/useCamera';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Camera, X, AlertCircle, RotateCw } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const {
    isActive,
    isSupported,
    error,
    isLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    currentFacingMode,
    videoRef,
    canvasRef,
  } = useCamera({
    facingMode: 'user',
    width: 640,
    height: 480,
    quality: 0.95,
    format: 'image/jpeg',
  });

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (file) {
      onCapture(file);
      stopCamera();
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (isSupported === false) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Camera Not Supported</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Your browser does not support camera access.</AlertDescription>
          </Alert>
          <Button onClick={handleClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Capture Face Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '360px', aspectRatio: '4/3' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ minHeight: '360px' }}
            />
            {isActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img
                  src="/assets/generated/face-scan-overlay-transparent.dim_300x300.png"
                  alt="Face guide"
                  className="w-64 h-64 opacity-50"
                />
              </div>
            )}
            {!isActive && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-white">Starting camera...</p>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div className="flex gap-2">
            <Button onClick={handleCapture} disabled={!isActive || isLoading} className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              Capture Photo
            </Button>
            {isMobile && (
              <Button
                onClick={() => switchCamera()}
                disabled={!isActive || isLoading}
                variant="outline"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            )}
            <Button onClick={handleClose} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Position your face within the guide and click capture
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
