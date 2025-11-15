import { Bell, User, MapPin, BarChart3, LogOut, UserPlus } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface HeaderProps {
  newIncidentsCount: number;
}

const Header = ({ newIncidentsCount }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/check', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success && data.authenticated && data.data.admin.isAdmin) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    checkAdmin();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
        });
        window.location.href = '/login';
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "An error occurred during logout.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-secondary text-secondary-foreground shadow-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <MapPin className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Timișoara SideWalk Watch
              </h1>
              <p className="text-sm text-secondary-foreground/80">
                Your Sidewalk Guardian Protecting Pedestrian Paths
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              className={`text-secondary-foreground hover:text-secondary-foreground hover:bg-secondary/80 ${location.pathname === '/incidents' ? 'bg-secondary/80' : ''
                }`}
              onClick={() => navigate('/incidents')}
            >
              <MapPin className="h-5" />
              All Incidents
            </Button>
            <Button
              variant="ghost"
              className={`text-secondary-foreground hover:text-secondary-foreground hover:bg-secondary/80 ${location.pathname === '/analytics' ? 'bg-secondary/80' : ''
                }`}
              onClick={() => navigate('/analytics')}
            >
              <BarChart3 className="h-5" />
              Analytics
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                className={`text-secondary-foreground hover:text-secondary-foreground hover:bg-secondary/80 ${location.pathname === '/create-user' ? 'bg-secondary/80' : ''
                  }`}
                onClick={() => navigate('/create-user')}
              >
                <UserPlus className="h-5" />
                Create User
              </Button>
            )}

            <div className="flex items-center gap-3 border-l border-secondary-foreground/20 pl-6">
              <Button
                variant="ghost"
                className="text-secondary-foreground hover:text-secondary-foreground hover:bg-secondary/80"
              >
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">Admin:</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-secondary-foreground hover:text-secondary-foreground hover:bg-secondary/80"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
