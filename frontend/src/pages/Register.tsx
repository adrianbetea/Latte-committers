import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, ShieldCheck, User, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            toast({
                title: "Missing Information",
                description: "Please fill in all fields.",
                variant: "destructive",
            });
            return;
        }

        if (password !== confirmPassword) {
            toast({
                title: "Password Mismatch",
                description: "Passwords do not match.",
                variant: "destructive",
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: "Weak Password",
                description: "Password must be at least 6 characters long.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            console.log('Attempting registration with:', { name, email, passwordLength: password.length });

            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ name, email, password }),
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok && data.success) {
                toast({
                    title: "Registration Successful",
                    description: "Your account has been created. Please login.",
                });

                // Redirect to login after 1 second
                setTimeout(() => {
                    navigate('/login');
                }, 1000);
            } else {
                console.error('Registration failed:', data);
                toast({
                    title: "Registration Failed",
                    description: data.message || "Unable to create account. Please try again.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Registration error details:', error);
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
                        Create Your Officer Account
                    </p>
                </div>

                {/* Register Card */}
                <Card className="p-8 shadow-lg">
                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Full Name
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isLoading}
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
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
                            <Label htmlFor="password" className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Create a password (min 6 characters)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Confirm Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                                className="h-11"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-base"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t text-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary hover:underline font-medium">
                                Sign In
                            </Link>
                        </p>
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

export default Register;
