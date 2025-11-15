import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Incident } from '@/types/incident';
import { Card } from './ui/card';
import { Play } from 'lucide-react';

interface IncidentMapProps {
  incidents: Incident[];
  selectedIncidentId?: string;
  onIncidentSelect: (incidentId: string) => void;
}

// Funcție pentru a calcula culoarea pe baza timpului trecut
const getIncidentColor = (violationStart: Date): string => {
  const now = new Date();
  const timeDiffMs = now.getTime() - violationStart.getTime();
  const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

  // < 1 oră = roșu
  if (timeDiffHours < 1) {
    return '#ef4444'; // Red
  }
  // 1 - 3 ore = portocaliu
  if (timeDiffHours >= 1 && timeDiffHours < 3) {
    return '#f97316'; // Orange
  }
  // 3 - 12 ore = galben
  if (timeDiffHours >= 3 && timeDiffHours < 12) {
    return '#eab308'; // Yellow
  }
  // > 12 ore = albastru
  return '#3b82f6'; // Blue
};

const IncidentMap = ({ incidents, selectedIncidentId, onIncidentSelect }: IncidentMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [apiKey] = useState(import.meta.env.VITE_MAPS_API || '');
  const [isMapReady, setIsMapReady] = useState(false);
  const navigate = useNavigate();
  const [colorRefresh, setColorRefresh] = useState(0);

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

  // Refresh colors every minute to update incident colors dynamically
  useEffect(() => {
    const interval = setInterval(() => {
      setColorRefresh(prev => prev + 1);
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!map.current || !isMapReady) return;

    // Remove old markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Add new markers for incidents
    incidents.forEach((incident) => {
      const baseColor = getIncidentColor(incident.violationStart);
      
      const el = document.createElement('div');
      el.className = 'incident-marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = incident.id === selectedIncidentId ? '#2563eb' : baseColor;
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.transition = 'background-color 0.3s ease';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '20px';
      el.style.userSelect = 'none';
      el.style.pointerEvents = 'auto';

      // Add icon based on incident type
      el.innerHTML = '📍';

      el.addEventListener('mouseenter', () => {
        // Brighten color on hover
        const hoverColors: { [key: string]: string } = {
          '#ef4444': '#dc2626', // Dark red
          '#f97316': '#ea580c', // Dark orange
          '#eab308': '#ca8a04', // Dark yellow
          '#3b82f6': '#2563eb', // Dark blue
        };
        el.style.backgroundColor = hoverColors[baseColor] || '#dc2626';
      });

      el.addEventListener('mouseleave', () => {
        el.style.backgroundColor = incident.id === selectedIncidentId ? '#2563eb' : baseColor;
      });

      // Crează HTML pentru popup cu buton de vizionare video
      const popupHTML = `
        <div style="padding: 12px; min-width: 200px;">
          <strong style="color: #ef4444; font-size: 14px;">${incident.plateNumber}</strong><br/>
          <span style="font-size: 12px; color: #666;">${incident.location.street}</span><br/>
          <span style="font-size: 11px; color: #999;">Duration: ${incident.duration} min</span><br/>
          <span style="font-size: 11px; color: #999;">Lat: ${incident.location.lat.toFixed(4)}, Lng: ${incident.location.lng.toFixed(4)}</span>
          <div style="margin-top: 8px;">
            <button onclick="window.location.href='/incident/${incident.id}'" 
              style="width: 100%; padding: 6px; background-color: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
              View Incident
            </button>
          </div>
        </div>
      `;

      // Create popup without auto-open
      const popup = new mapboxgl.Popup({ 
        offset: [0, -40],
        maxWidth: 250,
        closeButton: true,
        closeOnClick: false
      }).setHTML(popupHTML);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([incident.location.lng, incident.location.lat])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onIncidentSelect(incident.id);
        marker.togglePopup();
      });

      markers.current[incident.id] = marker;
    });
  }, [incidents, selectedIncidentId, onIncidentSelect, isMapReady, navigate, colorRefresh]);

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
