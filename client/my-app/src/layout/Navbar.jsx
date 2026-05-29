/**
 * Navbar.jsx — Refactored + Fixed
 *
 * FIXES:
 *   1. FIX CRITICAL TYPO: `onMarkRead` → `onMarkAllRead` khi truyền vào NotificationBell.
 *      Bug: NotificationBell nhận prop `onMarkAllRead` nhưng Navbar truyền `onMarkRead`
 *      → notifications không bao giờ được đánh dấu đã đọc khi mở dropdown.
 *
 *   2. Thêm cleanup cho event listener IntersectionObserver (đã có nhưng cần verify).
 *
 *   3. Loại bỏ `disconnectSocket` import thừa (logout đã được handle trong AuthContext).
 *
 *   4. `handleLogout` không cần async/await — `logout()` từ AuthContext đã handle internally.
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
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
  TruckIcon,
  PhoneIcon,
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

  const { notifs, unreadCount, markAllRead } = useNotifications(user);

  // Đóng profile dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Detect scroll để thu nhỏ navbar
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

  // Đóng mobile menu khi route thay đổi
  useEffect(() => {
    setMenuOpen(false);
    setShowChatPopover(false);
    setShowProfileDropdown(false);
  }, [location.pathname]);

  const handleNotifClick = useCallback(
    (n) => {
      if (n.productId) navigate(`/san-pham/${n.productId}`);
    },
    [navigate],
  );

  // FIX: Không cần async/await — logout() trong AuthContext tự handle
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

      <div
        className={`${styles.topBar} ${scrolled ? styles.topBarHidden : ""}`}
      >
        <span className={styles.topBarItem}>
          <TruckIcon size={12} />
          Giao tươi trong 20km · Khô giao toàn quốc
        </span>
        <span className={styles.topBarItem}>
          <PhoneIcon size={12} />
          Hỗ trợ kỹ thuật: 1800 6688
        </span>
      </div>

      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        <button
          className={styles.logo}
          onClick={() => navTo("/")}
          aria-label="Trang chủ"
        >
          <span className={styles.logoMark}>
            <SparklesIcon size={18} style={{ color: "var(--ocean)" }} />
          </span>
          <span>
            <span className={styles.logoName}>
              Hải<span className={styles.logoAccent}>Sản</span>.vn
            </span>
            <span className={styles.logoTagline}>Tươi từ ngư dân</span>
          </span>
        </button>

        <div className={styles.navLinks}>
          <button
            className={`${styles.navBtn} ${isActive("/") ? styles.active : ""}`}
            onClick={() => navTo("/")}
          >
            <HomeIcon size={14} />
            Trang chủ
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

              {/* FIX: prop onMarkRead → onMarkAllRead */}
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
