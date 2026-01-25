// src/lib/supabase.ts
// Supabase client for authentication

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
});

/**
 * Get the current user's access token for API calls
 * Returns null if not authenticated
 */
export async function getAccessToken(): Promise<string | null> {
  console.log('getAccessToken: Fetching session...');
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('getAccessToken: Error fetching session:', error);
    return null;
  }
  console.log('getAccessToken: Session exists:', !!session, 'User:', session?.user?.email);
  return session?.access_token ?? null;
}

/**
 * Check if user is currently authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
}
