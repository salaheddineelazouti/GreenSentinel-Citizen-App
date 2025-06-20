// Mock pour useIncidents
const mockIncidents = [
  { 
    id: 1, 
    latitude: 48.856614, 
    longitude: 2.3522219, 
    address: '1 Rue de Rivoli, Paris', 
    confidence: 85,
    confidence_text: 'Élevée',
    timestamp: new Date().toISOString(),
    status: 'validated_fire'
  },
  { 
    id: 2, 
    latitude: 45.764043, 
    longitude: 4.835659, 
    address: '20 Place Bellecour, Lyon', 
    confidence: 65,
    confidence_text: 'Moyenne',
    timestamp: new Date().toISOString(),
    status: 'pending_validation'
  }
];

const useIncidentsMock = {
  incidents: mockIncidents,
  loading: false,
  error: null,
  connected: true
};

module.exports = { useIncidentsMock, mockIncidents };
