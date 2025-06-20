import axiosInstance from './axiosInstance';
import type { IncidentEvt } from '../hooks/useIncidents';

// Type pour les états des incidents
export type IncidentState = 'travelling' | 'onsite' | 'finished';

/**
 * Récupérer les détails d'un incident spécifique
 */
export const getIncident = async (id: number): Promise<IncidentEvt> => {
  const response = await axiosInstance.get(`/api/v1/incidents/${id}`);
  return response.data;
};

/**
 * Mettre à jour l'état d'un incident
 */
export const patchState = async (id: number, state: IncidentState) => {
  return axiosInstance.patch(`/api/v1/incidents/${id}`, { state });
};
