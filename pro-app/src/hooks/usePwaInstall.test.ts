import { renderHook, act } from '@testing-library/react';
import { usePwaInstall } from './usePwaInstall';

describe('usePwaInstall hook', () => {
  // Mock BeforeInstallPromptEvent
  class MockBeforeInstallPromptEvent extends Event {
    prompt: jest.Mock;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    
    constructor(outcome: 'accepted' | 'dismissed' = 'accepted') {
      super('beforeinstallprompt');
      this.prompt = jest.fn();
      this.userChoice = Promise.resolve({ outcome });
    }
  }

  // Spy sur window.matchMedia pour simuler l'état standalone
  const mockMatchMedia = jest.fn();

  beforeEach(() => {
    // Reset des mocks
    jest.clearAllMocks();
    
    // Mock pour navigator.standalone (iOS)
    Object.defineProperty(window.navigator, 'standalone', {
      writable: true,
      value: false
    });
    
    // Mock pour window.matchMedia (PWA installée)
    window.matchMedia = mockMatchMedia;
    mockMatchMedia.mockReturnValue({
      matches: false
    });
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => usePwaInstall());
    
    expect(result.current.canInstall).toBe(false);
    expect(result.current.isInstalled).toBe(false);
    expect(typeof result.current.installApp).toBe('function');
  });

  test('should detect if app is already installed (display-mode: standalone)', () => {
    // Simuler que l'app est installée via media query
    mockMatchMedia.mockReturnValue({
      matches: true
    });
    
    const { result } = renderHook(() => usePwaInstall());
    
    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  test('should detect if app is already installed (navigator.standalone)', () => {
    // Simuler que l'app est installée via navigator.standalone (iOS)
    Object.defineProperty(window.navigator, 'standalone', {
      value: true
    });
    
    const { result } = renderHook(() => usePwaInstall());
    
    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  test('should handle beforeinstallprompt event', () => {
    const { result } = renderHook(() => usePwaInstall());
    
    // Initialement, on ne peut pas installer
    expect(result.current.canInstall).toBe(false);
    
    // Simuler l'événement beforeinstallprompt
    const mockEvent = new MockBeforeInstallPromptEvent();
    act(() => {
      window.dispatchEvent(mockEvent);
    });
    
    // Maintenant on peut installer
    expect(result.current.canInstall).toBe(true);
  });

  test('should handle installApp function', async () => {
    // Créer un mock event
    const mockEvent = new MockBeforeInstallPromptEvent('accepted');
    
    const { result } = renderHook(() => usePwaInstall());
    
    // Simuler l'événement beforeinstallprompt
    act(() => {
      window.dispatchEvent(mockEvent);
    });
    
    // Appeler la fonction d'installation
    await act(async () => {
      await result.current.installApp();
    });
    
    // Vérifier que prompt() a été appelé
    expect(mockEvent.prompt).toHaveBeenCalled();
    
    // Après installation, canInstall devrait être false
    expect(result.current.canInstall).toBe(false);
  });

  test('should handle user dismissing the install prompt', async () => {
    // Créer un mock event avec refus
    const mockEvent = new MockBeforeInstallPromptEvent('dismissed');
    
    const { result } = renderHook(() => usePwaInstall());
    
    // Simuler l'événement beforeinstallprompt
    act(() => {
      window.dispatchEvent(mockEvent);
    });
    
    // Appeler la fonction d'installation
    await act(async () => {
      await result.current.installApp();
    });
    
    // Vérifier que prompt() a été appelé
    expect(mockEvent.prompt).toHaveBeenCalled();
    
    // canInstall devrait rester true car l'utilisateur a refusé
    expect(result.current.canInstall).toBe(true);
  });
});
