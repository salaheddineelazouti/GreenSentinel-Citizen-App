import { useState } from 'react';

// Define types as needed
export interface Incident {
  id: number;
  lat: number;
  lon: number;
  confidence: number;
  state: string;
  createdAt: string;
}

// Create the mock function
const useIncident = jest.fn().mockImplementation((incidentId: number) => {
  const [incident, setIncident] = useState<Incident>({
    id: incidentId,
    lat: 48.8566,
    lon: 2.3522,
    confidence: 85,
    state: 'new',
    createdAt: '2023-04-01T12:00:00Z',
  });
  
  // Using _ prefix to indicate intentionally unused variables
  const [isLoading] = useState(false);
  const [error] = useState(null);
  
  const patchState = jest.fn().mockImplementation((id: number, newState: string) => {
    return Promise.resolve().then(() => {
      setIncident((prev) => ({
        ...prev,
        state: newState,
      }));
      
      // Dispatch the custom event for WebSocket simulation
      window.dispatchEvent(
        new CustomEvent('incidentUpdated', {
          detail: {
            id,
            state: newState,
            updatedAt: new Date().toISOString(),
          },
        })
      );
      
      return { id, state: newState };
    });
  });
  
  return {
    incident,
    isLoading,
    error,
    patchState,
  };
});

export default useIncident;
