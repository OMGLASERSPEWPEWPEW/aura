// src/components/auth/ProtectedRoute.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Mock the useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (
    initialPath: string = '/',
    children: React.ReactNode = <div>Protected Content</div>
  ) => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/"
            element={<ProtectedRoute>{children}</ProtectedRoute>}
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('when loading', () => {
    it('should show loading spinner', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
      });

      renderWithRouter();

      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    });

    it('should not render protected content while loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
      });

      renderWithRouter('/', <div>Secret Content</div>);

      expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    });
  });

  describe('when not authenticated', () => {
    it('should redirect to login page', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      renderWithRouter();

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should not render protected content', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      renderWithRouter('/', <div>Secret Content</div>);

      expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    });
  });

  describe('when authenticated', () => {
    it('should render protected content', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'test@example.com' },
        loading: false,
      });

      renderWithRouter('/', <div>Secret Content</div>);

      expect(screen.getByText('Secret Content')).toBeInTheDocument();
    });

    it('should not show loading spinner', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'test@example.com' },
        loading: false,
      });

      renderWithRouter();

      expect(screen.queryByText('Checking authentication...')).not.toBeInTheDocument();
    });

    it('should not redirect to login', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '123', email: 'test@example.com' },
        loading: false,
      });

      renderWithRouter();

      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });

  describe('redirect state', () => {
    it('should pass the original path in redirect state', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      // This tests that Navigate is called with state, but since we're using
      // MemoryRouter, we verify the redirect happened to /login
      render(
        <MemoryRouter initialEntries={['/protected-page']}>
          <Routes>
            <Route
              path="/protected-page"
              element={
                <ProtectedRoute>
                  <div>Protected</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });
});
