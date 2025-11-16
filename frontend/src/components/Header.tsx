import { Bell, User, MapPin, BarChart3, LogOut, UserPlus, Users, Settings } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import logoTimisoara from "./logo.jpeg";

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
    <header className="bg-gradient-to-r from-[#fec10e] to-[#ffb700] shadow-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <img 
              src={logoTimisoara} 
              alt="Timișoara Logo" 
              className="h-12 w-12 rounded-full"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                Timișoara SideWalk Watch
              </h1>
              <p className="text-sm text-gray-800">
                Your Sidewalk Guardian Protecting Pedestrian Paths
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              className={`text-gray-900 hover:text-gray-900 hover:bg-white/20 ${location.pathname === '/incidents' ? 'bg-white/30' : ''
                }`}
              onClick={() => navigate('/incidents')}
            >
              <MapPin className="h-5" />
              All Incidents
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                className={`text-gray-900 hover:text-gray-900 hover:bg-white/20 ${location.pathname === '/users-history' ? 'bg-white/30' : ''
                  }`}
                onClick={() => navigate('/users-history')}
              >
                <Users className="h-5" />
                Users History
              </Button>
            )}
            <Button
              variant="ghost"
              className={`text-gray-900 hover:text-gray-900 hover:bg-white/20 ${location.pathname === '/analytics' ? 'bg-white/30' : ''
                }`}
              onClick={() => navigate('/analytics')}
            >
              <BarChart3 className="h-5" />
              Analytics
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                className={`text-gray-900 hover:text-gray-900 hover:bg-white/20 ${location.pathname === '/manage-users' ? 'bg-white/30' : ''
                  }`}
                onClick={() => navigate('/manage-users')}
              >
                <Settings className="h-5" />
                Manage Users
              </Button>
            )}

            <div className="flex items-center gap-3 border-l border-gray-900/20 pl-6">


              <Button
                variant="ghost"
                size="icon"
                className="text-gray-900 hover:text-gray-900 hover:bg-white/20"
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
