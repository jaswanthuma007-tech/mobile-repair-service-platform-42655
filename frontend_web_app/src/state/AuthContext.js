import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAdminSession, signInAdmin, signOutAdmin } from '../services/authService';

const AuthContext = createContext(null);

/**
 * PUBLIC_INTERFACE
 * Hook to access auth session and actions.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/**
 * PUBLIC_INTERFACE
 * Provides admin auth session and actions.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState({ isAdminAuthed: false, email: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await getAdminSession();
      if (!cancelled && data) setSession(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const res = await signInAdmin({ email, password });
    if (res.data) setSession(res.data);
    return res;
  }, []);

  const signOut = useCallback(async () => {
    const res = await signOutAdmin();
    if (res.data) setSession(res.data);
    return res;
  }, []);

  const value = useMemo(() => ({ session, loading, signIn, signOut }), [session, loading, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
