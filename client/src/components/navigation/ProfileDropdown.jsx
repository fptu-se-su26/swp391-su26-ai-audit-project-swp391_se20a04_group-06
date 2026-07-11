import { Compass, Crown, LayoutDashboard, LogOut, Moon, Sun, User } from "lucide-react";
import { Link } from "react-router-dom";

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProfileDropdown({
  user,
  role,
  roleLabel,
  onClose,
  onLogout,
  onStartTour,
  theme = "dark",
  onThemeChange,
}) {
  const workspacePath = role === "seller" ? "/seller" : role === "admin" ? "/admin" : null;

  return (
    <section className="profile-menu" aria-label="Tài khoản">
      {/* Header User info */}
      <div className="profile-menu__header">
        {user.avatarUrl || user.avatar ? (
          <img className="profile-menu__avatar-img" src={user.avatarUrl || user.avatar} alt={user.name} />
        ) : (
          <div className="profile-menu__avatar">{initials(user.name)}</div>
        )}
        <div className="profile-menu__meta">
          <strong className="profile-menu__name">{user.name}</strong>
          <span className="profile-menu__email">{user.email}</span>
          <span className="role-badge">{roleLabel}{user.isPremium ? " · Premium" : ""}</span>
        </div>
      </div>

      {/* Nhóm tài khoản */}
      <div className="profile-menu__section">
        <Link className="profile-menu__item" to="/profile" onClick={onClose}>
          <User size={16} /> <span>Hồ sơ</span>
        </Link>
        {workspacePath && (
          <Link className="profile-menu__item" to={workspacePath} onClick={onClose}>
            <LayoutDashboard size={16} /> <span>Khu vực làm việc</span>
          </Link>
        )}
        <Link className="profile-menu__item" to="/premium" onClick={onClose}>
          <Crown size={16} /> <span>Premium</span>
        </Link>
      </div>

      {/* Nhóm giao diện & trợ giúp */}
      <div className="profile-menu__section">
        <div className="theme-switcher">
          <span className="theme-switcher__label">Giao diện</span>
          <div className="theme-switcher__options">
            <button
              type="button"
              className={`theme-option ${theme === "dark" ? "active" : ""}`}
              onClick={() => onThemeChange("dark")}
              aria-label="Giao diện tối"
            >
              <Moon size={14} /> Tối
            </button>
            <button
              type="button"
              className={`theme-option ${theme === "light" ? "active" : ""}`}
              onClick={() => onThemeChange("light")}
              aria-label="Giao diện sáng"
            >
              <Sun size={14} /> Sáng
            </button>
          </div>
        </div>
        <button
          className="profile-menu__item profile-menu__button"
          onClick={onStartTour}
          type="button"
        >
          <Compass size={16} /> <span>Hướng dẫn nhanh</span>
        </button>
      </div>

      {/* Nhóm cuối: Đăng xuất */}
      <div className="profile-menu__section">
        <button
          className="profile-menu__item profile-menu__button logout"
          onClick={onLogout}
          type="button"
        >
          <LogOut size={16} /> <span>Đăng xuất</span>
        </button>
      </div>
    </section>
  );
}
