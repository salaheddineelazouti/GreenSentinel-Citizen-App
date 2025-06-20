import React, { useEffect, useState, useCallback } from 'react';
import { ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import type { LatLng } from 'leaflet';
import MapContainer, { useMapContext } from '../components/MapContainer';
import IncidentMarker from '../components/IncidentMarker';
import RadiusSlider from '../components/RadiusSlider';
import { useIncidents } from '../hooks/useIncidents';
import { useGeoFilter } from '../hooks/useGeoFilter';
import { 
  createColumnHelper, 
  flexRender, 
  getCoreRowModel, 
  useReactTable 
} from '@tanstack/react-table';
import type { IncidentEvt } from '../hooks/useIncidents';
import { format } from 'date-fns';

// Column helper for incidents table
const columnHelper = createColumnHelper<IncidentEvt>();

// MapControl component to update map center and zoom
const MapControl = ({ center }: { center?: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  
  return null;
};

// MapEvents component to keep track of map center
const MapEvents = ({ onMoveEnd }: { onMoveEnd: (center: LatLng) => void }) => {
  const map = useMapEvents({
    moveend: () => {
      onMoveEnd(map.getCenter());
    },
  });
  
  return null;
};

/**
 * MapPage component - Main page for displaying incidents on a map
 * with radius filtering and a drawer list of filtered incidents
 */
const MapPage: React.FC = () => {
  const [radius, setRadius] = useState<number>(10);
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const { incidents } = useIncidents();
  const filteredIncidents = useGeoFilter(incidents, mapCenter, radius);
  const { setCenter } = useMapContext();

  // Request user's geolocation
  const handleGeolocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newCenter: [number, number] = [latitude, longitude];
          setCenter(newCenter);
          setMapCenter({ lat: latitude, lng: longitude } as LatLng);
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
        }
      );
    }
  }, [setCenter]);

  // Table columns definition
  const columns = [
    columnHelper.accessor('id', {
      header: 'ID',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Date',
      cell: (info) => {
        const date = info.getValue();
        return date && typeof date === 'string' ? format(new Date(date), 'dd/MM/yyyy HH:mm') : 'N/A';
      }
    }),
    columnHelper.accessor('state', {
      header: 'État',
      cell: (info) => {
        const state = info.getValue();
        switch (state) {
          case 'travelling': return 'En route';
          case 'onsite': return 'Sur place';
          case 'finished': return 'Terminé';
          default: return state;
        }
      }
    }),
    columnHelper.display({
      id: 'distance',
      header: 'Distance',
      cell: (info) => {
        if (!mapCenter) return 'N/A';
        const incident = info.row.original;
        const lat1 = mapCenter.lat;
        const lon1 = mapCenter.lng;
        const lat2 = incident.lat;
        const lon2 = incident.lon;
        
        // Use the haversine formula from useGeoFilter.ts
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return `${distance.toFixed(1)} km`;
      }
    })
  ];

  // Initialize React Table
  const table = useReactTable({
    data: filteredIncidents,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Handle map center change
  const handleMapMoveEnd = useCallback((center: LatLng) => {
    setMapCenter(center);
  }, []);
  
  return (
    <div className="h-screen flex flex-col">
      {/* Navbar */}
      <div className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Carte des incidents</h1>
        <button
          onClick={() => setShowDrawer(!showDrawer)}
          className="btn p-2 rounded-full"
          aria-label="Afficher/masquer la liste des incidents"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer>
            {/* Add incident markers */}
            {filteredIncidents.map(incident => (
              <IncidentMarker 
                key={incident.id} 
                incident={incident} 
              />
            ))}
            
            {/* Map controls */}
            <ZoomControl position="topright" />
            <MapEvents onMoveEnd={handleMapMoveEnd} />
            {mapCenter && <MapControl center={[mapCenter.lat, mapCenter.lng]} />}
          </MapContainer>

          {/* Floating controls */}
          <div className="absolute bottom-4 left-4 z-[1000] max-w-xs">
            <RadiusSlider 
              value={radius} 
              onChange={setRadius} 
            />
          </div>

          <button
            onClick={handleGeolocation}
            className="absolute bottom-4 right-4 z-[1000] bg-white dark:bg-gray-800 p-3 rounded-full shadow-md"
            aria-label="Me centrer sur la carte"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </button>
        </div>

        {/* Drawer for incident list */}
        <div 
          className={`bg-white dark:bg-gray-800 shadow-lg w-80 transition-transform duration-300 ease-in-out overflow-auto ${
            showDrawer ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Incidents ({filteredIncidents.length})
              </h2>
              <button 
                onClick={() => setShowDrawer(false)}
                className="text-gray-500"
                aria-label="Fermer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Table */}
            <div className="overflow-auto max-h-[calc(100vh-120px)]">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th 
                          key={header.id}
                          className="py-2 px-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {table.getRowModel().rows.map(row => (
                    <tr 
                      key={row.id}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => window.location.href = `/incident/${row.original.id}`}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td 
                          key={cell.id}
                          className="py-2 px-1 text-sm whitespace-nowrap"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
