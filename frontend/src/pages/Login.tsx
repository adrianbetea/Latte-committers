import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting login with:', { email, password: '***' });

      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        toast({
          title: "Authentication Successful",
          description: `Welcome back, ${data.data.admin.name}!`,
        });

        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        console.error('Login failed:', data);
        toast({
          title: "Authentication Failed",
          description: data.message || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error details:', error);
      toast({
        title: "Connection Error",
        description: `Unable to connect to the server: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
            Timișoara SideWalk Watcher
          </h1>
          <p className="text-muted-foreground mt-2">
            Municipality Officer Authentication
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
