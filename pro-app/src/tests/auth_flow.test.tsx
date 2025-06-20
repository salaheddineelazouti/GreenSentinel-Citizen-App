import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import App from '../App';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the service worker registration
jest.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: false,
    updateServiceWorker: jest.fn(),
  }),
}));

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(_url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  send(_data: string) {
    // Mock send implementation
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).WebSocket = MockWebSocket;

// Helper function to render App with providers
const renderApp = () => {
  return render(<App />);
};

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset axios mocks
    jest.clearAllMocks();
  });

  test('should redirect to login when not authenticated', async () => {
    renderApp();

    // Should redirect to login page
    await waitFor(() => {
      expect(screen.getByText('Connexion')).toBeInTheDocument();
    });
  });

  test('should login successfully and redirect to incidents', async () => {
    // Mock successful login response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjk5OTk5OTk5OTl9.fake-signature'
      }
    });

    // Mock incidents API response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        incidents: []
      }
    });

    renderApp();

    // Wait for login page to load
    await waitFor(() => {
      expect(screen.getByText('Connexion')).toBeInTheDocument();
    });

    // Fill in login form
    const emailInput = screen.getByPlaceholderText('Adresse email');
    const passwordInput = screen.getByPlaceholderText('Mot de passe');
    const loginButton = screen.getByText('Se connecter');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // Should redirect to incidents page after successful login
    await waitFor(() => {
      expect(screen.getByText(/incidents/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify token was stored
    expect(localStorage.getItem('access_token')).toBeTruthy();
  });

  test('should show error message on login failure', async () => {
    // Mock failed login response
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 401 }
    });

    renderApp();

    // Wait for login page to load
    await waitFor(() => {
      expect(screen.getByText('Connexion')).toBeInTheDocument();
    });

    // Fill in login form with invalid credentials
    const emailInput = screen.getByPlaceholderText('Adresse email');
    const passwordInput = screen.getByPlaceholderText('Mot de passe');
    const loginButton = screen.getByText('Se connecter');

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Email ou mot de passe incorrect/i)).toBeInTheDocument();
    });

    // Should still be on login page
    expect(screen.getByText('Connexion')).toBeInTheDocument();
  });

  test('should logout and redirect to login', async () => {
    // Set up authenticated state
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjk5OTk5OTk5OTl9.fake-signature';
    localStorage.setItem('access_token', mockToken);

    // Mock incidents API response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        incidents: []
      }
    });

    renderApp();

    // Should be on incidents page since we're authenticated
    await waitFor(() => {
      expect(screen.getByText(/incidents/i)).toBeInTheDocument();
    });

    // Find and click logout button (this would be in the Navbar)
    const logoutButton = screen.getByRole('button', { name: /déconnexion|logout/i });
    fireEvent.click(logoutButton);

    // Should redirect to login page
    await waitFor(() => {
      expect(screen.getByText('Connexion')).toBeInTheDocument();
    });

    // Token should be removed
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  test('should handle expired token', async () => {
    // Set up expired token
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjEwMDAwMDB9.fake-signature';
    localStorage.setItem('access_token', expiredToken);

    renderApp();

    // Should redirect to login page due to expired token
    await waitFor(() => {
      expect(screen.getByText('Connexion')).toBeInTheDocument();
    });

    // Token should be removed
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  test('should validate email format', async () => {
    renderApp();

    // Wait for login page to load
    await waitFor(() => {
      expect(screen.getByText('Connexion')).toBeInTheDocument();
    });

    // Fill in invalid email
    const emailInput = screen.getByPlaceholderText('Adresse email');
    const passwordInput = screen.getByPlaceholderText('Mot de passe');
    const loginButton = screen.getByText('Se connecter');

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/Veuillez entrer une adresse email valide/i)).toBeInTheDocument();
    });
  });
});
