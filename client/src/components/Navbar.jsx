import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Crown, LogIn, Menu, MessageSquare, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getNavigation, getUserRole, roleMeta } from "../config/navigation";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import NotificationDropdown from "./navigation/NotificationDropdown";
import ProfileDropdown from "./navigation/ProfileDropdown";

const navigationTourTargets = {
  "/marketplace": "nav-marketplace",
  "/community": "nav-community",
  "/recipes": "nav-recipes",
  "/boat-log": "nav-boat-log",
  "/seller": "nav-seller-dashboard",
  "/seller/boat-log": "nav-boat-log",
};

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const notifications = useSelector((state) => state.notifications.list) || [];
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const actionsRef = useRef(null);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [user]);



  const role = getUserRole(user);
  const meta = roleMeta[role];
  const navigation = getNavigation(user, location.pathname);

  const isActive = (item) => {
    if (item.exact || item.path === "/") return location.pathname === item.path;
    return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
  };

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setNotificationOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const closeDropdowns = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setProfileOpen(false);
        setNotificationOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeDropdowns);
    return () => document.removeEventListener("pointerdown", closeDropdowns);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleStartTour = () => {
    setProfileOpen(false);
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("haisan:start-tour"));
    }, 0);
  };

  return (
    <>
      <header className="app-navbar">
        <Link className="app-brand" data-tour="navbar-brand" to="/">
          <span className="app-brand__mark">HS</span>
          <span>
            <strong>HaiSan.vn</strong>
            <small>{meta.label}</small>
          </span>
        </Link>

        <nav className="app-navbar__desktop" aria-label="Điều hướng chính">
          {navigation.map((item) => {
            return (
              <Link
                className={`app-nav-link ${isActive(item) ? "is-active" : ""} ${item.highlight ? "is-highlight" : ""}`}
                data-tour={navigationTourTargets[item.path]}
                key={item.path}
                to={item.path}
              >
                <span>{item.label}</span>
                {item.highlight && <Crown className="app-nav-link__premium" size={12} />}
              </Link>
            );
          })}
        </nav>

        <div className="app-navbar__actions" ref={actionsRef}>
          {user ? (
            <>
              {(role === "buyer" || role === "seller") && (
                <Link className="navbar-icon-button navbar-chat-link" to="/chat" aria-label="Tin nhắn">
                  <MessageSquare size={20} />
                </Link>
              )}

              <div className="navbar-popover">
                <button
                  aria-expanded={notificationOpen}
                  aria-label="Thông báo"
                  className="navbar-icon-button"
                  data-tour="navbar-notifications"
                  onClick={() => {
                    setNotificationOpen((open) => !open);
                    setProfileOpen(false);
                  }}
                  type="button"
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="navbar-icon-button__badge">
                      {Math.min(notifications.length, 9)}
                    </span>
                  )}
                </button>
                {notificationOpen && (
                  <NotificationDropdown
                    notifications={notifications}
                    onClose={() => setNotificationOpen(false)}
                  />
                )}
              </div>

              <div className="navbar-popover">
                <button
                  aria-expanded={profileOpen}
                  className="navbar-profile-button"
                  data-tour="navbar-profile"
                  onClick={() => {
                    setProfileOpen((open) => !open);
                    setNotificationOpen(false);
                  }}
                  type="button"
                >
                  {!avatarError && (user.avatarUrl || user.avatar) ? (
                    <img src={user.avatarUrl || user.avatar} alt="" onError={() => setAvatarError(true)} />
                  ) : (
                    <span className="navbar-profile-button__avatar">{initials(user.name)}</span>
                  )}
                  <span className="navbar-profile-button__name">{user.name?.split(" ").at(-1)}</span>
                  <ChevronDown size={14} />
                </button>
                {profileOpen && (
                  <ProfileDropdown
                    onClose={() => setProfileOpen(false)}
                    onLogout={handleLogout}
                    onStartTour={handleStartTour}
                    role={role}
                    roleLabel={meta.label}
                    user={user}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="navbar-auth-actions">
              <Link className="button button--ghost" to="/register">Đăng ký</Link>
              <Link className="button button--primary" data-tour="navbar-login" to="/login">
                <LogIn size={16} /> Đăng nhập
              </Link>
            </div>
          )}

          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            className="navbar-icon-button app-navbar__menu-button"
            onClick={() => setMobileOpen((open) => !open)}
            type="button"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <nav className="app-navbar__mobile" aria-label="Điều hướng di động">
          {navigation.map((item) => {
            return (
              <Link className={isActive(item) ? "is-active" : ""} key={item.path} to={item.path}>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
