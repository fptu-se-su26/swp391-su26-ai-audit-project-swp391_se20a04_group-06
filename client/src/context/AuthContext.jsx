/* oxlint-disable react/only-export-components */
import React, { createContext, useState, useEffect, useContext } from "react";
import { apiAuth } from "../services/api";

const AuthContext = createContext();

function normalizeUser(userData) {
  if (!userData) return null;
  return {
    ...userData,
    id: userData.id || userData._id || userData.userId,
    avatar: userData.avatar || userData.avatarUrl || null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiOnline = true;

  useEffect(() => {
    async function restoreSession() {
      try {
        const data = await apiAuth.getProfile();
        if (data && data.id) {
          const normalized = normalizeUser(data);
          setUser(normalized);
          localStorage.setItem("haisan-user", JSON.stringify(normalized));
        }
      } catch {
        setUser(null);
        localStorage.removeItem("haisan-user");
        localStorage.removeItem("haisan-token");
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  useEffect(() => {
    const clearExpiredSession = () => {
      setUser(null);
      localStorage.removeItem("haisan-user");
      localStorage.removeItem("haisan-token");
    };
    window.addEventListener("haisan:session-expired", clearExpiredSession);
    return () =>
      window.removeEventListener("haisan:session-expired", clearExpiredSession);
  }, []);

  const login = (userData) => {
    const normalized = normalizeUser(userData);
    setUser(normalized);
    localStorage.setItem("haisan-user", JSON.stringify(normalized));
  };

  const logout = async () => {
    try {
      await apiAuth.logout();
    } catch {}
    setUser(null);
    localStorage.removeItem("haisan-user");
    localStorage.removeItem("haisan-token");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, apiOnline, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
