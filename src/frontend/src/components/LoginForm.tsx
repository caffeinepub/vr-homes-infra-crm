import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Camera } from 'lucide-react';
import { useLoginAgent } from '../hooks/useQueries';
import { toast } from 'sonner';
import CameraCapture from './CameraCapture';

export default function LoginForm() {
  const [mobile, setMobile] = useState('');
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const loginAgent = useLoginAgent();

  const handleFaceCapture = (file: File) => {
    setFaceImage(file);
    setShowCamera(false);
    toast.success('Face image captured successfully');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!faceImage) {
      toast.error('Face verification is mandatory for login');
      return;
    }

    try {
      // Convert image file to Uint8Array
      const arrayBuffer = await faceImage.arrayBuffer();
      const faceEmbeddings = new Uint8Array(arrayBuffer);

      await loginAgent.mutateAsync({ faceEmbeddings });

      toast.success('Login successful!');
      setMobile('');
      setFaceImage(null);
    } catch (error: any) {
      const errorMsg = error.message || '';
      
      if (errorMsg.includes('pending approval') || errorMsg.includes('pending')) {
        toast.error('Your registration is pending admin approval');
      } else if (errorMsg.includes('rejected')) {
        toast.error('Your registration has been rejected');
      } else if (errorMsg.includes('Face verification failed')) {
        toast.error('Face verification failed. Please try again.');
      } else if (errorMsg.includes('not approved')) {
        toast.error('Your account is not approved. Please contact admin.');
      } else if (errorMsg.includes('Face verification is mandatory') || errorMsg.includes('mandatory')) {
        toast.error('Face verification is required for login');
      } else {
        toast.error(errorMsg || 'Login failed');
      }
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="login-mobile">Mobile Number</Label>
          <Input
            id="login-mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Enter your mobile number"
            required
          />
        </div>
        <div>
          <Label>Face Verification (Required) *</Label>
          <Button
            type="button"
            onClick={() => setShowCamera(true)}
            variant={faceImage ? 'outline' : 'default'}
            className="w-full mt-2"
          >
            <Camera className="w-4 h-4 mr-2" />
            {faceImage ? 'Recapture Face Image' : 'Capture Face for Verification'}
          </Button>
          {faceImage && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              ✓ Face image captured
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loginAgent.isPending || !faceImage}>
          {loginAgent.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </Button>
      </form>

      {showCamera && (
        <CameraCapture
          onCapture={handleFaceCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
}
