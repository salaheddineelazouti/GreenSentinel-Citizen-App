import { render, screen } from '@testing-library/react';
import IncidentsPage from './IncidentsPage';
import { useIncidents } from '../hooks/useIncidents';

// Mock du hook useIncidents
jest.mock('../hooks/useIncidents');

describe('IncidentsPage', () => {
  beforeEach(() => {
    // Reset tous les mocks avant chaque test
    jest.clearAllMocks();
  });

  test('affiche un loader quand en connexion sans incidents', () => {
    // Mock du hook pour simuler la connexion
    (useIncidents as jest.Mock).mockReturnValue({
      incidents: [],
      status: 'connecting',
      reconnect: jest.fn(),
    });

    render(<IncidentsPage />);
    
    // Vérifie que le loader est affiché
    expect(screen.getByText('Connexion au serveur d\'incidents...')).toBeInTheDocument();
  });

  test('affiche un message quand déconnecté sans incidents', () => {
    // Mock du hook pour simuler la déconnexion
    (useIncidents as jest.Mock).mockReturnValue({
      incidents: [],
      status: 'disconnected',
      reconnect: jest.fn(),
    });

    render(<IncidentsPage />);
    
    // Vérifie que le message de déconnexion est affiché
    expect(screen.getByText('Impossible de se connecter au serveur d\'incidents')).toBeInTheDocument();
    expect(screen.getByText('Réessayer')).toBeInTheDocument();
  });

  test('affiche un message quand connecté sans incidents', () => {
    // Mock du hook pour simuler la connexion sans incidents
    (useIncidents as jest.Mock).mockReturnValue({
      incidents: [],
      status: 'connected',
      reconnect: jest.fn(),
    });

    render(<IncidentsPage />);
    
    // Vérifie que le message d'absence d'incidents est affiché
    expect(screen.getByText('Aucun incident pour le moment')).toBeInTheDocument();
  });

  test('affiche les incidents quand il y en a', () => {
    // Mock data pour simuler des incidents
    const mockIncidents = [
      {
        id: 1,
        lat: 48.8566,
        lon: 2.3522,
        createdAt: '2025-06-18T12:00:00Z',
        confidence: 0.85
      },
      {
        id: 2,
        lat: 45.7640,
        lon: 4.8357,
        createdAt: '2025-06-18T12:30:00Z',
        confidence: 0.75
      }
    ];

    // Mock du hook pour simuler des incidents
    (useIncidents as jest.Mock).mockReturnValue({
      incidents: mockIncidents,
      status: 'connected',
      reconnect: jest.fn(),
    });

    render(<IncidentsPage />);
    
    // Vérifie que les incidents sont affichés
    expect(screen.getByText('Incident #1')).toBeInTheDocument();
    expect(screen.getByText('Incident #2')).toBeInTheDocument();
  });
});
