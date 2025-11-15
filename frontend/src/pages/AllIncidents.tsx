import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Incident } from '@/types/incident';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, Eye } from 'lucide-react';
import { toast } from 'sonner';

const AllIncidents = () => {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/incidents');
                const data = await response.json();

                if (data.success) {
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
                    setFilteredIncidents(transformedIncidents);
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

    useEffect(() => {
        let filtered = [...incidents];

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(incident => incident.status === statusFilter);
        }

        // Filter by date range
        if (startDate) {
            const start = new Date(startDate);
            filtered = filtered.filter(incident => new Date(incident.violationStart) >= start);
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(incident => new Date(incident.violationStart) <= end);
        }

        setFilteredIncidents(filtered);
    }, [statusFilter, startDate, endDate, incidents]);

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-orange-500 text-white hover:bg-orange-600';
            case 'resolved':
                return 'bg-green-700 text-white hover:bg-green-800';
            case 'resolved_and_fined':
                return 'bg-green-700 text-white hover:bg-green-800';
            case 'rejected':
                return 'bg-gray-500 text-white hover:bg-gray-600';
            default:
                return 'default';
        }
    }; const formatStatusDisplay = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Pending';
            case 'resolved':
                return 'Resolved';
            case 'resolved_and_fined':
                return 'Resolved & Fined';
            case 'rejected':
                return 'Rejected';
            default:
                return status;
        }
    };

    const clearFilters = () => {
        setStatusFilter('all');
        setStartDate('');
        setEndDate('');
    };

    const newIncidents = incidents.filter(i => i.status === 'pending');

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header newIncidentsCount={newIncidents.length} />

            <main className="flex-1 container mx-auto px-6 py-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">All Incidents</h1>
                    <p className="text-muted-foreground">
                        View and filter all parking violation incidents
                    </p>
                </div>

                {/* Filters */}
                <Card className="p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">Filters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="status-filter">Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger id="status-filter">
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="resolved_and_fined">Resolved & Fined</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="start-date">Start Date</Label>
                            <div className="relative">
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="end-date">End Date</Label>
                            <div className="relative">
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <Button variant="outline" onClick={clearFilters} className="w-full">
                                Clear Filters
                            </Button>
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-muted-foreground">
                        Showing {filteredIncidents.length} of {incidents.length} incidents
                    </div>
                </Card>

                {/* Incidents Table */}
                <Card>
                    {loading ? (
                        <div className="p-8 text-center">
                            <p className="text-muted-foreground">Loading incidents...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Plate Number</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredIncidents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No incidents found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredIncidents.map((incident) => (
                                        <TableRow key={incident.id}>
                                            <TableCell className="font-medium">#{incident.id}</TableCell>
                                            <TableCell>{incident.plateNumber}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{incident.location.street}</p>
                                                    <p className="text-sm text-muted-foreground">{incident.location.district}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {incident.violationStart.toLocaleString('ro-RO', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusBadgeVariant(incident.status)}>
                                                    {formatStatusDisplay(incident.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/incident/${incident.id}`)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            </main>
        </div>
    );
};

export default AllIncidents;
