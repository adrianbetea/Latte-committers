import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Incident } from '@/types/incident';
import { mockCameras } from '@/types/camera';
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
  const cameraMarkers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [apiKey] = useState(import.meta.env.VITE_MAPS_API || '');
  const [isMapReady, setIsMapReady] = useState(false);
  const navigate = useNavigate();

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
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = incident.id === selectedIncidentId ? '#3b82f6' : '#ef4444';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.transition = 'background-color 0.3s ease';

      el.addEventListener('mouseenter', () => {
        el.style.backgroundColor = incident.id === selectedIncidentId ? '#2563eb' : '#dba531ff';
      });

      el.addEventListener('mouseleave', () => {
        el.style.backgroundColor = incident.id === selectedIncidentId ? '#3b82f6' : '#ef4444';
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

    // Add camera markers with offset to avoid overlap with incidents
    mockCameras.forEach((camera) => {
      // Check if there's an incident nearby (within ~50 meters)
      const nearbyIncident = incidents.find(incident => {
        const distance = Math.sqrt(
          Math.pow((incident.location.lat - camera.location.lat) * 111000, 2) +
          Math.pow((incident.location.lng - camera.location.lng) * 111000, 2)
        );
        return distance < 50; // 50 meters threshold
      });

      const cameraEl = document.createElement('div');
      cameraEl.className = 'camera-marker';
      cameraEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m23 7-3 3.5V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3.5L23 17z"/>
        </svg>
      `;
      cameraEl.style.width = '36px';
      cameraEl.style.height = '36px';
      cameraEl.style.backgroundColor = camera.status === 'online' ? '#10b981' : '#6b7280';
      cameraEl.style.borderRadius = '50%';
      cameraEl.style.display = 'flex';
      cameraEl.style.alignItems = 'center';
      cameraEl.style.justifyContent = 'center';
      cameraEl.style.border = '3px solid white';
      cameraEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      cameraEl.style.cursor = 'pointer';
      cameraEl.style.color = 'white';
      cameraEl.style.transition = 'background-color 0.3s ease';
      cameraEl.style.zIndex = '10'; // Cameras appear above incidents

      cameraEl.addEventListener('mouseenter', () => {
        cameraEl.style.backgroundColor = camera.status === 'online' ? '#059669' : '#4b5563';
      });

      cameraEl.addEventListener('mouseleave', () => {
        cameraEl.style.backgroundColor = camera.status === 'online' ? '#10b981' : '#6b7280';
      });

      // Create popup content - include nearby incident info if exists
      let popupContent = `
        <div style="padding: 8px;">
          <strong style="color: #10b981;">📹 ${camera.name}</strong><br/>
          <span style="font-size: 12px;">${camera.location.street}</span><br/>
          <span style="font-size: 11px; color: #666;">Status: ${camera.status}</span>
      `;

      if (nearbyIncident) {
        popupContent += `
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #eee;">
          <strong style="color: #ef4444;">⚠️ Active Violation Nearby</strong><br/>
          <span style="font-size: 11px;">Plate: ${nearbyIncident.plateNumber}</span><br/>
          <span style="font-size: 11px;">Duration: ${nearbyIncident.duration}min</span>
        `;
      }

      popupContent += `
          <button onclick="window.location.href='/camera/${camera.id}'" style="margin-top: 8px; padding: 4px 8px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; width: 100%;">
            View Live Feed
          </button>
        </div>
      `;

      const cameraMarker = new mapboxgl.Marker(cameraEl, {
        offset: nearbyIncident ? [20, -20] : [0, 0] // Offset camera if incident nearby
      })
        .setLngLat([camera.location.lng, camera.location.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(popupContent)
        )
        .addTo(map.current!);

      cameraEl.addEventListener('click', () => {
        navigate(`/camera/${camera.id}`);
      });

      cameraMarkers.current[camera.id] = cameraMarker;
    });
  }, [incidents, selectedIncidentId, onIncidentSelect, isMapReady, navigate]);

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
