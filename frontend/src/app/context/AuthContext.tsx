'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase/client';
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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
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
