import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoTimisoara from '@/components/logo.jpeg';
import loginBackground from '@/components/login-background.jpeg';

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
    <div className="min-h-screen relative flex items-center justify-center p-6">
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-sm"
        style={{ backgroundImage: `url(${loginBackground})` }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Login Card */}
        <Card className="p-8 shadow-2xl bg-white/30 backdrop-blur-xl border border-white/50">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <img 
                src={logoTimisoara} 
                alt="Timișoara Logo" 
                className="h-24 w-24 rounded-full shadow-2xl"
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Timișoara SideWalk Watcher
            </h1>
            <p className="text-gray-700 mt-2 font-medium">
              Municipality Officer Authentication
            </p>
          </div>

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
              className="w-full h-11 text-base bg-gray-900 hover:bg-gray-800 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
          
          {/* Footer */}
          <p className="text-center text-sm text-gray-800 font-medium mt-6">
            Protected system - Authorized personnel only
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Login;
