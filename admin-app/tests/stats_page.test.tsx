import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import StatsPage from '../app/dashboard/stats/page';
import * as useStatsModule from '../hooks/useStats';

// Mock the useStats hook
vi.mock('../hooks/useStats', () => ({
  useStats: vi.fn()
}));

// Mock fixture data
const mockStatsData = {
  daily: [
    { date: '2025-06-01', count: 12 },
    { date: '2025-06-02', count: 15 },
    { date: '2025-06-03', count: 10 }
  ],
  responseTimes: [
    { bucket: '0-15', avg: 8.4 },
    { bucket: '15-30', avg: 22.5 },
    { bucket: '30-60', avg: 45.2 }
  ],
  byType: [
    { type: 'fire', count: 97 },
    { type: 'flood', count: 45 },
    { type: 'chemical', count: 23 }
  ]
};

describe('StatsPage', () => {
  // Setup mock for useStats hook
  const mockSetDays = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    vi.mocked(useStatsModule.useStats).mockReturnValue({
      data: mockStatsData,
      error: null,
      isLoading: false,
      days: 30,
      setDays: mockSetDays,
      refetch: vi.fn()
    });
  });
  
  it('renders all three charts when data is available', async () => {
    render(
      <ChakraProvider>
        <StatsPage />
      </ChakraProvider>
    );
    
    // Check for chart headings
    expect(screen.getByText('Incidents par jour')).toBeInTheDocument();
    expect(screen.getByText('Temps de réponse moyen')).toBeInTheDocument();
    expect(screen.getByText('Répartition par type')).toBeInTheDocument();
    
    // Charts should be rendered (we can look for SVG elements)
    // This is an indirect way to check if Recharts is rendering charts
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });
  
  it('shows loading spinner when data is loading', () => {
    // Mock loading state
    vi.mocked(useStatsModule.useStats).mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
      days: 30,
      setDays: mockSetDays,
      refetch: vi.fn()
    });
    
    render(
      <ChakraProvider>
        <StatsPage />
      </ChakraProvider>
    );
    
    expect(screen.getByRole('status')).toBeInTheDocument(); // Spinner has role="status"
  });
  
  it('shows error alert when there is an error', () => {
    // Mock error state
    vi.mocked(useStatsModule.useStats).mockReturnValue({
      data: null,
      error: new Error('Test error'),
      isLoading: false,
      days: 30,
      setDays: mockSetDays,
      refetch: vi.fn()
    });
    
    render(
      <ChakraProvider>
        <StatsPage />
      </ChakraProvider>
    );
    
    expect(screen.getByText('Erreur de chargement des statistiques')).toBeInTheDocument();
  });
  
  it('changes period when selecting a different option', async () => {
    render(
      <ChakraProvider>
        <StatsPage />
      </ChakraProvider>
    );
    
    // Find the select element and change its value to 90 days
    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: '90' } });
    
    // Check if the setDays function was called with the new value
    await waitFor(() => {
      expect(mockSetDays).toHaveBeenCalledWith(90);
    });
  });
});
