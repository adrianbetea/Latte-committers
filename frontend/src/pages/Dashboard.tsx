import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import IncidentMap from '@/components/IncidentMap';
import IncidentCard from '@/components/IncidentCard';
import { Incident } from '@/types/incident';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | undefined>();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/incidents');
        const data = await response.json();

        if (data.success) {
          // Transform backend data to frontend format
          const transformedIncidents: Incident[] = data.data.map((incident: any) => ({
            id: incident.id.toString(),
            plateNumber: incident.car_number || 'Unknown',
            location: {
              lat: parseFloat(incident.latitude),
              lng: parseFloat(incident.longitude),
              street: incident.address,
              district: incident.address.split(',')[0] || 'Unknown',
            },
            violationStart: new Date(incident.datetime),
            duration: Math.floor((Date.now() - new Date(incident.datetime).getTime()) / 60000),
            status: incident.status,
            images: {
              fullCar: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
              licensePlate: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400',
            },
            notes: incident.ai_description,
          }));
          setIncidents(transformedIncidents);
        }
      } catch (error) {
        console.error('Error fetching incidents:', error);
        toast.error('Failed to load incidents');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  const newIncidents = incidents.filter(i => i.status === 'pending');
  const urgentIncidents = [...newIncidents]
    .sort((a, b) => a.duration - b.duration)
    .slice(0, 8);

  const handleIncidentClick = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
  };

  const handleIncidentReview = (incidentId: string) => {
    navigate(`/incident/${incidentId}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header newIncidentsCount={newIncidents.length} />

      <main className="flex-1 container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          {/* Sidebar - Urgent Incidents List */}
          <div className="col-span-12 lg:col-span-3 space-y-4 overflow-y-auto">
            <Card className="p-4 bg-alert/10 border-alert/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-alert" />
                <h2 className="font-bold text-lg">Urgent Incidents</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {newIncidents.length} active violations requiring review
              </p>
            </Card>

            <div className="space-y-3">
              {urgentIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onClick={() => handleIncidentClick(incident.id)}
                  isSelected={selectedIncidentId === incident.id}
                />
              ))}
            </div>

            {urgentIncidents.length === 0 && (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">No active incidents</p>
              </Card>
            )}
          </div>

          {/* Main Map Area */}
          <div className="col-span-12 lg:col-span-9">
            <Card className="h-full p-0 overflow-hidden">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Loading incidents...</p>
                </div>
              ) : (
                <IncidentMap
                  incidents={newIncidents}
                  selectedIncidentId={selectedIncidentId}
                  onIncidentSelect={handleIncidentReview}
                />
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
