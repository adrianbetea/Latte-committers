import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { mockCameras } from '@/types/camera';
import { mockIncidents } from '@/types/incident';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Video, MapPin, Clock, Activity } from 'lucide-react';

const CameraView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const camera = mockCameras.find(c => c.id === id);
  const newIncidents = mockIncidents.filter(i => i.status === 'new');

  if (!camera) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Camera Not Found</h2>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </Card>
      </div>
    );
  }

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
          {/* Camera Info Sidebar */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Video className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">{camera.name}</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{camera.location.street}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge 
                      variant={camera.status === 'online' ? 'default' : 'destructive'}
                      className="mt-1"
                    >
                      {camera.status}
                    </Badge>
                  </div>
                </div>

                {camera.coverageArea && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-medium">Coverage Area</p>
                      <p className="text-sm text-muted-foreground">{camera.coverageArea}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-3">Camera Controls</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  Refresh Stream
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Video className="h-4 w-4 mr-2" />
                  Full Screen
                </Button>
              </div>
            </Card>
          </div>

          {/* Camera Stream */}
          <div className="col-span-12 lg:col-span-9">
            <Card className="p-0 overflow-hidden">
              <div className="bg-secondary p-4 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Live Camera Feed
                  {camera.status === 'online' && (
                    <Badge variant="default" className="ml-2">
                      <span className="animate-pulse mr-2">●</span>
                      LIVE
                    </Badge>
                  )}
                </h3>
              </div>
              
              <div className="relative bg-black" style={{ paddingTop: '56.25%' }}>
                {camera.status === 'online' ? (
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={camera.streamUrl}
                    title={camera.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Camera Offline</p>
                      <p className="text-sm text-gray-400">
                        {camera.status === 'maintenance' 
                          ? 'Camera is under maintenance' 
                          : 'Camera is currently unavailable'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Additional Info */}
            <Card className="mt-6 p-6">
              <h3 className="font-semibold mb-4">Camera Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Camera ID</p>
                  <p className="font-medium">{camera.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Coordinates</p>
                  <p className="font-medium">
                    {camera.location.lat.toFixed(4)}, {camera.location.lng.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stream Status</p>
                  <p className="font-medium capitalize">{camera.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Resolution</p>
                  <p className="font-medium">1920x1080 (Full HD)</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CameraView;
