// Patched useIncidents mock
import { useState } from 'react';
import { act } from '@testing-library/react';

// Types needed for the mock
interface IncidentEvt {
  id: number;
  lat?: number;
  lon?: number;
  confidence?: number;
  state?: string;
  createdAt?: string;
}

// Connection status type
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

// Action type for incident state updates exported for use in tests
export interface IncidentAction {
  type: string;
  payload: {
    id: number;
    state: string;
  };
}

// The hook result interface
interface HookResult {
  incidents: IncidentEvt[];
  status: ConnectionStatus;
  isLoading: boolean; 
  error: string | null;
  refetch: () => Promise<void>;
  updateIncidentState: (id: number, state: string) => void;
}

// Global store of setters for each hook instance
type StateSetter = React.Dispatch<React.SetStateAction<HookResult>>;
let stateSetters: StateSetter[] = [];

// Default state
const defaultState: HookResult = {
  incidents: [],
  status: 'connecting',
  isLoading: true,
  error: null,
  refetch: async () => {},
  updateIncidentState: () => {}
};

// Current state that will be used for new hook instances
let currentState = { ...defaultState };

// Update all hook instances
const updateAllHookInstances = (newState: Partial<HookResult>) => {
  currentState = { ...currentState, ...newState };
  
  // Use act to properly integrate with React Testing Library
  act(() => {
    // Update each hook instance with the new state
    stateSetters.forEach((setter) => {
      setter(prevState => ({ ...prevState, ...newState }));
    });
  });
  
  console.log('[Mock] State updated to:', newState, 'Current full state:', currentState);
};

// Create a WebSocket mock
export const createWebSocket = jest.fn().mockImplementation((url: string) => {
  console.log('[Mock] createWebSocket called with URL:', url);
  return {
    url,
    readyState: 0,
    send: jest.fn(),
    close: jest.fn(),
    onopen: null,
    onclose: null,
    onmessage: null,
    onerror: null
  };
});

// Mock methods that update all hook instances
export const mockIncidents = {
  simulateOpen: jest.fn().mockImplementation(() => {
    console.log('[Mock] simulateOpen called');
    updateAllHookInstances({
      status: 'connected'
    });
  }),
  
  simulateClose: jest.fn().mockImplementation(() => {
    console.log('[Mock] simulateClose called');
    updateAllHookInstances({
      status: 'disconnected'
    });
  }),
  
  simulateMessage: jest.fn().mockImplementation((incident: any) => {
    console.log('[Mock] simulateMessage called with incident:', incident);
    // Add new incident to beginning of array and limit to 100
    // Map any 'status' property to 'state' for compatibility
    const formattedIncident: IncidentEvt = {
      id: incident.id,
      lat: incident.lat || incident.latitude,
      lon: incident.lon || incident.longitude,
      confidence: incident.confidence,
      state: incident.state || incident.status,
      createdAt: incident.createdAt || new Date().toISOString()
    };
    
    const newIncidents = [formattedIncident, ...currentState.incidents].slice(0, 100);
    updateAllHookInstances({ incidents: newIncidents });
  }),
  
  completeLoading: jest.fn().mockImplementation(() => {
    console.log('[Mock] completeLoading called');
    updateAllHookInstances({ isLoading: false });
  }),
  
  resetState: jest.fn().mockImplementation(() => {
    console.log('[Mock] resetState called');
    // When using single object spread, we ensure we get a new object reference
    updateAllHookInstances({ ...defaultState });
  })
};

// Mock global fetch for REST API simulation
global.fetch = jest.fn().mockImplementation(() => {
  console.log('[Mock] Global fetch called');
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
  });
});

// Clean up before each test
beforeEach(() => {
  console.log('[Mock] beforeEach called - cleaning up');
  stateSetters = [];
  currentState = { ...defaultState };
});

// The actual hook implementation
export function useIncidents(options = {}) {
  console.log('[Mock] useIncidents called with options:', options);
  
  // Create state and getter/setter
  const [state, setState] = useState<HookResult>({
    ...currentState,
    refetch: async () => {
      console.log('[Mock] refetch called');
      mockIncidents.completeLoading();
      return Promise.resolve();
    },
    updateIncidentState: (id: number, state: string) => {
      console.log('[Mock] updateIncidentState called:', id, state);
      const updatedIncidents = currentState.incidents.map(inc => 
        inc.id === id ? { ...inc, state } : inc
      );
      updateAllHookInstances({ incidents: updatedIncidents });
    }
  });
  
  // Register this setter for updates if not already registered
  if (!stateSetters.includes(setState)) {
    stateSetters.push(setState);
    console.log('[Mock] Registered new state setter, total:', stateSetters.length);
  }
  
  return state;
}

export default useIncidents;
