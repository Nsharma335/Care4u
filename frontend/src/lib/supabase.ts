import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[supabase.ts] Initializing Supabase client...');
console.log('[supabase.ts] Supabase URL:', supabaseUrl);
console.log('[supabase.ts] Anon Key present:', !!supabaseAnonKey);
console.log('[supabase.ts] Anon Key length:', supabaseAnonKey?.length);

// Check localStorage
try {
  const storageKey = `sb-${supabaseUrl?.split('//')[1]?.split('.')[0]}-auth-token`;
  const storedSession = localStorage.getItem(storageKey);
  console.log('[supabase.ts] Storage key:', storageKey);
  console.log('[supabase.ts] Stored session exists:', !!storedSession);
} catch (error) {
  console.error('[supabase.ts] Error checking localStorage:', error);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[supabase.ts] Missing Supabase environment variables!');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    storageKey: 'care4u-auth',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // We handle this manually now
  },
});

console.log('[supabase.ts] Supabase client created successfully');

