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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        new URL('/auth/signin?error=authentication_failed', requestUrl.origin)
      );
    }
  }

  // URL to redirect to after sign in process completes
  // This will trigger the useEffect in signin/page.tsx to check user status and redirect appropriately
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
