import { createClient, SupabaseClient } from '@supabase/supabase-js';

// This is a server-side only file.
// Do not import this file on the client.

let supabaseAdmin: SupabaseClient;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} else {
  console.warn('Supabase admin configuration is missing. Admin operations will be disabled.');
  // Create a mock client to avoid errors during build
  supabaseAdmin = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
    }),
    auth: {
      admin: {
        listUsers: () => Promise.resolve({ data: { users: [] }, error: new Error('Supabase admin not configured') })
      }
    },
  } as unknown as SupabaseClient;
}

export { supabaseAdmin };
