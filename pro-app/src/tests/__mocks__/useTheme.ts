// Mock pour le hook useTheme
export function useTheme() {
  return {
    theme: 'light',
    setTheme: jest.fn(),
    toggleTheme: jest.fn()
  };
}
