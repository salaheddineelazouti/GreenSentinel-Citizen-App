/** @jsxImportSource react */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { tokensApi } from '../api/tokensApi';
import { useNotifications } from '../hooks/useNotifications';
import { registerFCM } from '../firebase/registerFCM';

// Mocking modules
jest.mock('../api/tokensApi', () => ({
  tokensApi: {
    postToken: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../firebase/registerFCM', () => ({
  registerFCM: jest.fn().mockImplementation(() => Promise.resolve(true)),
  isFCMRegistered: jest.fn().mockResolvedValue(false),
  unregisterFCM: jest.fn().mockResolvedValue(true),
}));

jest.mock('firebase/messaging', () => ({
  getToken: jest.fn().mockResolvedValue('mock-firebase-token-abc123'),
}));

jest.mock('../firebase/idbStorage', () => ({
  idbStorage: {
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  },
  STORAGE_KEYS: {
    FCM_TOKEN: 'fcm_token',
    NOTIFICATIONS_ENABLED: 'notifications_enabled',
  },
}));

// Test component to expose the useNotifications hook
const TestComponent = () => {
  const { enabled, loading, permission, requestEnable, disable } = useNotifications();

  return (
    <div>
      <div data-testid="notification-status">
        {loading ? 'Loading' : enabled ? 'Enabled' : 'Disabled'}
      </div>
      <div data-testid="permission-status">{permission}</div>
      <button
        data-testid="toggle-notifications"
        onClick={enabled ? disable : requestEnable}
        disabled={loading}
      >
        {enabled ? 'Disable' : 'Enable'} Notifications
      </button>
    </div>
  );
};

describe('Notifications functionality', () => {
  // Save original Notification API
  const originalNotification = global.Notification;

  beforeEach(() => {
    // Mock Notification API
    global.Notification = {
      requestPermission: jest.fn().mockResolvedValue('granted'),
      permission: 'default',
    } as unknown as typeof Notification;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock registerFCM to simulate successful registration
    jest.mocked(registerFCM).mockResolvedValue(true);
  });

  afterEach(() => {
    // Restore original Notification API
    global.Notification = originalNotification;
  });

  it('should show notifications as disabled initially', async () => {
    render(<TestComponent />);
    
    // Initially should show as disabled after loading completes
    await waitFor(() => {
      expect(screen.queryByText('Loading')).toBeNull();
      expect(screen.getByTestId('notification-status')).toHaveTextContent('Disabled');
    });
  });

  it('should request permission and register token when enabling notifications', async () => {
    // Mock implementation of registerFCM to actually call tokensApi.postToken
    jest.mocked(registerFCM).mockImplementationOnce(async () => {
      await tokensApi.postToken('mock-firebase-token-abc123');
      return true;
    });
    
    render(<TestComponent />);
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading')).toBeNull();
    });
    
    // Click to enable notifications
    fireEvent.click(screen.getByTestId('toggle-notifications'));
    
    // Should call registerFCM
    expect(registerFCM).toHaveBeenCalledTimes(1);
    
    // Wait for status to update to enabled after registration completes
    await waitFor(() => {
      expect(screen.getByTestId('notification-status')).toHaveTextContent('Enabled');
      // And verify tokensApi.postToken was called
      expect(tokensApi.postToken).toHaveBeenCalledWith('mock-firebase-token-abc123');
    });
  });

  it('should not enable notifications if permission is denied', async () => {
    // Mock permission denied
    jest.mocked(registerFCM).mockResolvedValueOnce(false);
    Object.defineProperty(global.Notification, 'permission', {
      writable: false,
      value: 'denied'
    });
    
    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading')).toBeNull();
    });
    
    // Try to enable notifications
    fireEvent.click(screen.getByTestId('toggle-notifications'));
    
    // Wait and verify still disabled
    await waitFor(() => {
      expect(screen.getByTestId('notification-status')).toHaveTextContent('Disabled');
    });
  });
});
