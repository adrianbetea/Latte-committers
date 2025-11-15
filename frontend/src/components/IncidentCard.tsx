import { Clock, MapPin } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Incident } from "@/types/incident";

interface IncidentCardProps {
  incident: Incident;
  onClick: () => void;
  isSelected?: boolean;
}

const IncidentCard = ({ incident, onClick, isSelected }: IncidentCardProps) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    // If more than 72 hours (3 days), show date instead
    if (hours >= 72) {
      const days = Math.floor(hours / 24);
      return `${days} days`;
    }

    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-500 text-white hover:bg-orange-600';
      case 'resolved':
        return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'resolved_and_fined':
        return 'bg-green-700 text-white hover:bg-green-800';
      case 'rejected':
        return 'bg-gray-500 text-white hover:bg-gray-600';
      default:
        return 'bg-alert text-alert-foreground';
    }
  };

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary shadow-md' : ''
        }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-foreground mb-1">
            {incident.plateNumber}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <MapPin className="h-4 w-4" />
            <span>{incident.location.street}</span>
          </div>
        </div>
        <Badge variant="destructive" className={getStatusBadgeClass(incident.status)}>
          {incident.status}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold text-alert">
          {formatDuration(incident.duration)}
        </span>
        <span className="text-muted-foreground">violation</span>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Started: {incident.violationStart.toLocaleTimeString('ro-RO', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </Card>
  );
};

export default IncidentCard;
