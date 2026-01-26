// src/components/errors/ErrorBoundary.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorFallback, FullPageError, SectionError, ComponentError } from './ErrorFallback';
import { ApiError, NetworkError } from '../../lib/errors';

// Mock the error export utility
vi.mock('../../lib/utils/errorExport', () => ({
  saveErrorToFile: vi.fn(),
}));

// Component that throws an error for testing
function ThrowingComponent({ error }: { error: Error }) {
  throw error;
}

// Component that works normally
function WorkingComponent() {
  return <div data-testid="working">Working!</div>;
}

describe('ErrorFallback', () => {
  const mockResetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== Message extraction ====================
  describe('message extraction', () => {
    it('should use getUserMessage for AuraError', () => {
      const auraError = new ApiError('Internal error', { statusCode: 500 });
      render(
        <FullPageError
          error={auraError}
          resetError={mockResetError}
          level="page"
        />
      );

      expect(screen.getByText('The server is temporarily unavailable. Please try again.')).toBeInTheDocument();
    });

    it('should use message for regular Error', () => {
      const regularError = new Error('Regular error message');
      render(
        <SectionError
          error={regularError}
          resetError={mockResetError}
          level="section"
        />
      );

      expect(screen.getByText('This section failed to load')).toBeInTheDocument();
    });

    it('should handle error with hint', () => {
      const errorWithHint = new NetworkError();
      render(
        <FullPageError
          error={errorWithHint}
          resetError={mockResetError}
          level="page"
        />
      );

      expect(screen.getByText('Unable to connect. Please check your internet connection.')).toBeInTheDocument();
      expect(screen.getByText('Check your Wi-Fi or mobile data connection')).toBeInTheDocument();
    });
  });

  // ==================== FullPageError ====================
  describe('FullPageError', () => {
    it('should render error message', () => {
      const error = new Error('Page error');
      render(
        <FullPageError
          error={error}
          resetError={mockResetError}
          level="page"
        />
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should render hint when provided', () => {
      const error = new ApiError('Rate limited', { statusCode: 429 });
      render(
        <FullPageError
          error={error}
          resetError={mockResetError}
          level="page"
        />
      );

      expect(screen.getByText('Wait a few seconds before retrying')).toBeInTheDocument();
    });

    it('should call resetError on Try Again click', () => {
      const error = new Error('Test error');
      render(
        <FullPageError
          error={error}
          resetError={mockResetError}
          level="page"
        />
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);

      expect(mockResetError).toHaveBeenCalledTimes(1);
    });

    it('should have Go Home button', () => {
      const error = new Error('Test error');
      render(
        <FullPageError
          error={error}
          resetError={mockResetError}
          level="page"
        />
      );

      const goHomeButton = screen.getByRole('button', { name: /go home/i });
      expect(goHomeButton).toBeInTheDocument();
    });

    it('should show technical details in collapsible section', () => {
      const error = new Error('Technical error details');
      render(
        <FullPageError
          error={error}
          resetError={mockResetError}
          level="page"
        />
      );

      const details = screen.getByText('Technical Details');
      expect(details).toBeInTheDocument();
    });

    it('should not show Try Again button when resetError is undefined', () => {
      const error = new Error('Test error');
      render(
        <FullPageError
          error={error}
          level="page"
        />
      );

      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });
  });

  // ==================== SectionError ====================
  describe('SectionError', () => {
    it('should render compact error display', () => {
      const error = new Error('Section error');
      render(
        <SectionError
          error={error}
          resetError={mockResetError}
          level="section"
        />
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show retry button when resetError provided', () => {
      const error = new Error('Test error');
      render(
        <SectionError
          error={error}
          resetError={mockResetError}
          level="section"
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockResetError).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button when resetError is undefined', () => {
      const error = new Error('Test error');
      render(
        <SectionError
          error={error}
          level="section"
        />
      );

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('should use AuraError getUserMessage', () => {
      const error = new NetworkError();
      render(
        <SectionError
          error={error}
          level="section"
        />
      );

      expect(screen.getByText('Unable to connect. Please check your internet connection.')).toBeInTheDocument();
    });
  });

  // ==================== ComponentError ====================
  describe('ComponentError', () => {
    it('should render inline error', () => {
      const error = new Error('Component error');
      render(
        <ComponentError
          error={error}
          resetError={mockResetError}
          level="component"
        />
      );

      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });

    it('should show retry button when resetError provided', () => {
      const error = new Error('Test error');
      render(
        <ComponentError
          error={error}
          resetError={mockResetError}
          level="component"
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockResetError).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button when resetError is undefined', () => {
      const error = new Error('Test error');
      render(
        <ComponentError
          error={error}
          level="component"
        />
      );

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('should use AuraError getUserMessage', () => {
      const error = new ApiError('API failed', { statusCode: 503 });
      render(
        <ComponentError
          error={error}
          level="component"
        />
      );

      expect(screen.getByText('The server is temporarily unavailable. Please try again.')).toBeInTheDocument();
    });
  });

  // ==================== ErrorFallback (router) ====================
  describe('ErrorFallback routing', () => {
    it('should render FullPageError for page level', () => {
      const error = new Error('Test');
      render(
        <ErrorFallback
          error={error}
          resetError={mockResetError}
          level="page"
        />
      );

      // FullPageError has specific elements like "Go Home" button
      expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
    });

    it('should render SectionError for section level', () => {
      const error = new Error('Test');
      render(
        <ErrorFallback
          error={error}
          resetError={mockResetError}
          level="section"
        />
      );

      // SectionError has "Retry" button, not "Go Home"
      expect(screen.queryByRole('button', { name: /go home/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should render ComponentError for component level', () => {
      const error = new Error('Test');
      render(
        <ErrorFallback
          error={error}
          resetError={mockResetError}
          level="component"
        />
      );

      // ComponentError is inline/compact
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });
});

describe('ErrorBoundary', () => {
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for cleaner test output (React logs errors)
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('working')).toBeInTheDocument();
  });

  it('should catch errors and render fallback', () => {
    const testError = new Error('Test error');

    render(
      <ErrorBoundary level="section">
        <ThrowingComponent error={testError} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should call onError callback', () => {
    const testError = new Error('Test error');

    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowingComponent error={testError} />
      </ErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalledWith(
      testError,
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should reset error state on resetError call', () => {
    // Use a component that can toggle between throwing and working
    let shouldThrow = true;
    const testError = new Error('Resettable error');

    function ConditionalThrow() {
      if (shouldThrow) {
        throw testError;
      }
      return <div data-testid="working">Working!</div>;
    }

    render(
      <ErrorBoundary level="section">
        <ConditionalThrow />
      </ErrorBoundary>
    );

    // Error should be showing
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change the condition so it won't throw on retry
    shouldThrow = false;

    // Click retry button to reset
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    // Now the working component should be showing
    expect(screen.getByTestId('working')).toBeInTheDocument();
  });

  it('should use custom fallback when provided as ReactNode', () => {
    const testError = new Error('Test error');

    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error UI</div>}>
        <ThrowingComponent error={testError} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });

  it('should pass error to fallback function', () => {
    const testError = new Error('Function fallback error');

    render(
      <ErrorBoundary
        fallback={({ error, resetError }) => (
          <div data-testid="fn-fallback">
            <span>Error: {error.message}</span>
            <button onClick={resetError}>Reset</button>
          </div>
        )}
      >
        <ThrowingComponent error={testError} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('fn-fallback')).toBeInTheDocument();
    expect(screen.getByText('Error: Function fallback error')).toBeInTheDocument();
  });

  it('should use section level by default', () => {
    const testError = new Error('Test error');

    render(
      <ErrorBoundary>
        <ThrowingComponent error={testError} />
      </ErrorBoundary>
    );

    // SectionError renders "Retry" button, FullPageError renders "Go Home"
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /go home/i })).not.toBeInTheDocument();
  });

  it('should render page-level fallback when level is page', () => {
    const testError = new Error('Page error');

    render(
      <ErrorBoundary level="page">
        <ThrowingComponent error={testError} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
  });

  it('should render component-level fallback when level is component', () => {
    const testError = new Error('Component error');

    render(
      <ErrorBoundary level="component">
        <ThrowingComponent error={testError} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('should handle AuraError properly', () => {
    const auraError = new ApiError('API failed', { statusCode: 429 });

    render(
      <ErrorBoundary level="page">
        <ThrowingComponent error={auraError} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Too many requests. Please wait a moment and try again.')).toBeInTheDocument();
    expect(screen.getByText('Wait a few seconds before retrying')).toBeInTheDocument();
  });

  it('should include componentName in error info', () => {
    const testError = new Error('Named component error');

    render(
      <ErrorBoundary componentName="MyTestComponent" onError={mockOnError}>
        <ThrowingComponent error={testError} />
      </ErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalled();
  });
});
