import { expect, test, describe, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MapPage from './page';
import { useIncidentsFiltered } from '@/hooks/useIncidentsFiltered';
import { Incident } from '@/lib/api';

// Mock the map components since Leaflet isn't available in test environment
vi.mock('next/dynamic', () => ({
  __esModule: true,
  default: (callback: Function) => {
    const Component = () => null;
    Component.displayName = 'DynamicComponent';
    return Component;
  },
}));

// Mock the useIncidentsFiltered hook
vi.mock('@/hooks/useIncidentsFiltered', () => ({
  useIncidentsFiltered: vi.fn(),
}));

// Mock Chakra UI toast
vi.mock('@chakra-ui/react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useToast: () => vi.fn(),
    useDisclosure: () => ({
      isOpen: false,
      onOpen: vi.fn(),
      onClose: vi.fn(),
    }),
  };
});

describe('MapPage', () => {
  // Create 100 mock incidents
  const createMockIncidents = (count: number, minSeverity: number = 1): Incident[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `incident-${i}`,
      title: `Test Incident ${i}`,
      description: `Description for incident ${i}`,
      severity: Math.max(minSeverity, 1 + (i % 5)), // Ensure severity is at least minSeverity
      lat: 46.227638 + (Math.random() * 2 - 1),
      lng: 2.213749 + (Math.random() * 2 - 1),
      state: ['validated_fire', 'travelling', 'onsite', 'finished'][i % 4] as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    const mockUseIncidentsFiltered = useIncidentsFiltered as vi.MockedFunction<typeof useIncidentsFiltered>;
    mockUseIncidentsFiltered.mockReturnValue({
      incidents: createMockIncidents(100),
      totalCount: 100,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  test('renders map page with incident count', () => {
    render(<MapPage />);
    
    expect(screen.getByText('Carte Globale')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filtres/i })).toBeInTheDocument();
  });

  test('applies severity filter and shows filtered incidents', async () => {
    const mockUseIncidentsFiltered = useIncidentsFiltered as vi.MockedFunction<typeof useIncidentsFiltered>;
    let refetchMock = vi.fn();
    
    // Initial render with 100 incidents
    mockUseIncidentsFiltered.mockReturnValue({
      incidents: createMockIncidents(100),
      totalCount: 100,
      isLoading: false,
      error: null,
      refetch: refetchMock,
    });
    
    const { rerender } = render(<MapPage />);
    
    // Open filters drawer (we can't actually test this fully since useDisclosure is mocked)
    const filtersButton = screen.getByRole('button', { name: /Filtres/i });
    fireEvent.click(filtersButton);
    
    // Mock the refetch to update incidents with severity filter
    mockUseIncidentsFiltered.mockReturnValue({
      incidents: createMockIncidents(20, 4), // 20 incidents with severity >= 4
      totalCount: 20,
      isLoading: false,
      error: null,
      refetch: refetchMock,
    });
    
    // Force rerender to simulate filter application
    rerender(<MapPage />);
    
    // Check that count is updated
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  test('refreshes data when refresh button is clicked', async () => {
    const mockUseIncidentsFiltered = useIncidentsFiltered as vi.MockedFunction<typeof useIncidentsFiltered>;
    const refetchMock = vi.fn();
    
    mockUseIncidentsFiltered.mockReturnValue({
      incidents: createMockIncidents(100),
      totalCount: 100,
      isLoading: false,
      error: null,
      refetch: refetchMock,
    });
    
    render(<MapPage />);
    
    // Find and click refresh button
    const refreshButton = screen.getByRole('button', { name: /Rafraîchir/i });
    fireEvent.click(refreshButton);
    
    // Verify refetch was called
    expect(refetchMock).toHaveBeenCalledTimes(1);
  });
});
