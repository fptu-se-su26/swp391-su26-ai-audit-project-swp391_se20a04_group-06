import { Navigate, useLocation } from "react-router-dom";
import { getUserRole } from "../config/navigation";
import { useAuth } from "../context/AuthContext";

export function RequireAuth({ children }) {
  const { loading, user } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-state">Đang kiểm tra phiên đăng nhập...</div>;
  if (!user) {
    return (
      <Navigate
        replace
        state={{ from: location.pathname, message: "Bạn cần đăng nhập để tiếp tục." }}
        to="/login"
      />
    );
  }
  return children;
}

export function RequireRole({ children, roles }) {
  const { loading, user } = useAuth();
  if (loading) return <div className="page-state">Đang kiểm tra quyền truy cập...</div>;
  if (!user) return <Navigate replace to="/login" />;
  
  const userRoles = ["buyer"];
  if (user.role === "Admin" || user.role === "admin") {
    userRoles.push("admin", "seller");
  }
  if (user.isPremium || user.isVerified) {
    userRoles.push("seller");
  }

  const hasRequiredRole = roles.some((role) => userRoles.includes(role));
  if (!hasRequiredRole) return <Navigate replace to="/" />;
  
  return children;
}
