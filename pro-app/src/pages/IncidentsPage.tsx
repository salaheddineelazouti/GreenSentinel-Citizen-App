import React from 'react';
import { Loader } from 'lucide-react';
import { useIncidents } from '../hooks/useIncidents';
import IncidentCard from '../components/IncidentCard';

const IncidentsPage: React.FC = () => {
  const { incidents, status, isLoading, error, refetch } = useIncidents();

  return (
    <div className="container-app py-6">
      <div className="flex justify-between items-center mb-6">
        <h1>Incidents en cours</h1>
        
        {(status !== 'connected' || error) && (
          <button 
            onClick={refetch}
            className="flex items-center gap-2 btn btn-secondary"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Connexion...</span>
              </>
            ) : (
              <span>Reconnecter</span>
            )}
          </button>
        )}
      </div>
      
      {(status === 'connecting' || isLoading) && incidents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Loader className="h-12 w-12 animate-spin mb-4" />
          <p>Connexion au serveur d'incidents...</p>
        </div>
      )}
      
      {(status === 'disconnected' || error) && incidents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <p className="mb-4">Impossible de se connecter au serveur d'incidents</p>
          <button onClick={refetch} className="btn btn-primary">
            Réessayer
          </button>
        </div>
      )}
      
      {incidents.length === 0 && status === 'connected' && !error ? (
        <div className="text-center py-12 text-gray-500">
          <p>Aucun incident pour le moment</p>
          <p className="text-sm mt-2">Les nouveaux incidents apparaîtront ici automatiquement</p>
        </div>
      ) : (
        <div>
          {incidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </div>
  );
};

export default IncidentsPage;
