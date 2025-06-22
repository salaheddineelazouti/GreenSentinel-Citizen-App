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
  console.log('Création WebSocket avec URL:', url);
  try {
    const socket = new WebSocket(url);
    console.log('Objet WebSocket créé avec succès');
    return socket;
  } catch (e) {
    console.error('Erreur lors de la création du WebSocket:', e);
    throw e;
  }
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
    let apiHost = localStorage.getItem('apiHost') || import.meta.env.VITE_API_HOST || 'localhost:8000';
    
    console.log('VITE_API_HOST:', import.meta.env.VITE_API_HOST);
    console.log('localStorage apiHost:', localStorage.getItem('apiHost'));
    console.log('apiHost utilisé:', apiHost);
    
    // Supprimer tout préfixe http:// ou https:// de l'apiHost
    apiHost = apiHost.replace(/^(https?:\/\/|http\/\/)/i, '');
    console.log('apiHost après nettoyage:', apiHost);
    
    // Use the forced protocol in tests or determine it from window.location
    const protocol = options.forceProtocol || (window.location.protocol === 'https:' ? 'wss:' : 'ws:');
    console.log('protocole WebSocket utilisé:', protocol);
    
    const wsUrl = `${protocol}//${apiHost}/ws/incidents`;
    console.log('URL WebSocket complète:', wsUrl);
    
    setStatus('connecting');
    console.log('Tentative de connexion WebSocket...');
    
    // Fermer la connexion précédente si elle existe
    if (ws.current) {
      console.log('Fermeture de la connexion WebSocket existante');
      ws.current.close();
    }
    
    try {
      console.log('Création du WebSocket:', wsUrl);
      const socket = createWebSocket(wsUrl);
      console.log('WebSocket créé avec succès, en attente de connexion...');
      
      socket.onopen = () => {
        console.log('WebSocket connecté avec succès!');
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
    
    socket.onclose = (event) => {
      setStatus('disconnected');
      console.log('WebSocket déconnecté avec code:', event.code, 'raison:', event.reason);
      
      // Reconnexion avec backoff exponentiel
      const reconnectDelay = Math.min(1000 * (2 ** reconnectAttempts.current), 30000);
      reconnectAttempts.current += 1;
      
      if (reconnectAttempts.current <= maxReconnectAttempts) {
        console.log(`Tentative de reconnexion dans ${reconnectDelay}ms... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
        setTimeout(connect, reconnectDelay);
      } else {
        console.error('Nombre maximum de tentatives de reconnexion atteint');
      }
    };
    
    socket.onerror = (error) => {
      console.error('Erreur WebSocket détectée:', error);
      console.log('Détail de l\'erreur WebSocket (si disponible):', JSON.stringify(error));
    };
    
    ws.current = socket;
    } catch (error) {
      console.error('Exception lors de la création du WebSocket:', error);
      // Simuler un délai puis tenter une reconnexion
      setTimeout(connect, 5000);
    }
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
    console.log('Hook useIncidents activé');
    // Fetch initial data then connect to WebSocket
    console.log('Récupération des incidents initiaux...');
    fetchIncidents().then(() => {
      console.log('Incidents récupérés, initialisation de la connexion WebSocket...');
      connect();
    }).catch((error) => {
      console.error('Erreur lors de la récupération des incidents initiaux:', error);
      // Tenter de connecter le WebSocket même en cas d'échec de fetch
      connect();
    });
    
    // Listen for incident state updates via custom events
    const handleIncidentAction = (event: CustomEvent<IncidentAction>) => {
      console.log('Action incident reçue:', event.detail);
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
