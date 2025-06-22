import React from 'react';
import { AlertTriangle, MapPin, Clock, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { IncidentEvt } from '../hooks/useIncidents';

interface IncidentCardProps {
  incident: IncidentEvt;
}

const IncidentCard: React.FC<IncidentCardProps> = ({ incident }) => {
  // Formater la date pour l'affichage
  const formatDate = (dateStr: string) => {
    if (!dateStr) {
      return 'Date inconnue';
    }
    
    const date = new Date(dateStr);
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.warn('Date invalide reçue:', dateStr);
      return 'Date invalide';
    }
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Calculer la classe de couleur en fonction de la confiance
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-red-600';
    if (confidence >= 0.5) return 'text-orange-500';
    return 'text-yellow-500';
  };

  // Gestion du statut de l'incident (pour fonctionnalités futures)
  const getStatusInfo = (state?: string) => {
    switch (state) {
      case 'en_route':
        return {
          label: 'En route',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          icon: Clock
        };
      case 'sur_place':
        return {
          label: 'Sur place',
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          icon: Users
        };
      case 'validated_fire':
        return {
          label: 'Feu validé',
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
          icon: AlertTriangle
        };
      default:
        return {
          label: 'Nouveau',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          icon: AlertTriangle
        };
    }
  };

  // Formater le pourcentage de confiance
  const confidencePercent = Math.round(incident.confidence * 100);
  const statusInfo = getStatusInfo(incident.state);
  const StatusIcon = statusInfo.icon;
  
  return (
    <div className="card mb-4 hover:shadow-lg transition-shadow relative">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${getConfidenceColor(incident.confidence)} bg-opacity-10`}>
            <AlertTriangle className={`h-6 w-6 ${getConfidenceColor(incident.confidence)}`} />
          </div>
          <div>
            <h3 className="font-semibold">Incident #{incident.id}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(incident.createdAt)}
            </p>
            {/* Status badge for future features */}
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className={`font-bold ${getConfidenceColor(incident.confidence)}`}>
            {confidencePercent}%
          </span>
          <p className="text-xs text-gray-500">Confiance</p>
        </div>
      </div>
      
      <div className="mt-3 flex items-center text-gray-700 dark:text-gray-300">
        <MapPin className="h-4 w-4 mr-1" />
        <span className="text-sm">
          {incident.lat.toFixed(6)}, {incident.lon.toFixed(6)}
        </span>
      </div>
      
      <div className="mt-3 flex justify-end gap-2">
        <button 
          className="btn btn-secondary text-sm"
          onClick={() => {
            // Ouvrir dans Google Maps
            window.open(
              `https://www.google.com/maps?q=${incident.lat},${incident.lon}`,
              '_blank'
            );
          }}
        >
          Voir sur la carte
        </button>
        <Link 
          to={`/incident/${incident.id}`} 
          className="btn btn-primary text-sm flex items-center"
          aria-label="Voir les détails de l'incident"
          data-testid={`incident-detail-link-${incident.id}`}
        >
          Détails <ExternalLink className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default IncidentCard;
