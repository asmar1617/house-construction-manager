import { createContext, useContext, useEffect, useState } from 'react';

const TOKEN_KEY = 'construction_token';
const USER_KEY = 'construction_user';

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  // On mount, hydrate from localStorage
  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    const u = localStorage.getItem(USER_KEY);
    setToken(t || null);
    try {
      setUser(u ? JSON.parse(u) : null);
    } catch {
      setUser(null);
    }
  }, []);

  // When we have a token, sync user (role) from server so admin status is always correct
  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) return;
    const apiUrl = process.env.REACT_APP_API_URL || '/api';
    fetch(apiUrl + '/auth/me/', {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((res) => {
        if (res.ok) return res.json();
        if (res.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        }
        return null;
      })
      .then((data) => {
        if (data && data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, [token]);

  const login = (newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    if (newUser) localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser || null);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;
  const isViewer = user && user.role === 'viewer';
  const isAdmin = user && (user.role === 'admin' || user.is_superuser);

  const value = { token, user, isAuthenticated, isViewer, isAdmin, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export default useAuth;
export { TOKEN_KEY, USER_KEY, AuthProvider };
