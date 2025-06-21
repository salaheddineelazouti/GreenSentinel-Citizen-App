import { expect, test, describe, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';
import * as auth from '@/lib/auth';

// Mock the auth library
vi.mock('@/lib/auth', () => ({
  login: vi.fn(),
}));

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

// Mock useToast
vi.mock('@chakra-ui/react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useToast: () => {
      return vi.fn();
    },
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('submits form with credentials', async () => {
    const mockLogin = auth.login as vi.MockedFunction<typeof auth.login>;
    mockLogin.mockResolvedValueOnce({ success: true });

    render(<LoginPage />);
    
    // Fill in credentials
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'admin@greensentinel.dev' } 
    });
    fireEvent.change(screen.getByLabelText(/password/i), { 
      target: { value: 'password123' } 
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify login was called with correct credentials
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@greensentinel.dev',
        password: 'password123',
      });
    });
  });

  test('shows error on failed login', async () => {
    const mockLogin = auth.login as vi.MockedFunction<typeof auth.login>;
    mockLogin.mockResolvedValueOnce({
      success: false,
      message: 'Invalid credentials',
    });

    render(<LoginPage />);
    
    // Fill in credentials
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'wrong@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/password/i), { 
      target: { value: 'wrongpassword' } 
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Verify login was called
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });
});
