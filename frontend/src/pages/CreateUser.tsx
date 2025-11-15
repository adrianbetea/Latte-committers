import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, Mail, Lock, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

const CreateUser = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        // Check if current user is admin
        const checkAdmin = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/auth/check', {
                    method: 'GET',
                    credentials: 'include',
                });

                const data = await response.json();

                if (!data.success || !data.authenticated) {
                    navigate('/login');
                    return;
                }

                const user = data.data.admin;

                if (!user.isAdmin) {
                    toast({
                        title: "Access Denied",
                        description: "You don't have permission to access this page.",
                        variant: "destructive",
                    });
                    navigate('/dashboard');
                    return;
                }

                setCurrentUser(user);
            } catch (error) {
                console.error('Auth check error:', error);
                navigate('/login');
            }
        };

        checkAdmin();
    }, [navigate, toast]);

    const handleCreateUser = async (e: React.FormEvent) => {
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
            console.log('Creating user with:', { name, email, isAdmin });

            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ name, email, password, isAdmin }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast({
                    title: "User Created",
                    description: `User ${name} has been created successfully.`,
                });

                // Reset form
                setName('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setIsAdmin(false);
            } else {
                toast({
                    title: "Creation Failed",
                    description: data.message || "Unable to create user. Please try again.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('User creation error:', error);
            toast({
                title: "Connection Error",
                description: "Unable to connect to the server.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header newIncidentsCount={0} />

            <div className="container mx-auto px-6 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Create New User</h1>
                        <p className="text-muted-foreground mt-2">
                            Add a new user to the system
                        </p>
                    </div>

                    <Card className="p-8">
                        <form onSubmit={handleCreateUser} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Full Name
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Enter full name"
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
                                    placeholder="Enter email address"
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
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="h-11"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-primary" />
                                    <div>
                                        <Label htmlFor="isAdmin" className="font-semibold">
                                            Administrator
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Grant admin privileges to this user
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    id="isAdmin"
                                    checked={isAdmin}
                                    onCheckedChange={setIsAdmin}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => navigate('/dashboard')}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Creating...' : 'Create User'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CreateUser;
