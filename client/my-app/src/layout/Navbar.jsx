/**
 * Navbar.jsx — Cleaner & Lighter Dynamic Version
 */
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { C } from "../utils/theme";
import { saveToken } from "../services/api";
import { disconnectSocket } from "../services/socket";
import { ChatPopover } from "../components/ChatPopover";
import { NotificationBell } from "../components/NotificationBell";
import { useNotifications } from "../hooks/useNotifications";

export function Navbar({ user, setUser, unread, onOpenGlobalChat }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const [showChatPopover, setShowChatPopover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const { notifs, unreadCount, markAllRead } = useNotifications(user);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotifClick = (n) => {
    if (n.productId) navigate(`/san-pham/${n.productId}`);
  };

  const logout = () => {
    saveToken(null);
    disconnectSocket();
    setUser(null);
    navigate("/");
    setMenuOpen(false);
    setShowProfileDropdown(false);
  };

  const isActive = (path) => location.pathname === path;
  const navTo = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <>
      <nav
        style={{
          background: C.ocean,
          color: "#fff",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          height: 58,
          gap: 8,
          position: "sticky",
          top: 0,
          zIndex: 999,
          boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
        }}
      >
        {/* Logo */}
        <div
          onClick={() => navTo("/")}
          style={{
            fontWeight: 800,
            fontSize: 18,
            cursor: "pointer",
            marginRight: 8,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          🐟 HảiSản.vn
        </div>

        {/* Desktop nav links */}
        <div
          className="nav-links-desktop"
          style={{ display: "flex", gap: 2, flex: 1 }}
        >
          <NavButton
            label="🏠 Trang chủ"
            active={isActive("/")}
            onClick={() => navTo("/")}
          />
          {user && (
            <NavButton
              label="📊 Dashboard"
              active={isActive("/dashboard")}
              onClick={() => navTo("/dashboard")}
            />
          )}
          {user?.role === "Admin" && (
            <NavButton
              label="⚙️ Admin"
              active={isActive("/admin")}
              onClick={() => navTo("/admin")}
            />
          )}
        </div>

        {/* Desktop right actions */}
        <div
          className="nav-actions-desktop"
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          {user && (
            <button
              onClick={() => navTo("/dang-bai")}
              style={{
                background: C.coral,
                color: "#fff",
                border: "none",
                padding: "8px 14px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              ＋ Đăng bài
            </button>
          )}

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <NotificationBell
                notifs={notifs}
                unreadCount={unreadCount}
                onMarkRead={markAllRead}
                onNotifClick={handleNotifClick}
              />
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowChatPopover(!showChatPopover)}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 36,
                    height: 36,
                    cursor: "pointer",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label="Tin nhắn"
                >
                  💬
                </button>
                {unread > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      background: "#EF4444",
                      color: "#fff",
                      borderRadius: "50%",
                      width: 20,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {unread}
                  </div>
                )}
                {showChatPopover && (
                  <ChatPopover
                    user={user}
                    onClose={() => setShowChatPopover(false)}
                    onOpenChat={(c) => {
                      setShowChatPopover(false);
                      onOpenGlobalChat(c);
                    }}
                  />
                )}
              </div>

              {/* Tài khoản Dropdown Menu */}
              {/* Tài khoản Dropdown Menu nâng cấp giao diện ảnh đại diện tròn */}
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    color: "#fff",
                    border: "none",
                    padding: "6px 14px",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.18)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.12)")
                  }
                >
                  {/* Kiểm tra và hiển thị Avatar hình tròn */}
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1.5px solid #fff", // Viền trắng nổi
                        boxShadow: "0 2px 4px rgba(0,0,0,0.12)", // Đổ bóng nhẹ
                      }}
                    />
                  ) : (
                    // Nếu chưa có ảnh, tự động hiển thị chữ cái đầu tên viết tắt trên nền tròn Gradient cam
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${C.coral} 0%, #D94E21 100%)`,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Tên hiển thị người dùng */}
                  <span>{user.name}</span>
                  {user.isVerified && <span title="Đã xác minh">✅</span>}
                  <span style={{ fontSize: 9, opacity: 0.8 }}>▼</span>
                </button>

                {showProfileDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: 6,
                      background: "#fff",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                      borderRadius: 10,
                      width: 180,
                      zIndex: 1000,
                      overflow: "hidden",
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    <button
                      onClick={() => {
                        navTo("/profile");
                        setShowProfileDropdown(false);
                      }}
                      style={dropdownItemStyle}
                    >
                      ⚙️ Thiết lập tài khoản
                    </button>
                    <button
                      onClick={() => {
                        navTo("/dashboard");
                        setShowProfileDropdown(false);
                      }}
                      style={dropdownItemStyle}
                    >
                      📊 Quản lý bài đăng
                    </button>
                    <div
                      style={{
                        borderTop: "1px solid #F3F4F6",
                        margin: "4px 0",
                      }}
                    ></div>
                    <button
                      onClick={logout}
                      style={{
                        ...dropdownItemStyle,
                        color: "#EF4444",
                        fontWeight: 600,
                      }}
                    >
                      🚪 Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => navTo("/dang-nhap")}
              style={{
                background: "#fff",
                color: C.ocean,
                border: "none",
                padding: "8px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              Đăng nhập
            </button>
          )}
        </div>

        {/* Mobile: notification + chat + hamburger */}
        <div
          className="nav-mobile-actions"
          style={{
            display: "none",
            alignItems: "center",
            gap: 6,
            marginLeft: "auto",
          }}
        >
          {user && (
            <>
              <NotificationBell
                notifs={notifs}
                unreadCount={unreadCount}
                onMarkRead={markAllRead}
                onNotifClick={handleNotifClick}
              />
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowChatPopover(!showChatPopover)}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 34,
                    height: 34,
                    cursor: "pointer",
                    fontSize: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  💬
                </button>
                {unread > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      background: "#EF4444",
                      color: "#fff",
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {unread}
                  </div>
                )}
                {showChatPopover && (
                  <ChatPopover
                    user={user}
                    onClose={() => setShowChatPopover(false)}
                    onOpenChat={(c) => {
                      setShowChatPopover(false);
                      onOpenGlobalChat(c);
                    }}
                  />
                )}
              </div>
            </>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              width: 36,
              height: 36,
              cursor: "pointer",
              fontSize: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          style={{
            background: C.ocean,
            borderTop: "1px solid rgba(255,255,255,0.15)",
            padding: "12px 16px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            position: "sticky",
            top: 58,
            zIndex: 998,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <MobileNavItem label="🏠 Trang chủ" onClick={() => navTo("/")} />
          {user && (
            <MobileNavItem
              label="📊 Dashboard"
              onClick={() => navTo("/dashboard")}
            />
          )}
          {user && (
            <MobileNavItem
              label="＋ Đăng bài"
              onClick={() => navTo("/dang-bai")}
              highlight
            />
          )}
          {user && (
            <MobileNavItem
              label="⚙️ Thiết lập tài khoản"
              onClick={() => navTo("/profile")}
            />
          )}
          {user?.role === "Admin" && (
            <MobileNavItem label="⚙️ Admin" onClick={() => navTo("/admin")} />
          )}
          {user ? (
            <MobileNavItem label="🚪 Đăng xuất" onClick={logout} />
          ) : (
            <MobileNavItem
              label="Đăng nhập"
              onClick={() => navTo("/dang-nhap")}
              highlight
            />
          )}
        </div>
      )}

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 640px) {
          .nav-links-desktop { display: none !important; }
          .nav-actions-desktop { display: none !important; }
          .nav-mobile-actions { display: flex !important; }
          .nav-username { display: none !important; }
        }
      `}</style>
    </>
  );
}

function NavButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "rgba(255,255,255,0.2)" : "transparent",
        color: "#fff",
        border: "none",
        padding: "8px 12px",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: active ? 700 : 400,
        fontFamily: "inherit",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function MobileNavItem({ label, onClick, highlight }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: highlight ? C.coral : "rgba(255,255,255,0.1)",
        color: "#fff",
        border: "none",
        padding: "12px 16px",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 15,
        fontWeight: highlight ? 700 : 500,
        fontFamily: "inherit",
        textAlign: "left",
        width: "100%",
      }}
    >
      {label}
    </button>
  );
}

const dropdownItemStyle = {
  width: "100%",
  padding: "10px 16px",
  background: "none",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  fontSize: 13,
  color: "#374151",
  fontFamily: "inherit",
  transition: "background 0.2s",
};
