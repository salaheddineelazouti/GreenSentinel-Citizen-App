import type { IncidentEvt } from './useIncidents';
import type { LatLng } from 'leaflet';

// Haversine formula to calculate distance between two points on Earth
const haversineDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

/**
 * Filter incidents by distance from a center point
 * @param incidents Array of incidents
 * @param center Center point (LatLng object or null)
 * @param radiusKm Radius in kilometers
 * @returns Filtered incidents array
 */
export const useGeoFilter = (
  incidents: IncidentEvt[],
  center: LatLng | null,
  radiusKm: number
): IncidentEvt[] => {
  if (!center || !incidents || radiusKm === 0) {
    return incidents || [];
  }

  return incidents.filter(incident => {
    // Extract latitude and longitude from incident
    const incidentLat = incident.lat;
    const incidentLon = incident.lon;
    
    if (!incidentLat || !incidentLon) return false;
    
    // Calculate distance
    const distance = haversineDistance(
      center.lat, 
      center.lng, 
      incidentLat, 
      incidentLon
    );
    
    // Include incident if it's within the specified radius
    return distance <= radiusKm;
  });
};
