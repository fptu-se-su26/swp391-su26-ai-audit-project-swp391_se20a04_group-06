import { useState, useEffect } from "react";
import { Compass, Crown, LayoutDashboard, LogOut, User, Heart } from "lucide-react";
import { Link } from "react-router-dom";

function initials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
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
}) {
  const workspacePath = (user?.role === "Admin" || user?.role === "admin") ? "/admin" : (user?.isPremium || user?.isVerified) ? "/seller" : null;
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [user]);

  return (
    <section className="profile-menu" aria-label="Tài khoản">
      {/* Header User info */}
      <div className="profile-menu__header">
        {!avatarError && (user.avatarUrl || user.avatar) ? (
          <img className="profile-menu__avatar-img" src={user.avatarUrl || user.avatar} alt={user.name} onError={() => setAvatarError(true)} />
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
        <Link className="profile-menu__item" to="/profile" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="fb-3d-icon fb-3d-icon--cyan" style={{ width: "28px", height: "28px" }}>
            <User size={15} />
          </div>
          <span>Hồ sơ cá nhân</span>
        </Link>
        {workspacePath && (
          <Link className="profile-menu__item" to={workspacePath} onClick={onClose} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="fb-3d-icon fb-3d-icon--blue" style={{ width: "28px", height: "28px" }}>
              <LayoutDashboard size={15} />
            </div>
            <span>Khu vực làm việc</span>
          </Link>
        )}
        <Link className="profile-menu__item" to="/buyer/favorites" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="fb-3d-icon fb-3d-icon--magenta" style={{ width: "28px", height: "28px" }}>
            <Heart size={15} />
          </div>
          <span>Danh sách đã lưu</span>
        </Link>
        <Link className="profile-menu__item" to="/premium" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="fb-3d-icon fb-3d-icon--gold" style={{ width: "28px", height: "28px" }}>
            <Crown size={15} />
          </div>
          <span>Gói Premium</span>
        </Link>
      </div>


      {/* Nhóm cuối: Đăng xuất */}
      <div className="profile-menu__section">
        <button
          className="profile-menu__item profile-menu__button logout"
          onClick={onLogout}
          type="button"
          style={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          <div className="fb-3d-icon fb-3d-icon--rose" style={{ width: "28px", height: "28px" }}>
            <LogOut size={15} />
          </div>
          <span>Đăng xuất</span>
        </button>
      </div>
    </section>
  );
}
