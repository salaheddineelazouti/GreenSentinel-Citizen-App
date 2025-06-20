import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer } from 'react-leaflet';
import type { LatLngTuple } from 'leaflet';

interface MapContextType {
  center: LatLngTuple;
  setCenter: (center: LatLngTuple) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
}

// Default center from env or fallback to Casablanca, Morocco
const DEFAULT_CENTER: LatLngTuple = 
  (import.meta.env.VITE_MAP_CENTER ? 
    JSON.parse(import.meta.env.VITE_MAP_CENTER) : 
    [33.6, -7.6]) as LatLngTuple;

const DEFAULT_ZOOM = 10;

const MapContext = createContext<MapContextType>({
  center: DEFAULT_CENTER,
  setCenter: () => {},
  zoom: DEFAULT_ZOOM,
  setZoom: () => {},
});

export const useMapContext = () => useContext(MapContext);

interface MapContainerProps {
  children?: ReactNode;
  initialCenter?: LatLngTuple;
  initialZoom?: number;
}

/**
 * MapContainer component providing map context and Leaflet integration
 * Renders a full-size MapContainer with OpenStreetMap tiles 
 */
const MapContainer: React.FC<MapContainerProps> = ({
  children,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
}) => {
  const [center, setCenter] = useState<LatLngTuple>(initialCenter);
  const [zoom, setZoom] = useState<number>(initialZoom);

  return (
    <MapContext.Provider value={{ center, setCenter, zoom, setZoom }}>
      <div className="w-full h-full">
        <LeafletMapContainer
          center={center}
          zoom={zoom}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false} // We'll add custom zoom control
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {children}
        </LeafletMapContainer>
      </div>
    </MapContext.Provider>
  );
};

export default MapContainer;
