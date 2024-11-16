import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL! as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY! as string;

if (!supabaseUrl) {
  throw new Error('Supabase URL is missing in the environment variables.');
}

if (!supabaseAnonKey) {
  throw new Error('Supabase Anon Key is missing in the environment variables.');
}

let supabase: SupabaseClient;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('Supabase client is initialized');
} catch (error) {
  throw new Error('Supabase client initialization failed');
}

export default supabase;
