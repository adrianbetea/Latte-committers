import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Supercluster from 'supercluster';
import { Incident } from '@/types/incident';
import { Card } from './ui/card';
import { Play } from 'lucide-react';

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
  const navigate = useNavigate();
  const clusterIndex = useRef<Supercluster | null>(null);

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

  // Initialize Supercluster
  useEffect(() => {
    if (!incidents.length) return;

    const points = incidents.map((incident) => ({
      type: 'Feature' as const,
      properties: {
        cluster: false,
        incidentId: incident.id,
        incident: incident,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [incident.location.lng, incident.location.lat],
      },
    }));

    clusterIndex.current = new Supercluster({
      radius: 60,
      maxZoom: 16,
    });

    clusterIndex.current.load(points);
  }, [incidents]);

  const updateMarkers = () => {
    if (!map.current || !isMapReady || !clusterIndex.current) return;

    const bounds = map.current.getBounds();
    const zoom = Math.floor(map.current.getZoom());

    const clusters = clusterIndex.current.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom
    );

    // Remove old markers that are not in current view
    const newMarkerKeys = new Set<string>();
    
    // Add markers for clusters and individual points
    clusters.forEach((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates;
      const { cluster: isCluster, point_count: pointCount } = cluster.properties;

      if (isCluster) {
        // Create cluster marker
        const markerId = `cluster-${cluster.id}`;
        newMarkerKeys.add(markerId);

        // Reuse existing marker if possible
        if (!markers.current[markerId]) {
          const el = document.createElement('div');
          el.className = 'cluster-marker';
          const size = pointCount < 10 ? 50 : pointCount < 50 ? 60 : 70;
          el.style.width = `${size}px`;
          el.style.height = `${size}px`;
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#ef4444';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
          el.style.cursor = 'pointer';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.fontSize = '16px';
          el.style.fontWeight = 'bold';
          el.style.color = 'white';
          el.style.transition = 'opacity 0.2s ease';
          el.textContent = pointCount.toString();

          el.addEventListener('mouseenter', () => {
            el.style.opacity = '0.8';
          });

          el.addEventListener('mouseleave', () => {
            el.style.opacity = '1';
          });

          const marker = new mapboxgl.Marker(el, { anchor: 'center' })
            .setLngLat([lng, lat])
            .addTo(map.current!);

          el.addEventListener('click', () => {
            const expansionZoom = Math.min(
              clusterIndex.current!.getClusterExpansionZoom(cluster.id as number),
              20
            );
            map.current!.easeTo({
              center: [lng, lat],
              zoom: expansionZoom,
              duration: 500,
            });
          });

          markers.current[markerId] = marker;
        } else {
          // Update existing marker position
          markers.current[markerId].setLngLat([lng, lat]);
        }
      } else {
        // Create individual incident marker
        const incident = cluster.properties.incident;
        const markerId = incident.id;
        newMarkerKeys.add(markerId);

        // Calculate incident age in hours
        const incidentTime = new Date(incident.violationStart).getTime();
        const now = Date.now();
        const ageInHours = (now - incidentTime) / (1000 * 60 * 60);

        // Determine color based on age
        let markerColor: string;
        if (ageInHours < 1) {
          markerColor = '#3b82f6'; // Blue
        } else if (ageInHours < 3) {
          markerColor = '#eab308'; // Yellow
        } else if (ageInHours < 6) {
          markerColor = '#f97316'; // Orange
        } else {
          markerColor = '#ef4444'; // Red
        }

        if (!markers.current[markerId]) {
          const el = document.createElement('div');
          el.className = 'incident-marker';
          el.style.width = '40px';
          el.style.height = '40px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = incident.id === selectedIncidentId ? '#8b5cf6' : markerColor;
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
          el.style.cursor = 'pointer';
          el.style.transition = 'background-color 0.3s ease';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.fontSize = '20px';

          el.innerHTML = '📍';

          el.addEventListener('mouseenter', () => {
            el.style.opacity = '0.7';
          });

          el.addEventListener('mouseleave', () => {
            el.style.opacity = '1';
          });

          // Format date/time
          const incidentDate = new Date(incident.violationStart);
          const formattedDate = incidentDate.toLocaleDateString('ro-RO');
          const formattedTime = incidentDate.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
          
          // Get status badge
          const statusColors = {
            'pending': { bg: '#fef3c7', color: '#92400e', text: 'Pending Review' },
            'resolved_and_fined': { bg: '#fee2e2', color: '#991b1b', text: 'Fined' },
            'resolved': { bg: '#dcfce7', color: '#166534', text: 'Resolved' },
            'rejected': { bg: '#f3f4f6', color: '#374151', text: 'Dismissed' }
          };
          const status = statusColors[incident.status as keyof typeof statusColors] || statusColors['pending'];

          const popupHTML = `
            <div style="padding: 14px; min-width: 240px; max-width: 300px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <strong style="color: #ef4444; font-size: 15px;">${incident.plateNumber}</strong>
                <span style="background-color: ${status.bg}; color: ${status.color}; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600;">
                  ${status.text}
                </span>
              </div>
              
              <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
                <div style="font-size: 12px; color: #374151; margin-bottom: 4px;">
                  📍 ${incident.location.street}
                </div>
                <div style="font-size: 11px; color: #6b7280;">
                  🏘️ District: ${incident.location.district}
                </div>
              </div>
              
              <div style="font-size: 11px; color: #6b7280; line-height: 1.6;">
                <div>📅 ${formattedDate} at ${formattedTime}</div>
                <div>⏱️ Duration: ${incident.duration} minutes</div>
                <div style="font-size: 10px; color: #9ca3af; margin-top: 6px;">
                  Coordinates: ${incident.location.lat.toFixed(4)}, ${incident.location.lng.toFixed(4)}
                </div>
              </div>
            </div>
          `;

          const marker = new mapboxgl.Marker(el, { anchor: 'center' })
            .setLngLat([lng, lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 25, maxWidth: '250px' })
                .setHTML(popupHTML)
            )
            .addTo(map.current!);

          el.addEventListener('click', () => {
            onIncidentSelect(incident.id);
            marker.togglePopup();
          });

          markers.current[markerId] = marker;
        } else {
          // Update existing marker
          markers.current[markerId].setLngLat([lng, lat]);
          const el = markers.current[markerId].getElement();
          el.style.backgroundColor = incident.id === selectedIncidentId ? '#8b5cf6' : markerColor;
        }
      }
    });

    // Remove markers that are no longer visible
    Object.keys(markers.current).forEach(markerId => {
      if (!newMarkerKeys.has(markerId)) {
        markers.current[markerId].remove();
        delete markers.current[markerId];
      }
    });
  };

  useEffect(() => {
    if (!map.current || !isMapReady) return;

    updateMarkers();

    map.current.on('moveend', updateMarkers);
    map.current.on('zoomend', updateMarkers);

    return () => {
      map.current?.off('moveend', updateMarkers);
      map.current?.off('zoomend', updateMarkers);
    };
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
