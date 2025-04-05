
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if the environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase URL and Anon Key are required. Make sure to set the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables."
  );
}

// Create a supabase client with error handling
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};
