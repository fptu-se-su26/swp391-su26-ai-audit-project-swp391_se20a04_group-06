/**
 * Navbar.jsx (Đã dọn sạch lỗi Cascading Renders và lược bỏ ô tìm kiếm)
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChatPopover } from "../components/ChatPopover";
import { NotificationBell } from "../components/NotificationBell";
import { useNotifications } from "../hooks/useNotifications";
import {
  MessageIcon,
  HomeIcon,
  BarChartIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  PlusIcon,
  ChevronDownIcon,
  SparklesIcon,
} from "../components/icons";
import styles from "./Navbar.module.css";

export function Navbar({ unread, onOpenGlobalChat }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const sentinelRef = useRef(null);

  const [showChatPopover, setShowChatPopover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // 🌟 KHẮC PHỤC: Tự động đóng các Menu / Dropdown ngay trong lúc render khi đổi trang
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    if (menuOpen) setMenuOpen(false);
    if (showChatPopover) setShowChatPopover(false);
    if (showProfileDropdown) setShowProfileDropdown(false);
  }

  const { notifs, unreadCount, markAllRead, markSingleRead } =
    useNotifications(user);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const handleNotifClick = useCallback(
    (n) => {
      if (!n.isRead) markSingleRead(n.id);
      if (n.productId) navigate(`/san-pham/${n.productId}`);
    },
    [navigate, markSingleRead],
  );

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/");
    setMenuOpen(false);
    setShowProfileDropdown(false);
  }, [logout, navigate]);

  const isActive = useCallback(
    (path) => location.pathname === path,
    [location.pathname],
  );

  const navTo = useCallback(
    (path) => {
      navigate(path);
      setMenuOpen(false);
    },
    [navigate],
  );

  return (
    <>
      {/* Scroll sentinel */}
      <div
        ref={sentinelRef}
        style={{
          position: "absolute",
          top: 0,
          height: 1,
          width: "100%",
          pointerEvents: "none",
        }}
      />

      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        {/* ─── Logo ─── */}
        <button
          className={styles.logo}
          onClick={() => navTo("/")}
          aria-label="Trang chủ"
        >
          <span className={styles.logoMark}>
            <SparklesIcon size={18} />
          </span>
          <span>
            <span className={styles.logoName}>
              Hai<span className={styles.logoAccent}>San</span>.vn
            </span>
            <span className={styles.logoTagline}>Tươi từ ngư dân</span>
          </span>
        </button>

        {/* ─── Nav Links ─── */}
        <div className={styles.navLinks}>
          <button
            className={`${styles.navBtn} ${isActive("/") ? styles.active : ""}`}
            onClick={() => navTo("/")}
          >
            <HomeIcon size={14} />
            Trang chủ
          </button>

          <button
            className={`${styles.navBtn} ${isActive("/san-pham") ? styles.active : ""}`}
            onClick={() => navTo("/san-pham")}
          >
            🐟 Sản phẩm
          </button>
          <button
            className={`${styles.navBtn} ${isActive("/cong-thuc") ? styles.active : ""}`}
            onClick={() => navTo("/cong-thuc")}
          >
            🍳 Bí quyết
          </button>
          <button
            className={`${styles.navBtn} ${isActive("/cong-dong") ? styles.active : ""}`}
            onClick={() => navTo("/cong-dong")}
          >
            💬 Cộng đồng
          </button>
          <button
            className={`${styles.navBtn} ${isActive("/ngu-dan") ? styles.active : ""}`}
            onClick={() => navTo("/ngu-dan")}
          >
            🚢 Ngư dân
          </button>
          {user && (
            <>
              <button
                className={`${styles.navBtn} ${isActive("/dashboard") ? styles.active : ""}`}
                onClick={() => navTo("/dashboard")}
              >
                <BarChartIcon size={14} />
                Quản lý
              </button>
              {user.role === "Admin" && (
                <button
                  className={`${styles.navBtn} ${isActive("/admin") ? styles.active : ""}`}
                  onClick={() => navTo("/admin")}
                >
                  <SettingsIcon size={14} />
                  Admin
                </button>
              )}
            </>
          )}
        </div>

        {/* ─── Actions ─── */}
        <div className={styles.actions}>
          {user ? (
            <>
              <div style={{ position: "relative" }}>
                <button
                  className={styles.iconBtn}
                  onClick={() => setShowChatPopover((v) => !v)}
                  aria-label={`Tin nhắn${unread > 0 ? ` (${unread} chưa đọc)` : ""}`}
                >
                  <MessageIcon size={16} />
                  {unread > 0 && (
                    <span className={styles.badge}>
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
                {showChatPopover && (
                  <ChatPopover
                    user={user}
                    onClose={() => setShowChatPopover(false)}
                    onOpenChat={(chat) => {
                      onOpenGlobalChat?.(chat);
                      setShowChatPopover(false);
                    }}
                  />
                )}
              </div>

              <NotificationBell
                notifs={notifs}
                unreadCount={unreadCount}
                onMarkAllRead={markAllRead}
                onNotifClick={handleNotifClick}
              />

              <button
                className={styles.postBtn}
                onClick={() => navTo("/dang-bai")}
              >
                <PlusIcon size={14} />
                Đăng bán
              </button>

              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  className={styles.profileBtn}
                  onClick={() => setShowProfileDropdown((v) => !v)}
                  aria-expanded={showProfileDropdown}
                  aria-haspopup="true"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className={styles.avatar}
                    />
                  ) : (
                    <span className={styles.avatarInitial}>
                      {(user.name || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span>{user.name?.split(" ").pop()}</span>
                  <ChevronDownIcon size={11} />
                </button>

                {showProfileDropdown && (
                  <div className={styles.dropdown} role="menu">
                    <div className={styles.dropdownHeader}>
                      <div className={styles.dropdownName}>{user.name}</div>
                      <div className={styles.dropdownSub}>{user.email}</div>
                    </div>
                    <button
                      className={styles.dropdownItem}
                      role="menuitem"
                      onClick={() => {
                        navTo("/profile");
                        setShowProfileDropdown(false);
                      }}
                    >
                      <SettingsIcon size={13} />
                      Cài đặt tài khoản
                    </button>
                    <button
                      className={styles.dropdownItem}
                      role="menuitem"
                      onClick={() => {
                        navTo("/dashboard");
                        setShowProfileDropdown(false);
                      }}
                    >
                      <BarChartIcon size={13} />
                      Quản lý bán hàng
                    </button>
                    <hr className={styles.dropdownDivider} />
                    <button
                      className={`${styles.dropdownItem} ${styles.danger}`}
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      <LogOutIcon size={13} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                className={styles.postBtn}
                onClick={() => navTo("/dang-bai")}
              >
                <PlusIcon size={14} />
                Đăng bán
              </button>
              <button
                className={styles.loginBtn}
                onClick={() => navTo("/dang-nhap")}
              >
                Đăng nhập
              </button>
            </>
          )}
        </div>

        {/* ─── Mobile toggle ─── */}
        <div className={styles.mobileActions}>
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <XIcon size={16} /> : <MenuIcon size={16} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          className={styles.mobileMenu}
          role="navigation"
          aria-label="Menu di động"
        >
          <button className={styles.mobileMenuItem} onClick={() => navTo("/")}>
            <HomeIcon size={14} />
            Trang chủ
          </button>

          <button
            className={styles.mobileMenuItem}
            onClick={() => navTo("/san-pham")}
          >
            🐟 Sản phẩm bản địa
          </button>
          <button
            className={styles.mobileMenuItem}
            onClick={() => navTo("/cong-thuc")}
          >
            🍳 Bí quyết nấu nướng
          </button>
          <button
            className={styles.mobileMenuItem}
            onClick={() => navTo("/cong-dong")}
          >
            💬 Cộng đồng thảo luận
          </button>
          <button
            className={styles.mobileMenuItem}
            onClick={() => navTo("/ngu-dan")}
          >
            🚢 Ngư dân bản địa
          </button>
          {user && (
            <button
              className={styles.mobileMenuItem}
              onClick={() => navTo("/dashboard")}
            >
              <BarChartIcon size={14} />
              Quản lý bán hàng
            </button>
          )}

          <button
            className={styles.mobileMenuItem}
            onClick={() => navTo("/dang-bai")}
          >
            <PlusIcon size={14} />
            Đăng bán ngay
          </button>
          {user ? (
            <button
              className={`${styles.mobileMenuItem} ${styles.danger}`}
              onClick={handleLogout}
            >
              <LogOutIcon size={14} />
              Đăng xuất
            </button>
          ) : (
            <button
              className={styles.mobileMenuItem}
              onClick={() => navTo("/dang-nhap")}
            >
              Đăng nhập
            </button>
          )}
        </div>
      )}
    </>
  );
}
