import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Two Supabase clients, created lazily so importing this file never requires env
// to be present (the Turso read path imports it but may never call these).

// Browser / anon client. Safe for client components. Used for public reads and,
// later, auth. Honors Row Level Security.
let _browser: SupabaseClient | null = null;
export function getSupabaseBrowser(): SupabaseClient {
  if (_browser) return _browser;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  _browser = createClient(url, anonKey);
  return _browser;
}

// Admin / service client. SERVER ONLY: bypasses Row Level Security. Never import
// into client components and never expose the service role key to the browser.
let _admin: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin must only be used on the server');
  }
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  _admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
