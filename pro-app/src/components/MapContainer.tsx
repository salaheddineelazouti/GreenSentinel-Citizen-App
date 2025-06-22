import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer } from 'react-leaflet';
import type { LatLngTuple } from 'leaflet';
import L from 'leaflet';

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
// On utilise une approche alternative avec création de carte manuelle (sans LeafletMapContainer)
const MapContainer: React.FC<MapContainerProps> = ({
  children,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
}) => {
  const [center, setCenter] = useState<LatLngTuple>(initialCenter);
  const [zoom, setZoom] = useState<number>(initialZoom);
  
  // Référence à l'élément DOM pour le container de la carte
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Référence à l'objet carte pour y accéder en dehors des effets
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  // ID unique pour chaque instance de la carte
  const mapId = useRef(`map-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  // Effet pour initialiser et nettoyer la carte
  useEffect(() => {
    // Fonction d'initialisation de la carte
    if (!mapContainerRef.current) return;
    
    // Si une carte existe déjà dans cette référence, nettoyons-la d'abord
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Créer une nouvelle instance de carte
    try {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false
      });
      
      // Ajouter la couche de tuiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Stocker la référence de la carte
      mapInstanceRef.current = map;
      
      // Reporter les événements de la carte aux hooks React
      map.on('moveend', () => {
        const newCenter = map.getCenter();
        setCenter([newCenter.lat, newCenter.lng]);
      });
      
      map.on('zoomend', () => {
        setZoom(map.getZoom());
      });

      // Rendre les enfants React dans la carte Leaflet
      if (children && mapInstanceRef.current) {
        // Cette partie est simplifiée - normalement on devrait utiliser un portail React
        // ou une approche similaire pour rendre correctement les enfants React dans la carte
        console.log("Enfants React disponibles pour la carte");
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la carte:", error);
    }

    // Fonction de nettoyage
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Met à jour le centre et le zoom si les props changent
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  return (
    <MapContext.Provider value={{ center, setCenter, zoom, setZoom }}>
      <div className="w-full h-full relative">
        {/* Conteneur de la carte avec ID unique */}
        <div 
          id={mapId.current}
          ref={mapContainerRef} 
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />
        
        {/* Les enfants React doivent être rendus d'une autre manière
            quand on n'utilise pas LeafletMapContainer */}
        <div className="sr-only">
          {children}
        </div>
      </div>
    </MapContext.Provider>
  );
};

export default MapContainer;
