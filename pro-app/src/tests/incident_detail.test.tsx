import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Import the mock IncidentDetailPage component and its mockPatchState
import IncidentDetailPage, { mockPatchState } from './__mocks__/IncidentDetailPage';

// Mock console.error to avoid cluttering test output
const originalConsoleError = console.error;
console.error = jest.fn();

describe('IncidentDetailPage', () => {
  afterAll(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    (console.error as jest.Mock).mockClear();
    mockPatchState.mockClear();
    mockPatchState.mockResolvedValue({});
  });
  
  test('renders incident detail page with correct incident information', async () => {
    render(
      <MemoryRouter initialEntries={['/incident/1']}>
        <Routes>
          <Route path="/incident/:id" element={<IncidentDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Check for incident ID in the title
    expect(screen.getByText(/Détails de l'incident #1/)).toBeInTheDocument();

    // Check for map container
    expect(screen.getByTestId('map-container')).toBeInTheDocument();

    // Check location information is displayed
    expect(screen.getByText(/48.8566, 2.3522/)).toBeInTheDocument();

    // Check incident description is displayed with confidence level
    expect(screen.getByText(/Détection d'incendie/)).toBeInTheDocument();
    expect(screen.getByText(/01\/04\/2023 12:00/)).toBeInTheDocument();
    expect(screen.getByText(/85%/)).toBeInTheDocument();

    // Check that state buttons are present
    expect(screen.getByText('En route')).toBeInTheDocument();
    expect(screen.getByText('Sur place')).toBeInTheDocument();
    expect(screen.getByText('Terminé')).toBeInTheDocument();
  });

  test('clicking "En route" button updates incident state', async () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/incident/1']}>
        <Routes>
          <Route path="/incident/:id" element={<IncidentDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Click the "En route" button
    fireEvent.click(screen.getByTestId('state-button-travelling'));

    // Check that patchState was called with correct parameters
    await waitFor(() => {
      expect(mockPatchState).toHaveBeenCalledWith(1, 'travelling');
    });

    // Setup event dispatch test
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
    dispatchEventSpy.mockClear();
    
    // Force a rerender to ensure state changes are reflected
    rerender(
      <MemoryRouter initialEntries={['/incident/1']}>
        <Routes>
          <Route path="/incident/:id" element={<IncidentDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Now the travelling button should be disabled
    expect(screen.getByTestId('state-button-travelling')).toBeDisabled();
    
    // Click on "Sur place" button to trigger another event
    fireEvent.click(screen.getByTestId('state-button-onsite'));
    
    // Verify the event was dispatched
    expect(dispatchEventSpy).toHaveBeenCalled();
    dispatchEventSpy.mockRestore();
    
    // Force another rerender
    rerender(
      <MemoryRouter initialEntries={['/incident/1']}>
        <Routes>
          <Route path="/incident/:id" element={<IncidentDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Now the onsite button should be disabled
    expect(screen.getByTestId('state-button-onsite')).toBeDisabled();
    
    // Ensure other button remains enabled
    expect(screen.getByTestId('state-button-finished')).not.toBeDisabled();
  });

  test('clicking "Terminé" button updates incident state', async () => {
    render(
      <MemoryRouter initialEntries={['/incident/1']}>
        <Routes>
          <Route path="/incident/:id" element={<IncidentDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Click on 'Terminé' state button
    fireEvent.click(screen.getByTestId('state-button-finished'));

    // Check that patchState was called with correct parameters
    expect(mockPatchState).toHaveBeenCalledWith(1, 'finished');
    
    // Wait for state to update in component
    
    // Check that UI shows the updated state (finished button should be disabled)
    await waitFor(() => {
      expect(screen.getByTestId('state-button-finished')).toBeDisabled();
    });
  });
  
  test('handles error when API request fails', async () => {
    // Set up error response for this test only
    mockPatchState.mockRejectedValueOnce(new Error('API Error'));
    
    // Ensure console.error is clean
    (console.error as jest.Mock).mockClear();
    
    render(
      <MemoryRouter initialEntries={['/incident/1']}>
        <Routes>
          <Route path="/incident/:id" element={<IncidentDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Click the button that should trigger the error
    fireEvent.click(screen.getByTestId('state-button-travelling'));
    
    // Wait for the promise rejection to be handled
    await waitFor(() => {
      expect(console.error as jest.Mock).toHaveBeenCalled();
    });
    
    // Verify the button was clicked and patchState was called
    expect(mockPatchState).toHaveBeenCalledWith(1, 'travelling');
  });
});
