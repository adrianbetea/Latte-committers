import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, Mail, Lock, Shield, Edit, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface UserData {
    id: number;
    name: string;
    email: string;
    isAdmin: boolean;
}

const ManageUsers = () => {
    const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    // Create user form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    // Edit dialog states
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editIsAdmin, setEditIsAdmin] = useState(false);

    // Delete dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

    useEffect(() => {
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

    useEffect(() => {
        if (currentUser && activeTab === 'list') {
            fetchUsers();
        }
    }, [currentUser, activeTab]);

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/admin/users', {
                method: 'GET',
                credentials: 'include',
            });

            const data = await response.json();

            if (data.success) {
                setUsers(data.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                title: "Error",
                description: "Failed to fetch users.",
                variant: "destructive",
            });
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

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

                setName('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setIsAdmin(false);

                setActiveTab('list');
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

    const openEditDialog = (user: UserData) => {
        setEditingUser(user);
        setEditName(user.name);
        setEditEmail(user.email);
        setEditIsAdmin(user.isAdmin);
        setEditDialogOpen(true);
    };

    const handleEditUser = async () => {
        if (!editingUser) return;

        setIsLoading(true);

        try {
            const response = await fetch(`http://localhost:3000/api/admin/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: editName,
                    email: editEmail,
                    isAdmin: editIsAdmin,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast({
                    title: "User Updated",
                    description: "User information has been updated successfully.",
                });

                setEditDialogOpen(false);
                fetchUsers();
            } else {
                toast({
                    title: "Update Failed",
                    description: data.message || "Unable to update user.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('User update error:', error);
            toast({
                title: "Connection Error",
                description: "Unable to connect to the server.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const openDeleteDialog = (user: UserData) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        setIsLoading(true);

        try {
            const response = await fetch(`http://localhost:3000/api/admin/users/${userToDelete.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast({
                    title: "User Deleted",
                    description: `User ${userToDelete.name} has been deleted successfully.`,
                });

                setDeleteDialogOpen(false);
                fetchUsers();
            } else {
                toast({
                    title: "Delete Failed",
                    description: data.message || "Unable to delete user.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('User deletion error:', error);
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
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold">Manage Users</h1>
                            <p className="text-muted-foreground mt-2">
                                Create, edit, or delete user accounts
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant={activeTab === 'list' ? 'default' : 'outline'}
                                onClick={() => setActiveTab('list')}
                            >
                                <User className="h-4 w-4 mr-2" />
                                User List
                            </Button>
                            <Button
                                variant={activeTab === 'create' ? 'default' : 'outline'}
                                onClick={() => setActiveTab('create')}
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create User
                            </Button>
                        </div>
                    </div>

                    {activeTab === 'list' ? (
                        <Card className="p-6">
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold">All Users</h2>
                                <p className="text-sm text-muted-foreground">
                                    Edit or delete existing users
                                </p>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                    {user.isAdmin ? 'Admin' : 'User'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditDialog(user)}
                                                        disabled={user.id === currentUser.id}
                                                        title="Edit user"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openDeleteDialog(user)}
                                                        disabled={user.id === currentUser.id}
                                                        title="Delete user"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {users.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No users found.
                                </div>
                            )}
                        </Card>
                    ) : (
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
                                        type="submit"
                                        className="flex-1"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Creating...' : 'Create User'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}
                </div>
            </div>

            {/* Edit User Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user information and permissions
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Full Name</Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email Address</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-primary" />
                                <div>
                                    <Label htmlFor="edit-isAdmin" className="font-semibold">
                                        Administrator
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Grant admin privileges
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="edit-isAdmin"
                                checked={editIsAdmin}
                                onCheckedChange={setEditIsAdmin}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setEditDialogOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleEditUser}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Updating...' : 'Update User'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the user <strong>{userToDelete?.name}</strong> and all their data.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading ? 'Deleting...' : 'Delete User'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ManageUsers;
