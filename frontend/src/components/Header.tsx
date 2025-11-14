import { Bell, User, MapPin, BarChart3, LogOut } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  newIncidentsCount: number;
}

const Header = ({ newIncidentsCount }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const officerBadge = localStorage.getItem('officerBadge') || 'Unknown';

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('officerBadge');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/login');
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
                Timișoara Smart Parking Enforcement
              </h1>
              <p className="text-sm text-secondary-foreground/80">
                Real-Time Violation Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              className={`text-secondary-foreground hover:text-secondary-foreground hover:bg-secondary/80 ${
                location.pathname === '/analytics' ? 'bg-secondary/80' : ''
              }`}
              onClick={() => navigate('/analytics')}
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Analytics
            </Button>
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative text-secondary-foreground hover:text-secondary-foreground hover:bg-secondary/80">
                <Bell className="h-5 w-5" />
                {newIncidentsCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 bg-alert text-alert-foreground border-2 border-secondary"
                  >
                    {newIncidentsCount}
                  </Badge>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-3 border-l border-secondary-foreground/20 pl-6">
              <div className="text-right">
                <p className="text-sm font-medium">Badge #{officerBadge}</p>
                <p className="text-xs text-secondary-foreground/70">Municipality Police</p>
              </div>
              <Button variant="ghost" size="icon" className="text-secondary-foreground hover:text-secondary-foreground hover:bg-secondary/80">
                <User className="h-5 w-5" />
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
