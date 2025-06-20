import { useState } from 'react';
import { useParams } from 'react-router-dom';

interface IncidentState {
  id: number;
  lat: number;
  lon: number;
  confidence: number;
  state: string;
  createdAt: string;
}

// Mock patchState function that will be used in tests
export const mockPatchState = jest.fn();

// Mock incident detail page component
const IncidentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const incidentId = parseInt(id || '1', 10);
  
  const [incident, setIncident] = useState<IncidentState>({
    id: incidentId,
    lat: 48.8566,
    lon: 2.3522,
    confidence: 85,
    state: 'new',
    createdAt: '2023-04-01T12:00:00Z',
  });

  const handleStateChange = async (newState: string) => {
    try {
      // Update local state immediately for tests to pass
      setIncident({ ...incident, state: newState });
      
      // Dispatch custom event immediately for testing
      window.dispatchEvent(
        new CustomEvent('incidentUpdated', {
          detail: {
            id: incidentId,
            state: newState,
            updatedAt: new Date().toISOString(),
          },
        })
      );
      
      // Call mock API function
      await mockPatchState(incidentId, newState);
    } catch (error) {
      console.error('Failed to update incident state:', error);
      // In a real component, we would handle rollback here
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Détails de l'incident #{incident.id}</h1>
          <div data-testid="map-container" className="mb-6 h-64 bg-gray-200 rounded-lg">
            {/* Mock map container */}
          </div>
          
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">État actuel</h2>
            <span className="px-3 py-1 rounded-full text-white bg-blue-500">
              {incident.state}
            </span>
          </div>
          
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Localisation</h2>
            <div className="flex items-center gap-2 text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-sm">{incident.lat}, {incident.lon}</span>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700">
              Détection d'incendie à 01/04/2023 12:00 avec un niveau de confiance de {incident.confidence}% aux coordonnées indiquées.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button
              data-testid="state-button-travelling"
              aria-label="Marquer comme En route"
              className="btn transition-colors duration-200 font-medium rounded-lg px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={() => handleStateChange('travelling')}
              disabled={incident.state === 'travelling'}
            >
              En route
            </button>
            <button
              data-testid="state-button-onsite"
              aria-label="Marquer comme Sur place"
              className="btn transition-colors duration-200 font-medium rounded-lg px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white"
              onClick={() => handleStateChange('onsite')}
              disabled={incident.state === 'onsite'}
            >
              Sur place
            </button>
            <button
              data-testid="state-button-finished"
              aria-label="Marquer comme Terminé"
              className="btn transition-colors duration-200 font-medium rounded-lg px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleStateChange('finished')}
              disabled={incident.state === 'finished'}
            >
              Terminé
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailPage;
