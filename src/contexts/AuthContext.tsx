// src/contexts/AuthContext.tsx
// Authentication context providing auth state and methods throughout the app

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';
import { clearAllLocalData } from '../lib/sync';
import type { User, Session, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithApple: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Link Supabase user to local IndexedDB UserIdentity
  const linkUserToIdentity = useCallback(async (authUser: User) => {
    try {
      const existingIdentity = await db.userIdentity.get(1);

      if (existingIdentity) {
        // Update existing identity with auth info
        await db.userIdentity.update(1, {
          supabaseUserId: authUser.id,
          email: authUser.email,
          authProvider: authUser.app_metadata.provider || 'email',
          linkedAt: new Date(),
          lastUpdated: new Date(),
        });
      } else {
        // Create new identity with auth info
        await db.userIdentity.add({
          id: 1,
          supabaseUserId: authUser.id,
          email: authUser.email,
          authProvider: authUser.app_metadata.provider || 'email',
          linkedAt: new Date(),
          dataExports: [],
          textInputs: [],
          photos: [],
          manualEntry: {},
          lastUpdated: new Date(),
        });
      }
    } catch (err) {
      console.error('Failed to link user to identity:', err);
    }
  }, []);

  // Initialize auth state and listen for changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      // Link user to local identity if logged in
      if (initialSession?.user) {
        linkUserToIdentity(initialSession.user);
      }

      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Link user to local identity on sign in
        if (event === 'SIGNED_IN' && currentSession?.user) {
          await linkUserToIdentity(currentSession.user);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [linkUserToIdentity]);

  const signIn = async (email: string, password: string) => {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError);
    }
    return { error: signInError };
  };

  const signUp = async (email: string, password: string) => {
    setError(null);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) {
      setError(signUpError);
    }
    return { error: signUpError };
  };

  const signOut = async () => {
    setError(null);
    try {
      // Clear all local data before signing out
      await clearAllLocalData();
    } catch (err) {
      console.error('Failed to clear local data:', err);
    }
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (googleError) {
      setError(googleError);
    }
    return { error: googleError };
  };

  const signInWithApple = async () => {
    setError(null);
    const { error: appleError } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (appleError) {
      setError(appleError);
    }
    return { error: appleError };
  };

  const resetPassword = async (email: string) => {
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) {
      setError(resetError);
    }
    return { error: resetError };
  };

  const updatePassword = async (newPassword: string) => {
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateError) {
      setError(updateError);
    }
    return { error: updateError };
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithApple,
    resetPassword,
    updatePassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
