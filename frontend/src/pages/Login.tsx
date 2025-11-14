import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [badgeNumber, setBadgeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!badgeNumber || !password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both badge number and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate authentication - replace with actual API call
    setTimeout(() => {
      // For demo purposes, accept any credentials
      // In production, validate against backend
      localStorage.setItem('auth', 'true');
      localStorage.setItem('officerBadge', badgeNumber);
      
      toast({
        title: "Authentication Successful",
        description: "Welcome back, Officer!",
      });
      
      navigate('/dashboard');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <MapPin className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Timișoara Smart Parking
          </h1>
          <p className="text-muted-foreground mt-2">
            Municipality Officer Authentication
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="badge" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Badge Number
              </Label>
              <Input
                id="badge"
                type="text"
                placeholder="Enter your badge number"
                value={badgeNumber}
                onChange={(e) => setBadgeNumber(e.target.value)}
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>For security issues, contact IT Support</p>
            <p className="mt-1">Municipality of Timișoara</p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Protected system - Authorized personnel only
        </p>
      </div>
    </div>
  );
};

export default Login;
