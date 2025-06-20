import { useEffect, useState, useCallback, useRef } from 'react';
import { getIncident, patchState } from '../api/incidentsApi';
import type { IncidentState } from '../api/incidentsApi';
import type { IncidentEvt, IncidentAction } from './useIncidents';
import { createWebSocket } from './useIncidents';

const useIncident = (id: number) => {
  const [incident, setIncident] = useState<IncidentEvt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  // Fetch incident details
  const fetchIncident = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getIncident(id);
      setIncident(data);
    } catch (err) {
      console.error('Error fetching incident:', err);
      setError('Erreur lors du chargement de l\'incident');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Update incident state
  const updateState = useCallback(async (state: IncidentState) => {
    if (!incident) return;
    
    // Optimistic update
    setIncident(prev => prev ? { ...prev, state } : null);
    
    // Dispatch action to update incident in the global list (optimistic)
    if (typeof window !== 'undefined') {
      const action: IncidentAction = {
        type: 'UPDATE_STATE',
        payload: {
          id,
          state
        }
      };
      
      window.dispatchEvent(new CustomEvent('incident:action', { detail: action }));
    }
    
    try {
      await patchState(id, state);
      // No need to refetch as our optimistic update is already applied
      // and any websocket updates will come through if needed
    } catch (err) {
      console.error('Error updating incident state:', err);
      
      // Revert optimistic update on error
      setError('Erreur lors de la mise à jour de l\'état');
      fetchIncident(); // Revert by refetching the correct state
      
      // Show a toast notification - This would be integrated with your toast system
      if (typeof window !== 'undefined') {
        // Dispatch a custom event for toast notification
        window.dispatchEvent(new CustomEvent('toast:error', { 
          detail: { message: 'Échec de la mise à jour de l\'état de l\'incident' }
        }));
      }
    }
  }, [id, incident, fetchIncident]);

  // Subscribe to WebSocket updates for this specific incident
  useEffect(() => {
    const connectWebSocket = () => {
      // Close existing connection if any
      if (ws.current) {
        ws.current.close();
      }

      // Récupérer l'hôte API depuis les variables d'environnement ou localStorage
      const apiHost = localStorage.getItem('apiHost') || import.meta.env.VITE_API_HOST || 'localhost:8000';
      // Determine protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${apiHost}/ws/incident/${id}`;
      
      const socket = createWebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log(`WebSocket connected for incident #${id}`);
      };
      
      socket.onmessage = (event) => {
        try {
          const updatedIncident = JSON.parse(event.data) as IncidentEvt;
          setIncident(updatedIncident);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socket.onclose = () => {
        console.log(`WebSocket disconnected for incident #${id}`);
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        socket.close();
      };
      
      ws.current = socket;
    };

    // Initial fetch
    fetchIncident();
    
    // Connect to WebSocket for real-time updates
    connectWebSocket();
    
    // Clean up on component unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [id, fetchIncident]);

  return {
    incident,
    isLoading,
    error,
    updateState,
    refetch: fetchIncident
  };
};

export default useIncident;
