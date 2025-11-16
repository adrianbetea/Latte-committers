import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import IncidentMap from '@/components/IncidentMap';
import { Incident } from '@/types/incident';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface DistrictStats {
  district: string;
  count: number;
  weeklyCount?: number;
  score?: string;
  color?: string;
}

const PublicMap = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [district, setDistrict] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtOverview, setDistrictOverview] = useState<DistrictStats[]>([]);
  const [stats, setStats] = useState({
    total_violations: 0,
    fines_issued: 0,
    revenue: 0,
    incidents_reviewed: 0,
  });
  const [loading, setLoading] = useState(true);

  const districts = [
    'all', 'Centru', 'Cetate', 'Elisabetin', 'Fabric', 'Iosefin',
    'Mehala', 'Plopi', 'Fratelia', 'Favorit', 'Lipovei', 'Soarelui',
    'Circumvalațiunii', 'Dorobanților', 'Dâmbovița', 'Steaua', 'Buziașului',
    'Ghiroda', 'Săcălaz', 'Tipografilor', 'Complex Studențesc', 'Calea Șagului',
    'Torontalului', 'Calea Aradului', 'Bogdăneștilor', 'Zona Industrială',
    'Sânmihaiu Român', 'Moșnița Nouă', 'Dumbrăvița'
  ];

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [district, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics data (includes district overview)
      const params = new URLSearchParams();
      if (district !== 'all') params.append('district', district);
      
      const analyticsResponse = await fetch(`http://localhost:3000/api/incidents/analytics?${params}`);
      const analyticsData = await analyticsResponse.json();

      if (analyticsData.success) {
        setStats(analyticsData.data.stats);
        setDistrictOverview(analyticsData.data.district_overview || []);
      }

      // Fetch resolved/fined incidents for map
      const incidentsResponse = await fetch('http://localhost:3000/api/incidents');
      const incidentsData = await incidentsResponse.json();

      if (incidentsData.success) {
        // Filter incidents by status
        let filteredByStatus = incidentsData.data;
        if (statusFilter !== 'all') {
          filteredByStatus = incidentsData.data.filter((inc: any) => inc.status === statusFilter);
        } else {
          // Show all three statuses when 'all' is selected
          filteredByStatus = incidentsData.data.filter((inc: any) => 
            inc.status === 'resolved' || inc.status === 'resolved_and_fined' || inc.status === 'pending'
          );
        }

        const resolvedIncidents = filteredByStatus.map((incident: any, index: number) => ({
          id: incident.id.toString(),
          plateNumber: `Vehicle ${index + 1}`, // Anonymous plate number
          location: {
            lat: parseFloat(incident.latitude),
            lng: parseFloat(incident.longitude),
            street: incident.address,
            district: incident.district || 'Unknown',
          },
          violationStart: new Date(incident.datetime),
          duration: Math.floor((Date.now() - new Date(incident.datetime).getTime()) / 60000),
          status: incident.status,
          images: {
            fullCar: '',
            licensePlate: '',
          },
        }));

        // Filter by district if selected
        const filteredIncidents = district === 'all' 
          ? resolvedIncidents 
          : resolvedIncidents.filter((inc: Incident) => inc.location.district === district);

        setIncidents(filteredIncidents);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const getRiskColor = (score?: string) => {
    switch (score) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f97316';
      case 'Medium': return '#eab308';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Timișoara SideWalk Watcher</h1>
              <p className="text-sm text-muted-foreground">Public transparency dashboard</p>
            </div>
            <Badge variant="outline" className="text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              Public View
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Incidents</div>
            <div className="text-3xl font-bold">{stats.total_violations}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Fines Issued</div>
            <div className="text-3xl font-bold">{stats.fines_issued}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Cases Reviewed</div>
            <div className="text-3xl font-bold">{stats.incidents_reviewed}</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Incidents Map</h2>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="resolved_and_fined">Resolved and Fined</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={district} onValueChange={setDistrict}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Districts" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d === 'all' ? 'All Districts' : d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="h-[600px] rounded-lg overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <p className="text-muted-foreground">Loading map...</p>
                  </div>
                ) : (
                  <IncidentMap
                    incidents={incidents}
                    onIncidentSelect={() => {}} // No selection for public view
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <MapPin className="h-3 w-3 inline mr-1" />
                Showing {incidents.length} resolved incident{incidents.length !== 1 ? 's' : ''}
                {district !== 'all' ? ` in ${district}` : ' across all districts'}
              </p>
            </Card>
          </div>

          {/* District Overview */}
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="text-xl font-bold mb-4">District Overview</h2>
              
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading...</p>
              ) : district === 'all' && districtOverview.length > 0 ? (
                <div className="space-y-6">
                  {/* Top 3 Districts - Worst performers */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-red-500" />
                      <h3 className="font-semibold text-sm">Most Incidents</h3>
                    </div>
                    <div className="space-y-2">
                      {districtOverview.slice(0, 3).map((item, idx) => (
                        <div
                          key={item.district}
                          className="p-3 rounded-lg border"
                          style={{ borderColor: item.color || '#ef4444' }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">#{idx + 1} {item.district}</span>
                            <Badge
                              variant="outline"
                              style={{
                                backgroundColor: (item.color || '#ef4444') + '20',
                                borderColor: item.color || '#ef4444',
                                color: item.color || '#ef4444',
                              }}
                            >
                              {item.count} incidents
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Best 3 Districts */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="h-4 w-4 text-green-500" />
                      <h3 className="font-semibold text-sm">Fewest Incidents</h3>
                    </div>
                    <div className="space-y-2">
                      {districtOverview.slice(-3).reverse().map((item, idx) => (
                        <div
                          key={item.district}
                          className="p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{item.district}</span>
                            <Badge variant="outline" className="bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300">
                              {item.count} incidents
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : district !== 'all' && districtOverview.length > 0 ? (
                // Single district view
                <div className="text-center space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{districtOverview[0].district}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-3xl font-bold">{districtOverview[0].weeklyCount || 0}</p>
                        <p className="text-xs text-muted-foreground">Last Week</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold">{districtOverview[0].count}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </div>
                  <div
                    className="inline-block px-6 py-3 rounded-lg"
                    style={{ backgroundColor: (districtOverview[0].color || '#6b7280') + '20' }}
                  >
                    <p className="text-lg font-bold" style={{ color: districtOverview[0].color || '#6b7280' }}>
                      Risk Level: {districtOverview[0].score || 'Unknown'}
                    </p>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p className="font-semibold mb-2">Risk Level Scale (based on weekly average):</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#10b98120', color: '#10b981' }}>
                        Low (&lt;2/week)
                      </span>
                      <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#eab30820', color: '#eab308' }}>
                        Medium (2-4/week)
                      </span>
                      <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#f9731620', color: '#f97316' }}>
                        High (5-9/week)
                      </span>
                      <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>
                        Critical (10+/week)
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </Card>

            <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold mb-2 text-sm">ℹ️ About This Dashboard</h3>
              <p className="text-xs text-muted-foreground">
                This public dashboard shows resolved parking incidents across Timișoara. 
                Vehicle identities are anonymized for privacy. Data is updated in real-time 
                to promote transparency and awareness of parking enforcement.
              </p>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p className="mt-1">Data updated every 30 seconds</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicMap;
