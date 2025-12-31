import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin'; // Updated import

export async function GET(request: NextRequest) {
  // Get the Supabase admin client. It will be the real client if configured, or a throwing mock.
  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdminClient();
  } catch (error) {
    console.error('Failed to get Supabase admin client:', error);
    return NextResponse.json(
      { error: 'Supabase admin client not available. Check environment variables.' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || '';

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters. Page must be >= 1, Limit must be between 1 and 100.' },
        { status: 400 }
      );
    }

    // Fetch users using Supabase's admin listUsers API directly
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ // Use the obtained client
      page: page,
      perPage: limit,
    });

    if (error) {
      console.error('Supabase error fetching users:', error);
      return NextResponse.json(
        { error: `Failed to fetch users from Supabase: ${error.message}` },
        { status: 500 }
      );
    }

    let users = data.users || [];
    
    // In-memory filtering if search term is provided.
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.user_metadata?.full_name && user.user_metadata.full_name.toLowerCase().includes(searchLower)) ||
        (user.user_metadata?.display_name && user.user_metadata.display_name.toLowerCase().includes(searchLower))
      );
    }

    // Map user data to a cleaner format for the API response
    const formattedUsers = users.map(user => ({
      uid: user.id,
      email: user.email || '',
      displayName: user.user_metadata?.full_name || user.user_metadata?.display_name || '',
      emailVerified: user.email_confirmed_at !== null,
      disabled: user.aud === 'authenticated' ? false : true,
      creationTime: user.created_at,
      lastSignInTime: user.last_sign_in_at,
    }));

    const totalUsers = data.total || formattedUsers.length;
    const totalPages = Math.ceil(totalUsers / limit);

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        currentPage: page,
        perPage: limit,
        totalUsers: totalUsers,
        totalPages: totalPages, 
        hasNextPage: (page * limit) < totalUsers,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Unhandled error fetching users in API route:', error);
    // Explicitly check if the error is from the disabled mock client
    if (error instanceof Error && error.message.includes("Supabase admin operation") && error.message.includes("is disabled")) {
      return NextResponse.json(
        { error: 'Supabase admin operations are disabled. Check environment variables.' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error while fetching users.' },
      { status: 500 }
    );
  }
}