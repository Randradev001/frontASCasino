import PropTypes from 'prop-types';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authApi from 'api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const current = await authApi.getSession();
      setSession(current);
      return current;
    } catch (error) {
      if (error.response?.status !== 401) console.error('No fue posible recuperar la sesion', error);
      setSession(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const clearExpiredSession = () => setSession(null);
    window.addEventListener('casino:unauthenticated', clearExpiredSession);
    return () => window.removeEventListener('casino:unauthenticated', clearExpiredSession);
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await authApi.login(credentials);
    if (!result.requiresCompany) setSession({ ...result, authenticated: true });
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setSession(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      company: session?.company || null,
      permissions: session?.permissions || null,
      menu: session?.menu || [],
      authenticated: Boolean(session),
      loading,
      login,
      logout,
      refreshSession
    }),
    [session, loading, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = { children: PropTypes.node.isRequired };

export const useAuth = () => useContext(AuthContext);
