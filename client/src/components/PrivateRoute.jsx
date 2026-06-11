import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * PrivateRoute — chỉ cho phép user đã đăng nhập
 *
 * @example
 *   <Route path="/dashboard" element={
 *     <PrivateRoute><DashboardPage /></PrivateRoute>
 *   } />
 */
export function PrivateRoute({ children, redirectTo = "/dang-nhap" }) {
  const { user, loading } = useAuth();

  // Chờ session restore trước khi quyết định redirect
  if (loading) return null;

  if (!user) return <Navigate to={redirectTo} replace />;

  return children;
}

/**
 * AdminRoute — chỉ cho phép user có role "Admin"
 *
 * @example
 *   <Route path="/admin" element={
 *     <AdminRoute><AdminPage /></AdminRoute>
 *   } />
 */
export function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || user.role !== "Admin") {
    return <Navigate to="/dang-nhap" replace />;
  }

  return children;
}

/**
 * GuestRoute — chỉ cho phép user CHƯA đăng nhập (vd: trang login)
 *
 * @example
 *   <Route path="/dang-nhap" element={
 *     <GuestRoute><AuthPage /></GuestRoute>
 *   } />
 */
export function GuestRoute({ children, redirectTo = "/" }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) return <Navigate to={redirectTo} replace />;

  return children;
}
