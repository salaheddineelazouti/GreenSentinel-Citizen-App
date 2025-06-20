import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, AlertTriangle, ArrowLeft, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useIncident from '../hooks/useIncident';
import StateButton from '../components/StateButton';
import type { IncidentState } from '../api/incidentsApi';

// Fix Leaflet marker icon issue in React
// Default marker icons in Leaflet don't work properly in bundled React apps
// This is a workaround to set default icons explicitly
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const incidentId = id ? parseInt(id, 10) : 0;
  const { incident, isLoading, error, updateState } = useIncident(incidentId);

  // Gestionnaire d'événements pour les boutons de changement d'état
  const handleStateChange = (state: IncidentState) => {
    updateState(state);
  };

  // Formater la date pour l'affichage
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Fonction pour obtenir la classe de couleur en fonction de l'état
  const getStateColor = (state?: string) => {
    switch (state) {
      case 'travelling':
        return 'bg-yellow-500 text-white';
      case 'onsite':
        return 'bg-sky-500 text-white';
      case 'finished':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Fonction pour obtenir le label d'état en français
  const getStateLabel = (state?: string) => {
    switch (state) {
      case 'travelling':
        return 'En route';
      case 'onsite':
        return 'Sur place';
      case 'finished':
        return 'Terminé';
      default:
        return 'Nouveau';
    }
  };

  // Calculer la classe de couleur en fonction de la confiance
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-yellow-500';
    if (confidence >= 0.8) return 'text-red-600';
    if (confidence >= 0.5) return 'text-orange-500';
    return 'text-yellow-500';
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header avec bouton retour */}
      <div className="flex items-center mb-4">
        <button 
          onClick={() => navigate('/incidents')}
          className="btn btn-ghost flex items-center"
          aria-label="Retour à la liste"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour à la liste
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <AlertTriangle className="h-6 w-6" />
          <span>{error}</span>
        </div>
      ) : incident ? (
        <div>
          {/* En-tête de l'incident */}
          <div className="card mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold mb-1">Incident #{incident.id}</h1>
                <div className="flex items-center text-gray-600 mb-2">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{formatDate(incident.createdAt)}</span>
                </div>
              </div>
              
              {/* Badge d'état */}
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStateColor(incident.state)}`}>
                {getStateLabel(incident.state)}
              </div>
            </div>
            
            {/* Niveau de confiance */}
            <div className="mb-4">
              <span className="text-gray-600 mr-2">Niveau de confiance:</span>
              <span className={`font-bold ${getConfidenceColor(incident.confidence)}`}>
                {incident.confidence ? Math.round(incident.confidence * 100) : 0}%
              </span>
            </div>

            {/* Carte */}
            <div className="h-64 rounded-lg overflow-hidden mb-6 border border-gray-200">
              {incident.lat && incident.lon && (
                <MapContainer 
                  center={[incident.lat, incident.lon]} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[incident.lat, incident.lon]}>
                    <Popup>
                      Incident #{incident.id}<br/>
                      Confiance: {Math.round(incident.confidence * 100)}%
                    </Popup>
                  </Marker>
                </MapContainer>
              )}
            </div>

            {/* Coordonnées */}
            <div className="flex items-center text-gray-700 mb-6">
              <MapPin className="h-5 w-5 mr-2" />
              <span className="text-sm">
                {incident.lat.toFixed(6)}, {incident.lon.toFixed(6)}
              </span>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700">
                Détection d'incendie à {formatDate(incident.createdAt)} avec 
                un niveau de confiance de {Math.round(incident.confidence * 100)}% 
                aux coordonnées indiquées.
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-wrap gap-4">
              <StateButton
                label="En route"
                state="travelling"
                currentState={incident.state}
                onClick={handleStateChange}
              />
              <StateButton
                label="Sur place"
                state="onsite"
                currentState={incident.state}
                onClick={handleStateChange}
              />
              <StateButton
                label="Terminé"
                state="finished"
                currentState={incident.state}
                onClick={handleStateChange}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-warning">
          <AlertTriangle className="h-6 w-6" />
          <span>Incident non trouvé</span>
        </div>
      )}
    </div>
  );
};

export default IncidentDetailPage;
