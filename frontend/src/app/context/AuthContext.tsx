'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../lib/firebase/client';
import { api } from '../../lib/api'; // Import the API instance

interface AuthContextType {
  user: User | null;
  dbId: number | null; // Add dbId to the context type
  isAdmin: boolean; // Add admin status to the context type
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, dbId: null, isAdmin: false, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbId, setDbId] = useState<number | null>(null); // State for database ID
  const [isAdmin, setIsAdmin] = useState(false); // State for admin status
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Wait a moment for the token to be available
          await new Promise(resolve => setTimeout(resolve, 100));
          // Ensure the user has a valid token before making the API call
          const token = await firebaseUser.getIdToken(true); // force refresh
          if (token) {
            // Fetch the user's database ID using their Firebase UID
            const response = await api.get(`/auth/me`);
            setDbId(response.data.id);
            
            // Check admin status from Firebase token claims
            const tokenResult = await firebaseUser.getIdTokenResult();
            const adminClaim = tokenResult.claims.admin === true;
            setIsAdmin(adminClaim);
          } else {
            console.error("No Firebase token available");
            setDbId(null);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error fetching user's database ID:", error);
          setDbId(null); // Ensure dbId is null on error
          setIsAdmin(false);
        }
      } else {
        setDbId(null); // Clear dbId if no Firebase user
        setIsAdmin(false); // Clear admin status if no Firebase user
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, dbId, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);