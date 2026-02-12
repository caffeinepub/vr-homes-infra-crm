import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Camera } from 'lucide-react';
import { useRegisterAgent } from '../hooks/useQueries';
import { toast } from 'sonner';
import CameraCapture from './CameraCapture';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const registerAgent = useRegisterAgent();

  const handleFaceCapture = (file: File) => {
    setFaceImage(file);
    setShowCamera(false);
    toast.success('Face image captured successfully');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!faceImage) {
      toast.error('Face capture is mandatory for registration');
      return;
    }

    try {
      // Convert image file to Uint8Array
      const arrayBuffer = await faceImage.arrayBuffer();
      const faceEmbeddings = new Uint8Array(arrayBuffer);

      await registerAgent.mutateAsync({
        name,
        mobile,
        email,
        faceEmbeddings,
      });

      toast.success('Registration submitted! Please wait for admin approval.');
      setName('');
      setMobile('');
      setEmail('');
      setFaceImage(null);
    } catch (error: any) {
      if (error.message?.includes('Mobile number already registered')) {
        toast.error('This mobile number is already registered');
      } else if (error.message?.includes('Face capture is mandatory')) {
        toast.error('Face capture is required for registration');
      } else {
        toast.error(error.message || 'Registration failed');
      }
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="reg-name">Full Name</Label>
          <Input
            id="reg-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
          />
        </div>
        <div>
          <Label htmlFor="reg-mobile">Mobile Number</Label>
          <Input
            id="reg-mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Enter your mobile number"
            required
          />
        </div>
        <div>
          <Label htmlFor="reg-email">Email Address</Label>
          <Input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        <div>
          <Label>Face Image (Required)</Label>
          <Button
            type="button"
            onClick={() => setShowCamera(true)}
            variant={faceImage ? 'outline' : 'default'}
            className="w-full mt-2"
          >
            <Camera className="w-4 h-4 mr-2" />
            {faceImage ? 'Recapture Face Image' : 'Capture Face Image'}
          </Button>
          {faceImage && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
              ✓ Face image captured
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={registerAgent.isPending || !faceImage}>
          {registerAgent.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Registering...
            </>
          ) : (
            'Register'
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
