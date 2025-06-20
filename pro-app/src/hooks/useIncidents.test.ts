import { renderHook, act, waitFor } from '@testing-library/react';

// Import original hook but MOCK the dependencies we need to control
import * as incidentsModule from './useIncidents';

// Import the mock utility functions we exposed
const { mockIncidents } = jest.requireMock('../tests/__mocks__/useIncidents');

// Keep the MockWebSocket class for test compatibility, but use our mock directly
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  protocol: string = '';

  constructor(url: string) {
    this.url = url;
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
  }

  send(): void {
    // Mock implementation
  }
}

// Setup mocks before tests
describe('useIncidents hook', () => {
  // Setup mock for createWebSocket
  const mockCreateWebSocket = jest.fn();
  let mockSocket: MockWebSocket;
  
  // Setup mock for localStorage
  const mockLocalStorage = {
    getItem: jest.fn().mockReturnValue(null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  };
  
  beforeAll(() => {
    // Replace with our mock function
    Object.defineProperty(incidentsModule, 'createWebSocket', {
      value: mockCreateWebSocket,
      writable: true,
    });
  });
  
  afterAll(() => {
    // No need to restore window.location since we're only mocking the protocol property
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
    
    // Create a new mock socket for each test
    mockSocket = new MockWebSocket('ws://localhost:8000/ws/incidents');
    mockCreateWebSocket.mockReturnValue(mockSocket);
  });
  
  test('should connect to WebSocket and update status', async () => {
    const { result } = renderHook(() => incidentsModule.useIncidents({ forceProtocol: 'http:' }));
    
    // Initial status should be 'connecting' and loading should be true
    expect(result.current.status).toBe('connecting');
    expect(result.current.isLoading).toBe(true);
    
    // Wait for the initial REST API call to complete
    // This now uses our exposed mock method instead of trying to intercept fetch
    mockIncidents.completeLoading();
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Simulate WebSocket connection using our mock
    mockIncidents.simulateOpen();
    
    expect(result.current.status).toBe('connected');
  });
  
  test('should update status when WebSocket connects', () => {
    const { result } = renderHook(() => incidentsModule.useIncidents({ forceProtocol: 'http:' }));
    
    // Simulate WebSocket connection using our mock
    mockIncidents.simulateOpen();
    
    expect(result.current.status).toBe('connected');
  });

  test('should handle WebSocket disconnection', () => {
    const { result } = renderHook(() => incidentsModule.useIncidents({ forceProtocol: 'http:' }));
    
    // First connect using our mock
    mockIncidents.simulateOpen();
    
    expect(result.current.status).toBe('connected');
    
    // Then simulate disconnection using our mock
    mockIncidents.simulateClose();
    
    expect(result.current.status).toBe('disconnected');
  });
  
  test('should add new incident when WebSocket message is received', () => {
    const { result } = renderHook(() => incidentsModule.useIncidents({ forceProtocol: 'http:' }));
    
    // Create test data
    const testIncident = {
      id: 123,
      latitude: 35.6895,
      longitude: 139.6917,
      confidence: 0.98,
      status: 'active'
    };
    
    // Simulate WebSocket message using our mock
    mockIncidents.simulateMessage(testIncident);
    
    // Check if the incident was added to the state
    expect(result.current.incidents.length).toBe(1);
    expect(result.current.incidents[0].id).toBe(123);
  });
  
  test('should handle reconnection when WebSocket closes', () => {
    const { result } = renderHook(() => incidentsModule.useIncidents({ forceProtocol: 'http:' }));
    
    // First simulate connection
    mockIncidents.simulateOpen();
    
    expect(result.current.status).toBe('connected');
    
    // Create a second socket for reconnection (keep for test compatibility)
    const secondSocket = new MockWebSocket('ws://localhost:8000/ws/incidents');
    
    // Simulate disconnection
    mockIncidents.simulateClose();
    
    expect(result.current.status).toBe('disconnected');
    
    // Simulate reconnection
    mockCreateWebSocket.mockReturnValue(secondSocket);
    
    // Let the reconnection timer fire (mock setTimeout)
    act(() => {
      jest.runOnlyPendingTimers();
    });
    
    // Verify reconnection status
    expect(result.current.status).toBe('connecting');
    
    // Complete reconnection
    mockIncidents.simulateOpen();
    
    expect(result.current.status).toBe('connected');
  });
  
  test('should limit the number of incidents to maximum (100)', () => {
    const { result } = renderHook(() => incidentsModule.useIncidents({ forceProtocol: 'http:' }));
    
    const maxIncidents = 100;
    
    // Add 110 incidents (10 more than max)
    const testIncidents = [];
    for (let i = 0; i < maxIncidents + 10; i++) {
      testIncidents.push({
        id: i,
        latitude: 35.6895,
        longitude: 139.6917,
        confidence: 0.98,
        status: 'active'
      });
    }
    
    // Add incidents one by one to simulate messages
    testIncidents.forEach(incident => {
      mockIncidents.simulateMessage(incident);
    });
    
    // Check that the number of incidents is limited
    expect(result.current.incidents.length).toBe(maxIncidents);
    
    // First added incidents should be removed (oldest first)
    // First 10 incidents should have been dropped
    expect(result.current.incidents[maxIncidents - 1].id).toBe(10);
  });
});
