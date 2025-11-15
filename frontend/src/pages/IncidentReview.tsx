import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Incident } from '@/types/incident';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, MapPin, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Fine {
  id: number;
  name: string;
  value: number;
}

const IncidentReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [selectedFine, setSelectedFine] = useState<string>('');
  const [fines, setFines] = useState<Fine[]>([]);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [cameraRefresh, setCameraRefresh] = useState(0);
  const cameraImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch fines
        const finesResponse = await fetch('http://localhost:3000/api/fines');
        const finesData = await finesResponse.json();
        if (finesData.success) {
          setFines(finesData.data);
        }

        // Fetch specific incident
        const incidentResponse = await fetch(`http://localhost:3000/api/incidents/${id}`);
        const incidentData = await incidentResponse.json();

        if (incidentData.success) {
          const rawIncident = incidentData.data;
          const transformedIncident: Incident = {
            id: rawIncident.id.toString(),
            plateNumber: rawIncident.car_number || 'Unknown',
            location: {
              lat: parseFloat(rawIncident.latitude),
              lng: parseFloat(rawIncident.longitude),
              street: rawIncident.address,
              district: rawIncident.address.split(',')[0] || 'Unknown',
            },
            violationStart: new Date(rawIncident.datetime),
            duration: Math.floor((Date.now() - new Date(rawIncident.datetime).getTime()) / 60000),
            status: rawIncident.status,
            images: {
              fullCar: rawIncident.photos?.[0]?.photo_path || 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
              licensePlate: rawIncident.photos?.[1]?.photo_path || 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400',
            },
            notes: rawIncident.ai_description,
          };
          setIncident(transformedIncident);
        }

        // Fetch all incidents for count
        const allIncidentsResponse = await fetch('http://localhost:3000/api/incidents/status/pending');
        const allIncidentsData = await allIncidentsResponse.json();
        if (allIncidentsData.success) {
          setAllIncidents(allIncidentsData.data.map((inc: any) => ({
            id: inc.id.toString(),
            status: inc.status
          })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load incident data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Auto-refresh camera feed every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      setCameraRefresh(prev => prev + 1);
      if (cameraImageRef.current) {
        // Force refresh by appending timestamp
        const img = cameraImageRef.current;
        const timestamp = new Date().getTime();
        img.src = `http://10.47.103.46:8080/shot.jpg?t=${timestamp}`;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading incident data...</p>
        </Card>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Incident Not Found</h2>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const newIncidents = allIncidents.filter((i: any) => i.status === 'pending');

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    // If more than 72 hours (3 days), show date instead
    if (hours >= 72) {
      const days = Math.floor(hours / 24);
      return `${days} days`;
    }

    return hours > 0 ? `${hours} hours ${mins} minutes` : `${mins} minutes`;
  };

  const handleConfirmViolation = async () => {
    if (!notes.trim()) {
      toast.error('Please provide admin notes');
      return;
    }

    try {
      const updateData: any = {
        status: 'resolved_and_fined',
        car_number: incident.plateNumber,
        admin_notes: notes,
      };

      // Add fine_id if a fine is selected
      if (selectedFine && selectedFine !== 'none') {
        updateData.fine_id = parseInt(selectedFine);
      }

      const response = await fetch(`http://localhost:3000/api/incidents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        const selectedFineData = selectedFine && selectedFine !== 'none'
          ? fines.find(f => f.id.toString() === selectedFine)
          : null;
        const fineMessage = selectedFineData
          ? `Fine: ${selectedFineData.name} (${selectedFineData.value} RON)`
          : 'No fine issued';

        toast.success('Incident confirmed successfully', {
          description: `${incident.plateNumber} marked as resolved and fined. ${fineMessage}`,
        });
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        toast.error('Failed to update incident');
      }
    } catch (error) {
      console.error('Error confirming incident:', error);
      toast.error('Failed to confirm incident');
    }
  };

  const handleDismissIncident = async () => {
    if (!notes.trim()) {
      toast.error('Please provide a reason for dismissal');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/incidents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'resolved',
          car_number: incident.plateNumber,
          admin_notes: notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.info('Incident dismissed', {
          description: `${incident.plateNumber} marked as resolved (false positive).`,
        });
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        toast.error('Failed to update incident');
      }
    } catch (error) {
      console.error('Error dismissing incident:', error);
      toast.error('Failed to dismiss incident');
    }
  }; return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header newIncidentsCount={newIncidents.length} />

      <main className="flex-1 container mx-auto px-6 py-6">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Evidence */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {incident.plateNumber}
                  </h1>
                  <Badge variant="destructive" className="bg-alert text-alert-foreground">
                    Pending Review
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                  <div>
                    <p className="text-xs">Start Time</p>
                    <p className="font-semibold text-foreground">
                      {incident.violationStart.toLocaleString('ro-RO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <div>
                    <p className="text-xs">Duration</p>
                    <p className="font-semibold text-alert text-lg">
                      {formatDuration(incident.duration)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 mb-6 p-3 bg-muted rounded-lg">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">{incident.location.street}</p>
                  <p className="text-sm text-muted-foreground">{incident.location.district} District</p>
                </div>
              </div>
            </Card>

            {/* Vehicle Image */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Live Camera Feed</h3>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                <img
                  ref={cameraImageRef}
                  src={`http://10.133.72.247:8080/shot.jpg?t=${cameraRefresh}`}
                  alt="Live Camera Feed"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-white text-sm">🔴 Live Stream</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Live feed from IP Camera (updating every 1s)</p>
            </Card>

            {/* Vehicle Image */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Vehicle Evidence</h3>
              <img
                src={incident.images.fullCar}
                alt="Vehicle"
                className="w-full rounded-lg mb-4"
              />
            </Card>

            {/* License Plate Close-up */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">License Plate</h3>
              <img
                src={incident.images.licensePlate}
                alt="License Plate"
                className="w-full max-w-md mx-auto rounded-lg"
              />
            </Card>
          </div>

          {/* Right Column - Action Panel */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <Card className="p-6 sticky top-6">
              {incident.status === 'pending' ? (
                <>
                  <h2 className="text-xl font-bold mb-6">Review Actions</h2>

                  <div className="space-y-4 mb-6">
                    <div>
                      <Label htmlFor="fine-select" className="text-base font-semibold mb-2">
                        Select Fine (Optional)
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Choose the appropriate fine for this incident, if applicable
                      </p>
                      <Select value={selectedFine} onValueChange={setSelectedFine}>
                        <SelectTrigger id="fine-select">
                          <SelectValue placeholder="No fine selected" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No fine</SelectItem>
                          {fines.map((fine) => (
                            <SelectItem key={fine.id} value={fine.id.toString()}>
                              {fine.name} - {fine.value} RON
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-base font-semibold mb-2">
                        Admin Notes <span className="text-alert">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Mandatory notes for incident review and record keeping
                      </p>
                      <Textarea
                        id="notes"
                        placeholder="Enter your observations, verification details, or reason for dismissal..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-32"
                      />
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2 text-sm">Location Reference</h4>
                      <div className="aspect-video bg-background rounded overflow-hidden">
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${incident.location.lng - 0.002},${incident.location.lat - 0.002},${incident.location.lng + 0.002},${incident.location.lat + 0.002}&layer=mapnik&marker=${incident.location.lat},${incident.location.lng}`}
                          allowFullScreen
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="w-full bg-success hover:bg-success/90 text-success-foreground"
                      size="lg"
                      onClick={handleConfirmViolation}
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Confirm Incident & Issue Fine
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full border-alert text-alert hover:bg-alert hover:text-alert-foreground"
                      size="lg"
                      onClick={handleDismissIncident}
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Dismiss Incident / False Positive
                    </Button>
                  </div>

                  {selectedFine && selectedFine !== 'none' && (
                    <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                      <p className="font-semibold mb-1">Selected Fine Information:</p>
                      {(() => {
                        const fine = fines.find(f => f.id.toString() === selectedFine);
                        return fine ? (
                          <>
                            <p>{fine.name}: {fine.value} RON</p>
                            <p className="text-xs mt-2">Payment due within 15 days</p>
                          </>
                        ) : null;
                      })()}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-6">Incident Resolution</h2>

                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <Label className="text-sm font-semibold mb-2 block">Status</Label>
                      <Badge className={
                        incident.status === 'resolved_and_fined'
                          ? 'bg-green-700 text-white'
                          : incident.status === 'resolved'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-500 text-white'
                      }>
                        {incident.status === 'resolved_and_fined'
                          ? 'Resolved & Fined'
                          : incident.status === 'resolved'
                            ? 'Resolved'
                            : incident.status === 'rejected'
                              ? 'Rejected'
                              : incident.status}
                      </Badge>
                    </div>

                    {incident.status === 'resolved_and_fined' && (
                      <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                        <Label className="text-sm font-semibold mb-2 block text-green-800 dark:text-green-200">
                          Fine Issued
                        </Label>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          This incident has been resolved with a fine.
                        </p>
                      </div>
                    )}

                    {incident.status === 'resolved' && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <Label className="text-sm font-semibold mb-2 block text-blue-800 dark:text-blue-200">
                          Incident Dismissed
                        </Label>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          This incident has been resolved without issuing a fine.
                        </p>
                      </div>
                    )}

                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2 text-sm">Location Reference</h4>
                      <div className="aspect-video bg-background rounded overflow-hidden">
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${incident.location.lng - 0.002},${incident.location.lat - 0.002},${incident.location.lng + 0.002},${incident.location.lat + 0.002}&layer=mapnik&marker=${incident.location.lat},${incident.location.lng}`}
                          allowFullScreen
                        />
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/dashboard')}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IncidentReview;
