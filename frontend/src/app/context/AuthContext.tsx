'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../lib/supabase/client'; // Changed import
import { api } from '../../lib/api';

interface AuthContextType {
  user: User | null;
  dbId: number | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, dbId: null, isAdmin: false, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbId, setDbId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient(); // Call the function

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setLoading(false);
      }
    }).catch(error => { // Added catch for initial session fetch
      console.error('Error getting initial Supabase session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    let subscription: { unsubscribe: () => void };
    try {
      const {
        data: { subscription: authSubscription }, // Renamed to avoid conflict
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserData(session.user);
        } else {
          setDbId(null);
          setIsAdmin(false);
          setLoading(false);
        }
      });
      subscription = authSubscription;
    } catch (error) {
      console.warn('Supabase auth state change listener could not be set up:', error);
      // Provide a no-op unsubscribe if setup failed
      subscription = { unsubscribe: () => {} };
    }


    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (supabaseUser: User) => {
    try {
      // Fetch the user's database ID using the API
      const response = await api.get('/auth/me');
      setDbId(response.data.id);

      // Check admin status from user metadata or backend
      const adminStatus = supabaseUser.user_metadata?.admin === true || response.data.is_admin === true;
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error("Error fetching user's database ID:", error);
      setDbId(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, dbId, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);