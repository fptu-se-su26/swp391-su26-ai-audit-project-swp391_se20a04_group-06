/* oxlint-disable react/only-export-components */
import React, { createContext, useState, useEffect, useContext } from "react";
import { apiAuth } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  // On app load: restore session from HttpOnly cookie via GET /api/auth/me
  // The backend returns a FLAT user object (not wrapped in { user: {...} })
  useEffect(() => {
    async function restoreSession() {
      try {
        // Result is already response.data (flat user object) due to Axios interceptor
        const data = await apiAuth.getProfile();
        if (data && data.id) {
          setUser(data);
          localStorage.setItem("haisan-user", JSON.stringify(data));
          setApiOnline(true);
        }
      } catch {
        // Cookie expired or not logged in — try localStorage fallback
        const storedUser = localStorage.getItem("haisan-user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem("haisan-user");
          }
        }
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = (userData) => {
    // userData comes from googleAuth response: { user: { ...authResult, sessionRole } }
    // The Axios interceptor returns response.data, so result = { user: {...} }
    // Login.jsx passes result.user here
    setUser(userData);
    localStorage.setItem("haisan-user", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await apiAuth.logout();
    } catch {
      // Ignore logout API errors
    }
    setUser(null);
    setApiOnline(false);
    localStorage.removeItem("haisan-user");
    localStorage.removeItem("haisan-token");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, apiOnline, setApiOnline, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
