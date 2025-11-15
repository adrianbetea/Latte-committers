import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, User, Calendar, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';

interface ResolvedIncident {
  id: number;
  address: string;
  car_number: string | null;
  status: string;
  resolved_at: string;
  admin_notes: string | null;
  fine_id: number | null;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  fine_name: string | null;
  fine_value: number | null;
}

const UsersHistory = () => {
  const navigate = useNavigate();
  const [searchName, setSearchName] = useState('');
  const [incidents, setIncidents] = useState<ResolvedIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/check', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();

        if (!data.success || !data.authenticated || !data.data.admin.isAdmin) {
          toast.error('Access denied. Admin privileges required.');
          navigate('/dashboard');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/dashboard');
      }
    };

    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const url = searchName.trim()
          ? `http://localhost:3000/api/admin/resolved-incidents?userName=${encodeURIComponent(searchName)}`
          : 'http://localhost:3000/api/admin/resolved-incidents';

        const response = await fetch(url, {
          credentials: 'include',
        });

        const data = await response.json();

        if (data.success) {
          setIncidents(data.data);
        } else {
          toast.error('Failed to load incidents');
        }
      } catch (error) {
        console.error('Error fetching incidents:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchIncidents();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchName, isAdmin]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved_and_fined':
        return <Badge className="bg-green-700 text-white">Resolved & Fined</Badge>;
      case 'resolved':
        return <Badge className="bg-blue-500 text-white">Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header newIncidentsCount={0} />

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Users History</h1>
          <p className="text-muted-foreground">
            View resolved incidents and the users who handled them
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4" />
                Search by User Name
              </Label>
              <Input
                id="search"
                type="text"
                placeholder="Enter user name to filter..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to show all resolved incidents
              </p>
            </div>
          </div>
        </Card>

        <Card>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading incidents...</p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchName.trim()
                  ? `No incidents found for "${searchName}"`
                  : 'No resolved incidents found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Incident ID</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Car Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resolved By</TableHead>
                    <TableHead>Resolved At</TableHead>
                    <TableHead>Fine</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.map((incident) => (
                    <TableRow
                      key={incident.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/incident/${incident.id}`)}
                    >
                      <TableCell className="font-medium">#{incident.id}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {incident.address}
                      </TableCell>
                      <TableCell>
                        {incident.car_number || (
                          <span className="text-muted-foreground italic">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(incident.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {incident.user_name || (
                                <span className="text-muted-foreground italic">Unknown</span>
                              )}
                            </p>
                            {incident.user_email && (
                              <p className="text-xs text-muted-foreground">
                                {incident.user_email}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(incident.resolved_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {incident.fine_name ? (
                          <div>
                            <p className="font-medium">{incident.fine_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {incident.fine_value} RON
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">No fine</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {!loading && incidents.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing {incidents.length} resolved incident{incidents.length !== 1 ? 's' : ''}
            {searchName.trim() && ` for "${searchName}"`}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersHistory;
