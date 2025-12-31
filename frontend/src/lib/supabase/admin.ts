import { createClient, AuthError } from "@supabase/supabase-js";

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

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
    from: () => ({} as any), // Simplified mock: returns an 'any' type to bypass complex type checking
    auth: {} as any // Simplified mock for 'auth'
  };
}

export { supabaseAdmin };
