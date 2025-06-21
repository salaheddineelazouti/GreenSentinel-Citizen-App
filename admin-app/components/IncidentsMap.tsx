'use client';

import { Box, useColorMode } from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Incident } from '@/lib/api';
import { formatDate } from '@/lib/utils';

// Ensure Leaflet CSS is loaded in the client-side component
const LeafletCSS = () => {
  useEffect(() => {
    // Add Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/leaflet/leaflet.css';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return null;
};

// Define custom marker colors based on incident priority
const getMarkerIcon = (priority: string, colorMode: string) => {
  let iconUrl = '';
  let markerColor = '';

  switch (priority) {
    case 'high':
      markerColor = '#E53E3E'; // red.500
      break;
    case 'medium':
      markerColor = '#DD6B20'; // orange.500
      break;
    case 'low':
      markerColor = '#38A169'; // green.500
      break;
    default:
      markerColor = '#4A5568'; // gray.600
      break;
  }

  // Create a custom marker icon
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background-color: ${markerColor};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid ${colorMode === 'dark' ? '#2D3748' : 'white'};
        box-shadow: 0 0 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Component to automatically move the map to a selected incident
const MapUpdater = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, map, zoom]);
  return null;
};

interface IncidentsMapProps {
  incidents: Incident[];
  selectedIncident?: Incident | null;
}

export default function IncidentsMap({ incidents, selectedIncident }: IncidentsMapProps) {
  const [mapInitialized, setMapInitialized] = useState(false);
  const { colorMode } = useColorMode();
  const mapCenter = selectedIncident
    ? [selectedIncident.location.latitude, selectedIncident.location.longitude] as [number, number]
    : [48.8566, 2.3522] as [number, number]; // Default center (Paris)
  
  // Set zoom level based on whether an incident is selected
  const zoom = selectedIncident ? 15 : 12;

  // Enable map only on client-side
  useEffect(() => {
    setMapInitialized(true);
  }, []);

  if (!mapInitialized) {
    return (
      <Box 
        height="500px" 
        width="100%" 
        borderWidth="1px"
        borderRadius="lg"
        borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
        bg={colorMode === 'light' ? 'gray.100' : 'gray.700'}
      />
    );
  }

  return (
    <Box 
      height="500px" 
      width="100%"
      borderWidth="1px"
      borderRadius="lg" 
      overflow="hidden"
      position="relative"
    >
      <LeafletCSS />
      <MapContainer 
        center={mapCenter}
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }} 
        zoomControl={true}
      >
        <MapUpdater center={mapCenter} zoom={zoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={colorMode === 'dark' 
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          }
        />
        
        {incidents.map(incident => (
          <Marker 
            key={incident.id}
            position={[incident.location.latitude, incident.location.longitude]}
            icon={getMarkerIcon(incident.priority, colorMode)}
          >
            <Popup>
              <div>
                <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>{incident.title}</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '6px' }}>
                  <strong>Status:</strong> {incident.status.replace('_', ' ')}
                </p>
                <p style={{ fontSize: '0.9rem', marginBottom: '6px' }}>
                  <strong>Priority:</strong> {incident.priority}
                </p>
                <p style={{ fontSize: '0.9rem', marginBottom: '6px' }}>
                  <strong>Created:</strong> {formatDate(incident.createdAt)}
                </p>
                {incident.location.address && (
                  <p style={{ fontSize: '0.9rem', marginBottom: '6px' }}>
                    <strong>Address:</strong> {incident.location.address}
                  </p>
                )}
                {incident.description && (
                  <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>{incident.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}
