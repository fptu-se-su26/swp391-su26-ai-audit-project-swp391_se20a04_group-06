import { Crown, LayoutDashboard, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProfileDropdown({ user, role, roleLabel, onClose, onLogout }) {
  const workspacePath = role === "seller" ? "/seller" : role === "admin" ? "/admin" : null;

  return (
    <section className="nav-dropdown profile-dropdown" aria-label="Tài khoản">
      <header className="profile-dropdown__identity">
        <strong>{user.name}</strong>
        <span>{user.email}</span>
        <small>{roleLabel}{user.isPremium ? " · Premium" : ""}</small>
      </header>

      <Link to="/profile" onClick={onClose}>
        <User size={16} /> Hồ sơ
      </Link>
      {workspacePath && (
        <Link to={workspacePath} onClick={onClose}>
          <LayoutDashboard size={16} /> Khu vực làm việc
        </Link>
      )}
      <Link to="/premium" onClick={onClose}>
        <Crown size={16} /> Premium
      </Link>
      <button type="button" className="profile-dropdown__logout" onClick={onLogout}>
        <LogOut size={16} /> Đăng xuất
      </button>
    </section>
  );
}
