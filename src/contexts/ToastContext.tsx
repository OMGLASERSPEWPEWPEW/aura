// src/contexts/ToastContext.tsx
// Toast notification context using Sonner

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { Toaster, toast } from 'sonner';
import { AuraError } from '../lib/errors';

interface ToastContextType {
  /**
   * Show an error toast. Accepts AuraError, Error, or string.
   */
  showError: (error: AuraError | Error | string) => void;

  /**
   * Show a success toast
   */
  showSuccess: (message: string, description?: string) => void;

  /**
   * Show an info toast
   */
  showInfo: (message: string, description?: string) => void;

  /**
   * Show a warning toast
   */
  showWarning: (message: string, description?: string) => void;

  /**
   * Show a loading toast that can be updated
   * @returns A function to update or dismiss the toast
   */
  showLoading: (message: string) => {
    success: (message: string) => void;
    error: (message: string) => void;
    dismiss: () => void;
  };

  /**
   * Dismiss all toasts
   */
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast provider component. Wrap your app with this to enable toast notifications.
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const showError = useCallback((error: AuraError | Error | string) => {
    if (error instanceof AuraError) {
      const hint = error.getHint();
      toast.error(error.getUserMessage(), {
        description: hint,
        duration: 5000,
      });
    } else if (error instanceof Error) {
      toast.error(error.message, {
        duration: 5000,
      });
    } else {
      toast.error(error, {
        duration: 5000,
      });
    }
  }, []);

  const showSuccess = useCallback((message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 3000,
    });
  }, []);

  const showInfo = useCallback((message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  }, []);

  const showWarning = useCallback((message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 4000,
    });
  }, []);

  const showLoading = useCallback((message: string) => {
    const toastId = toast.loading(message);

    return {
      success: (successMessage: string) => {
        toast.success(successMessage, { id: toastId });
      },
      error: (errorMessage: string) => {
        toast.error(errorMessage, { id: toastId });
      },
      dismiss: () => {
        toast.dismiss(toastId);
      },
    };
  }, []);

  const dismissAll = useCallback(() => {
    toast.dismiss();
  }, []);

  const value: ToastContextType = {
    showError,
    showSuccess,
    showInfo,
    showWarning,
    showLoading,
    dismissAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="bottom-center"
        richColors
        closeButton
        toastOptions={{
          // Styling to match Aura's design
          className: 'font-sans',
          duration: 4000,
        }}
      />
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { showError, showSuccess } = useToast();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       showSuccess('Saved successfully!');
 *     } catch (error) {
 *       showError(error);
 *     }
 *   };
 * }
 * ```
 */
export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Convenience hook specifically for showing error toasts.
 * Useful when you only need error handling.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const showError = useErrorToast();
 *
 *   const handleClick = async () => {
 *     const result = await fetchData();
 *     if (!result.ok) {
 *       showError(result.error);
 *     }
 *   };
 * }
 * ```
 */
export function useErrorToast(): (error: AuraError | Error | string) => void {
  const { showError } = useToast();
  return showError;
}
