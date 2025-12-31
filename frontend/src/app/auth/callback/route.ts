import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // If there's an error from the OAuth provider, redirect to sign-in with error
  if (error) {
    console.error('OAuth error:', error, error_description);
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    );
  }

  // If we have a code, exchange it for a session
  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Allow undefined
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Allow undefined

    // Explicitly check for environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase URL or Anon Key is missing for auth callback.');
      return NextResponse.redirect(
        new URL('/auth/signin?error=supabase_configuration_missing', requestUrl.origin)
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code); // Renamed error variable
      if (sessionError) throw sessionError;
    } catch (sessionError) { // Catch the renamed error variable
      console.error('Error exchanging code for session:', sessionError);
      return NextResponse.redirect(
        new URL('/auth/signin?error=authentication_failed', requestUrl.origin)
      );
    }
  }

  // URL to redirect to after sign in process completes
  // This will trigger the useEffect in signin/page.tsx to check user status and redirect appropriately
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}