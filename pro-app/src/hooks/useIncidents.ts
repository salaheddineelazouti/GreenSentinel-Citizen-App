import { useEffect, useRef, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

export interface IncidentEvt {
  id: number;
  lat: number;
  lon: number;
  createdAt: string;
  confidence: number;
  state?: string;
}

type ActionType = 'UPDATE_STATE';

export interface IncidentAction {
  type: ActionType;
  payload: {
    id: number;
    state: string;
  };
}

// États de la connexion WebSocket
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

// Fonction factory pour WebSocket, permet de faciliter les tests
export const createWebSocket = (url: string): WebSocket => {
  return new WebSocket(url);
};

// Optional parameters for testing
type UseIncidentsOptions = {
  forceProtocol?: string;
}

export const useIncidents = (options: UseIncidentsOptions = {}) => {
  const [incidents, setIncidents] = useState<IncidentEvt[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const maxIncidents = 100;
  const incidentIds = useRef<Set<number>>(new Set());

  // Fetch initial incidents from REST API
  const fetchIncidents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axiosInstance.get('/api/v1/incidents', {
        params: {
          state: 'validated_fire',
          limit: maxIncidents
        }
      });
      
      const fetchedIncidents = response.data.incidents || response.data || [];
      setIncidents(fetchedIncidents);
      
      // Track incident IDs to avoid duplicates
      incidentIds.current = new Set(fetchedIncidents.map((inc: IncidentEvt) => inc.id));
      
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError('Erreur lors du chargement des incidents');
    } finally {
      setIsLoading(false);
    }
  };

  const connect = () => {
    // Récupérer l'hôte API depuis les variables d'environnement ou localStorage
    const apiHost = localStorage.getItem('apiHost') || import.meta.env.VITE_API_HOST || 'localhost:8000';
    
    // Use the forced protocol in tests or determine it from window.location
    const protocol = options.forceProtocol || (window.location.protocol === 'https:' ? 'wss:' : 'ws:');
    const wsUrl = `${protocol}//${apiHost}/ws/incidents`;
    
    setStatus('connecting');
    
    // Fermer la connexion précédente si elle existe
    if (ws.current) {
      ws.current.close();
    }
    
    const socket = createWebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connecté');
      setStatus('connected');
      reconnectAttempts.current = 0;
    };
    
    socket.onmessage = (event) => {
      try {
        const incident = JSON.parse(event.data) as IncidentEvt;
        
        // Avoid duplicates - only add if we haven't seen this incident ID
        if (!incidentIds.current.has(incident.id)) {
          incidentIds.current.add(incident.id);
          setIncidents(prev => {
            // Ajouter le nouvel incident et limiter à maxIncidents
            const newIncidents = [incident, ...prev].slice(0, maxIncidents);
            return newIncidents;
          });
        }
      } catch (error) {
        console.error('Erreur de parsing JSON:', error);
      }
    };
    
    socket.onclose = () => {
      setStatus('disconnected');
      console.log('WebSocket déconnecté');
      
      // Reconnexion avec backoff exponentiel
      const reconnectDelay = Math.min(1000 * (2 ** reconnectAttempts.current), 30000);
      reconnectAttempts.current += 1;
      
      if (reconnectAttempts.current <= maxReconnectAttempts) {
        console.log(`Tentative de reconnexion dans ${reconnectDelay}ms...`);
        setTimeout(connect, reconnectDelay);
      } else {
        console.error('Nombre maximum de tentatives de reconnexion atteint');
      }
    };
    
    socket.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
      socket.close();
    };
    
    ws.current = socket;
  };

  // Mettre à jour l'état d'un incident dans la liste locale
  const updateIncidentState = (id: number, state: string) => {
    setIncidents(prevIncidents => {
      return prevIncidents.map(incident => {
        if (incident.id === id) {
          return { ...incident, state };
        }
        return incident;
      });
    });
  };

  // Traiter les actions sur les incidents (pour la communication avec useIncident)
  const processAction = (action: IncidentAction) => {
    switch (action.type) {
      case 'UPDATE_STATE':
        updateIncidentState(action.payload.id, action.payload.state);
        break;
      default:
        console.warn('Unknown action type', action);
    }
  };

  useEffect(() => {
    // Fetch initial data then connect to WebSocket
    fetchIncidents().then(() => {
      connect();
    });
    
    // Listen for incident state updates via custom events
    const handleIncidentAction = (event: CustomEvent<IncidentAction>) => {
      processAction(event.detail);
    };

    // Use type assertion to handle the custom event type
    window.addEventListener('incident:action', handleIncidentAction as unknown as EventListener);
    
    // Nettoyage à la désinstallation
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      window.removeEventListener('incident:action', handleIncidentAction as unknown as EventListener);
    };
  }, [connect, processAction]);

  return {
    incidents,
    status,
    isLoading,
    error,
    updateIncidentState,
    refetch: fetchIncidents
  };
};
