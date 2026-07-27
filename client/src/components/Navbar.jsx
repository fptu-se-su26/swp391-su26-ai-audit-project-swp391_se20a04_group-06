import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Crown, LogIn, Menu, MessageSquare, X, Search, LayoutGrid } from "lucide-react";
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
      <header className="app-navbar fb-header-sticky">
        {/* Left Section: Brand Logo + Facebook Search Input */}
        <div className="fb-header-left">
          <Link className="app-brand" data-tour="navbar-brand" to="/" aria-label="Trang chủ HaiSan.vn">
            <img className="app-brand__logo-img" src="/logo-icon.png" alt="HaiSan.vn" />
          </Link>
          <div className="fb-header-search">
            <Search size={16} className="fb-search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm trên HaiSan"
              className="fb-search-input"
              onClick={() => navigate("/")}
            />
          </div>
        </div>

        {/* Center Section: Facebook Navigation Icons (28px prominent bold) */}
        <nav className="app-navbar__desktop fb-nav-tabs" aria-label="Điều hướng chính">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                className={`app-nav-link fb-tab-link ${active ? "is-active" : ""}`}
                data-tour={navigationTourTargets[item.path]}
                key={item.path}
                to={item.path}
                title={item.label}
                aria-label={item.label}
              >
                <div className="fb-tab-icon-wrapper">
                  {Icon && (
                    <Icon
                      size={28}
                      fill={active ? "#0866ff" : "none"}
                      color={active ? "#0866ff" : "#65676b"}
                      strokeWidth={active ? 2.6 : 2.4}
                      className="fb-tab-icon"
                    />
                  )}
                  {item.highlight && <Crown className="app-nav-link__premium" size={12} />}
                </div>
                {active && <div className="fb-tab-indicator" />}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Facebook Circular Buttons (Messenger, Notification, Avatar) */}
        <div className="app-navbar__actions fb-actions" ref={actionsRef}>
          {user ? (
            <>
              {/* Messenger Button (Official Facebook Messenger Bolt Logo - 24px) */}
              {(role === "buyer" || role === "seller") && (
                <Link 
                  className="fb-circle-btn navbar-chat-link" 
                  to="/chat" 
                  aria-label="Tin nhắn"
                  title="Tin nhắn"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#050505">
                    <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.516 3.734 7.208V22l3.418-1.876c.9.25 1.855.385 2.848.385 5.523 0 10-4.145 10-9.251C22 6.145 17.523 2 12 2zm1.06 12.336l-2.618-2.793-5.11 2.793 5.62-5.962 2.686 2.793 5.042-2.793-5.62 5.962z"/>
                  </svg>
                </Link>
              )}

              {/* Notification Bell Button (Official Facebook Solid Bell - 24px) */}
              <div className="navbar-popover">
                <button
                  aria-expanded={notificationOpen}
                  aria-label="Thông báo"
                  className="fb-circle-btn"
                  data-tour="navbar-notifications"
                  onClick={() => {
                    setNotificationOpen((open) => !open);
                    setProfileOpen(false);
                  }}
                  type="button"
                  title="Thông báo"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#050505">
                    <path d="M12 2a6 6 0 00-5.942 5.257c-.12 1.228-.466 2.409-1.026 3.492l-.582 1.127A1 1 0 005.342 13.3h13.316a1 1 0 00.892-1.424l-.582-1.127a9.23 9.23 0 01-1.026-3.492A6.002 6.002 0 0012 2zm-3 15a3 3 0 006 0H9z"/>
                  </svg>
                  {notifications.length > 0 && (
                    <span className="navbar-icon-button__badge fb-badge-red">
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

              {/* Profile Avatar Dropdown Button */}
              <div className="navbar-popover">
                <button
                  aria-expanded={profileOpen}
                  className="fb-avatar-btn"
                  data-tour="navbar-profile"
                  onClick={() => {
                    setProfileOpen((open) => !open);
                    setNotificationOpen(false);
                  }}
                  type="button"
                  title={user.name}
                >
                  <div className="fb-avatar-wrapper">
                    {!avatarError && (user.avatarUrl || user.avatar) ? (
                      <img src={user.avatarUrl || user.avatar} alt="" onError={() => setAvatarError(true)} />
                    ) : (
                      <span className="navbar-profile-button__avatar">{initials(user.name)}</span>
                    )}
                    <span className="fb-avatar-badge">
                      <ChevronDown size={11} />
                    </span>
                  </div>
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
              <Link className="button button--primary" data-tour="navbar-login" to="/login">
                <LogIn size={16} /> Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </header>

      {mobileOpen && (
        <nav className="app-navbar__mobile" aria-label="Điều hướng di động">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link className={isActive(item) ? "is-active" : ""} key={item.path} to={item.path}>
                {Icon && <Icon size={18} />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}

