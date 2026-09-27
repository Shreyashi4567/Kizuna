import { createClient } from '@supabase/supabase-js';

export const isServerSupabaseConfigured = Boolean(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '') &&
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '') &&
  !(process.env.NEXT_PUBLIC_SUPABASE_URL || '').includes('placeholder')
);

export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

  if (!url || !key || url.includes('placeholder')) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
