import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { mockIncidents } from '@/types/incident';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const IncidentReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  
  const incident = mockIncidents.find(i => i.id === id);
  const newIncidents = mockIncidents.filter(i => i.status === 'new');

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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours} hours ${mins} minutes` : `${mins} minutes`;
  };

  const handleConfirmViolation = () => {
    toast.success('Fine issued successfully', {
      description: `Violation for ${incident.plateNumber} confirmed and fine issued.`,
    });
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  const handleDismissIncident = () => {
    if (!notes.trim()) {
      toast.error('Please provide a reason for dismissal');
      return;
    }
    toast.info('Incident dismissed', {
      description: `${incident.plateNumber} marked as false positive.`,
    });
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  return (
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
                    Active Violation
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
              <h2 className="text-xl font-bold mb-6">Review Actions</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="notes" className="text-base font-semibold mb-2">
                    Officer Notes <span className="text-alert">*</span>
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
                  Confirm Violation & Issue Fine
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

              <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                <p className="font-semibold mb-1">Fine Information:</p>
                <p>Standard parking violation: 200 RON</p>
                <p className="text-xs mt-2">Payment due within 15 days</p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IncidentReview;
