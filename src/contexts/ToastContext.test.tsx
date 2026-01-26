// src/contexts/ToastContext.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { toast } from 'sonner';
import { ToastProvider, useToast, useErrorToast } from './ToastContext';
import { ApiError } from '../lib/errors';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(() => 'toast-id-123'),
    dismiss: vi.fn(),
  },
  Toaster: () => null, // Mock Toaster component
}));

describe('ToastContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== ToastProvider ====================
  describe('ToastProvider', () => {
    it('should provide toast context to children', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      expect(result.current).toBeDefined();
      expect(result.current.showError).toBeDefined();
      expect(result.current.showSuccess).toBeDefined();
      expect(result.current.showInfo).toBeDefined();
      expect(result.current.showWarning).toBeDefined();
      expect(result.current.showLoading).toBeDefined();
      expect(result.current.dismissAll).toBeDefined();
    });
  });

  // ==================== useToast ====================
  describe('useToast', () => {
    it('should throw when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useToast());
      }).toThrow('useToast must be used within a ToastProvider');

      consoleSpy.mockRestore();
    });

    it('should return all toast functions', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      expect(typeof result.current.showError).toBe('function');
      expect(typeof result.current.showSuccess).toBe('function');
      expect(typeof result.current.showInfo).toBe('function');
      expect(typeof result.current.showWarning).toBe('function');
      expect(typeof result.current.showLoading).toBe('function');
      expect(typeof result.current.dismissAll).toBe('function');
    });
  });

  // ==================== useErrorToast ====================
  describe('useErrorToast', () => {
    it('should return showError function', () => {
      const { result } = renderHook(() => useErrorToast(), {
        wrapper: ToastProvider,
      });

      expect(typeof result.current).toBe('function');
    });

    it('should call showError when invoked', () => {
      const { result } = renderHook(() => useErrorToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current('Test error');
      });

      expect(toast.error).toHaveBeenCalledWith('Test error', {
        duration: 5000,
      });
    });
  });

  // ==================== showError ====================
  describe('showError', () => {
    it('should handle AuraError with getUserMessage', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      const auraError = new ApiError('Internal error', { statusCode: 500 });

      act(() => {
        result.current.showError(auraError);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'The server is temporarily unavailable. Please try again.',
        expect.objectContaining({
          duration: 5000,
        })
      );
    });

    it('should handle AuraError with hint', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      const auraError = new ApiError('Rate limited', { statusCode: 429 });

      act(() => {
        result.current.showError(auraError);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Too many requests. Please wait a moment and try again.',
        expect.objectContaining({
          description: 'Wait a few seconds before retrying',
          duration: 5000,
        })
      );
    });

    it('should handle regular Error', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      const error = new Error('Something went wrong');

      act(() => {
        result.current.showError(error);
      });

      expect(toast.error).toHaveBeenCalledWith('Something went wrong', {
        duration: 5000,
      });
    });

    it('should handle string message', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.showError('Simple error message');
      });

      expect(toast.error).toHaveBeenCalledWith('Simple error message', {
        duration: 5000,
      });
    });

    it('should handle AuraError without hint', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      // ApiError with 500 has no hint
      const auraError = new ApiError('Server error', { statusCode: 500 });

      act(() => {
        result.current.showError(auraError);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'The server is temporarily unavailable. Please try again.',
        expect.objectContaining({
          description: undefined,
        })
      );
    });
  });

  // ==================== showSuccess ====================
  describe('showSuccess', () => {
    it('should show success toast with message', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.showSuccess('Operation completed');
      });

      expect(toast.success).toHaveBeenCalledWith('Operation completed', {
        description: undefined,
        duration: 3000,
      });
    });

    it('should include optional description', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.showSuccess('Profile saved', 'All changes have been synced');
      });

      expect(toast.success).toHaveBeenCalledWith('Profile saved', {
        description: 'All changes have been synced',
        duration: 3000,
      });
    });
  });

  // ==================== showInfo ====================
  describe('showInfo', () => {
    it('should show info toast with message', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.showInfo('Did you know?');
      });

      expect(toast.info).toHaveBeenCalledWith('Did you know?', {
        description: undefined,
        duration: 4000,
      });
    });

    it('should include optional description', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.showInfo('Tip', 'You can swipe to dismiss');
      });

      expect(toast.info).toHaveBeenCalledWith('Tip', {
        description: 'You can swipe to dismiss',
        duration: 4000,
      });
    });
  });

  // ==================== showWarning ====================
  describe('showWarning', () => {
    it('should show warning toast with message', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.showWarning('Careful!');
      });

      expect(toast.warning).toHaveBeenCalledWith('Careful!', {
        description: undefined,
        duration: 4000,
      });
    });

    it('should include optional description', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.showWarning('Low storage', 'Consider deleting old profiles');
      });

      expect(toast.warning).toHaveBeenCalledWith('Low storage', {
        description: 'Consider deleting old profiles',
        duration: 4000,
      });
    });
  });

  // ==================== showLoading ====================
  describe('showLoading', () => {
    it('should return control object', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      let loadingControl: ReturnType<typeof result.current.showLoading>;

      act(() => {
        loadingControl = result.current.showLoading('Loading...');
      });

      expect(loadingControl!).toBeDefined();
      expect(typeof loadingControl!.success).toBe('function');
      expect(typeof loadingControl!.error).toBe('function');
      expect(typeof loadingControl!.dismiss).toBe('function');
    });

    it('should call toast.loading', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.showLoading('Saving...');
      });

      expect(toast.loading).toHaveBeenCalledWith('Saving...');
    });

    it('should allow converting to success', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      let loadingControl: ReturnType<typeof result.current.showLoading>;

      act(() => {
        loadingControl = result.current.showLoading('Saving...');
      });

      act(() => {
        loadingControl!.success('Saved!');
      });

      expect(toast.success).toHaveBeenCalledWith('Saved!', { id: 'toast-id-123' });
    });

    it('should allow converting to error', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      let loadingControl: ReturnType<typeof result.current.showLoading>;

      act(() => {
        loadingControl = result.current.showLoading('Saving...');
      });

      act(() => {
        loadingControl!.error('Save failed');
      });

      expect(toast.error).toHaveBeenCalledWith('Save failed', { id: 'toast-id-123' });
    });

    it('should allow dismissing', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      let loadingControl: ReturnType<typeof result.current.showLoading>;

      act(() => {
        loadingControl = result.current.showLoading('Loading...');
      });

      act(() => {
        loadingControl!.dismiss();
      });

      expect(toast.dismiss).toHaveBeenCalledWith('toast-id-123');
    });
  });

  // ==================== dismissAll ====================
  describe('dismissAll', () => {
    it('should call toast.dismiss without arguments', () => {
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });

      act(() => {
        result.current.dismissAll();
      });

      expect(toast.dismiss).toHaveBeenCalledWith();
    });
  });
});
