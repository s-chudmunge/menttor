import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    console.error('Supabase admin client is not initialized. Check SUPABASE_SERVICE_ROLE_KEY.');
    return NextResponse.json(
      { error: 'Supabase admin client not configured.' },
      { status: 500 }
    );
  }
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    if (page < 1 || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const { data: { users: allUsers }, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // Fetch all users up to the Supabase limit
    });

    if (error) {
      throw error;
    }

    let users = allUsers.map(user => ({
      uid: user.id,
      email: user.email || '',
      displayName: user.user_metadata.full_name || '',
      emailVerified: user.email_confirmed_at !== null,
      disabled: user.aud === 'authenticated' ? false : true,
      creationTime: user.created_at,
      lastSignInTime: user.last_sign_in_at,
    }));

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        user.displayName.toLowerCase().includes(searchLower)
      );
    }

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    // Get total count for pagination info
    const totalUsers = users.length;
    const totalPages = Math.ceil(totalUsers / limit);

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
