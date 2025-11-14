import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Incident } from '@/types/incident';
import { Card } from './ui/card';

interface IncidentMapProps {
  incidents: Incident[];
  selectedIncidentId?: string;
  onIncidentSelect: (incidentId: string) => void;
}

const IncidentMap = ({ incidents, selectedIncidentId, onIncidentSelect }: IncidentMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [apiKey] = useState(import.meta.env.VITE_MAPS_API || '');
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !apiKey || map.current) return;

    try {
      mapboxgl.accessToken = apiKey;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [21.2257, 45.7489], // Timișoara center
        zoom: 13,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      map.current.on('load', () => {
        setIsMapReady(true);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      map.current?.remove();
      map.current = null;
      setIsMapReady(false);
    };
  }, [apiKey]);

  useEffect(() => {
    if (!map.current || !isMapReady) return;

    // Remove old markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Add new markers
    incidents.forEach((incident) => {
      const el = document.createElement('div');
      el.className = 'incident-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = incident.id === selectedIncidentId ? '#3b82f6' : '#ef4444';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.3s ease';

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([incident.location.lng, incident.location.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px;">
                <strong style="color: #ef4444;">${incident.plateNumber}</strong><br/>
                <span style="font-size: 12px;">${incident.location.street}</span><br/>
                <span style="font-size: 11px; color: #666;">Duration: ${incident.duration}min</span>
              </div>
            `)
        )
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onIncidentSelect(incident.id);
      });

      markers.current[incident.id] = marker;
    });
  }, [incidents, selectedIncidentId, onIncidentSelect, isMapReady]);

  useEffect(() => {
    if (!map.current || !selectedIncidentId || !isMapReady) return;

    const incident = incidents.find(i => i.id === selectedIncidentId);
    if (incident) {
      map.current.flyTo({
        center: [incident.location.lng, incident.location.lat],
        zoom: 16,
        duration: 1000,
      });
    }
  }, [selectedIncidentId, incidents, isMapReady]);

  if (!apiKey) {
    return (
      <Card className="h-full flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Mapbox API Key Required</h3>
            <p className="text-sm text-muted-foreground">
              Please enter your Mapbox public token to display the incident map.
              Get one at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Please add your Mapbox API key to the .env file as VITE_MAPS_API
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
    </div>
  );
};

export default IncidentMap;
