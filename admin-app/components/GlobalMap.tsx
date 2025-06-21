'use client';

import { Box, useColorMode } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from '@changey/react-leaflet-markercluster';
import L from 'leaflet';
import 'leaflet.markercluster';
import { Incident } from '@/lib/api';
import { formatDate } from '@/lib/utils';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';
// Import MarkerCluster CSS manually (public folder)
// Note: We need to use a custom path since the package export doesn't work

interface GlobalMapProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
}

// Custom icon for incidents based on severity
const createIncidentIcon = (severity: number) => {
  const size = 25 + severity * 5; // Size increases with severity
  
  return L.divIcon({
    html: `<div style="
      background-color: rgba(230, 57, 70, ${0.6 + severity * 0.08}); 
      width: ${size}px; 
      height: ${size}px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      border: 2px solid #fff;
      box-shadow: 0 0 4px rgba(0,0,0,0.5);
      font-weight: bold;
      color: white;
    ">${severity}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

/**
 * Full-screen map with clustered incident markers
 */
export default function GlobalMap({ incidents, onSelectIncident }: GlobalMapProps) {
  const { colorMode } = useColorMode();
  const mapCenter = { lat: 46.227638, lng: 2.213749 }; // Center of France
  
  // Store icon instances to prevent recreation on each render
  const [icons, setIcons] = useState<Record<number, L.DivIcon>>({});
  
  // Create icons for each severity level (1-5)
  useEffect(() => {
    const newIcons: Record<number, L.DivIcon> = {};
    for (let i = 1; i <= 5; i++) {
      newIcons[i] = createIncidentIcon(i);
    }
    setIcons(newIcons);
  }, []);
  
  // Set map layer based on color mode
  const tileUrl = colorMode === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  
  const attribution = colorMode === 'dark'
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  
  return (
    <Box position="absolute" top="0" left="0" right="0" bottom="0">
      <MapContainer 
        center={mapCenter} 
        zoom={5} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer url={tileUrl} attribution={attribution} />
        
        <MarkerClusterGroup
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={true}
          maxClusterRadius={60}
          iconCreateFunction={(cluster: any) => {
            const count = cluster.getChildCount();
            return L.divIcon({
              html: `<div style="
                background-color: #E63946; 
                width: 40px; 
                height: 40px; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                border: 2px solid #fff;
                font-weight: bold;
                color: white;
              ">${count}</div>`,
              className: '',
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            });
          }}
        >
          {incidents
            .filter(incident => {
              // Filter out incidents with invalid coordinates
              if (incident.lat !== undefined && incident.lng !== undefined) {
                return true;
              }
              
              // Try to use coordinates from location object if available
              if (incident.location?.latitude !== undefined && incident.location?.longitude !== undefined) {
                incident.lat = incident.location.latitude;
                incident.lng = incident.location.longitude;
                return true;
              }
              
              // No valid coordinates, skip this incident
              return false;
            })
            .map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.lat as number, incident.lng as number]}
              icon={icons[incident.severity] || createIncidentIcon(incident.severity)}
              eventHandlers={{
                click: () => onSelectIncident(incident)
              }}
            >
              <Popup>
                <div>
                  <h3>{incident.title}</h3>
                  <p>Gravité: {incident.severity}/5</p>
                  <p>État: {incident.state}</p>
                  <p>Date: {incident.created_at ? formatDate(incident.created_at) : 
                          incident.createdAt ? formatDate(incident.createdAt) : 'Non disponible'}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </Box>
  );
}
