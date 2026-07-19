/* oxlint-disable react/only-export-components */
import React, { createContext, useEffect, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setUser, setLoading, clearUser } from "../store/slices/authSlice";
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
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);
  const dispatch = useDispatch();
  const apiOnline = true;

  useEffect(() => {
    async function restoreSession() {
      try {
        const data = await apiAuth.getProfile();
        if (data && data.id) {
          const normalized = normalizeUser(data);
          dispatch(setUser(normalized));
          localStorage.setItem("haisan-user", JSON.stringify(normalized));
        }
      } catch {
        dispatch(clearUser());
        localStorage.removeItem("haisan-user");
        localStorage.removeItem("haisan-token");
      } finally {
        dispatch(setLoading(false));
      }
    }
    restoreSession();
  }, [dispatch]);

  useEffect(() => {
    const clearExpiredSession = () => {
      dispatch(clearUser());
      localStorage.removeItem("haisan-user");
      localStorage.removeItem("haisan-token");
    };

    const handleStorageChange = (event) => {
      if (event.key === "haisan-token" && !event.newValue) {
        dispatch(clearUser());
      }
    };

    window.addEventListener("haisan:session-expired", clearExpiredSession);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("haisan:session-expired", clearExpiredSession);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [dispatch]);

  const login = (userData) => {
    const normalized = normalizeUser(userData);
    dispatch(setUser(normalized));
    localStorage.setItem("haisan-user", JSON.stringify(normalized));
  };

  const logout = async () => {
    try {
      await apiAuth.logout();
    } catch {}
    dispatch(clearUser());
    localStorage.removeItem("haisan-user");
    localStorage.removeItem("haisan-token");
  };

  const handleSetUser = (userData) => {
    const normalized = normalizeUser(userData);
    dispatch(setUser(normalized));
  };

  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser, login, logout, apiOnline, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
