/**
 * Navbar.jsx — Mobile responsive + React Router
 */
import React, { useState } from "react";
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
  const [showChatPopover, setShowChatPopover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { notifs, unreadCount, markAllRead } = useNotifications(user);

  const handleNotifClick = (n) => {
    if (n.productId) navigate(`/san-pham/${n.productId}`);
  };

  const logout = () => {
    saveToken(null);
    disconnectSocket();
    setUser(null);
    navigate("/");
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navTo = (path) => { navigate(path); setMenuOpen(false); };

  return (
    <>
      <nav style={{
        background: C.ocean, color: "#fff",
        padding: "0 16px",
        display: "flex", alignItems: "center", height: 58, gap: 8,
        position: "sticky", top: 0, zIndex: 999,
        boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
      }}>
        {/* Logo */}
        <div
          onClick={() => navTo("/")}
          style={{ fontWeight: 800, fontSize: 18, cursor: "pointer", marginRight: 8, whiteSpace: "nowrap", flexShrink: 0 }}
        >
          🐟 HảiSản.vn
        </div>

        {/* Desktop nav links */}
        <div className="nav-links-desktop" style={{ display: "flex", gap: 2, flex: 1 }}>
          <NavButton label="🏠 Trang chủ" active={isActive("/")} onClick={() => navTo("/")} />
          {user && (
            <NavButton label="📊 Dashboard" active={isActive("/dashboard")} onClick={() => navTo("/dashboard")} />
          )}
          {user?.role === "Admin" && (
            <NavButton label="⚙️ Admin" active={isActive("/admin")} onClick={() => navTo("/admin")} />
          )}
        </div>

        {/* Desktop right actions */}
        <div className="nav-actions-desktop" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {user && (
            <button
              onClick={() => navTo("/dang-bai")}
              style={{
                background: C.coral, color: "#fff", border: "none",
                padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap",
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
                    background: "rgba(255,255,255,0.15)", color: "#fff", border: "none",
                    borderRadius: "50%", width: 36, height: 36, cursor: "pointer",
                    fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  aria-label="Tin nhắn"
                >
                  💬
                </button>
                {unread > 0 && (
                  <div style={{
                    position: "absolute", top: -4, right: -4, background: "#EF4444",
                    color: "#fff", borderRadius: "50%", width: 20, height: 20,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {unread}
                  </div>
                )}
                {showChatPopover && (
                  <ChatPopover
                    user={user}
                    onClose={() => setShowChatPopover(false)}
                    onOpenChat={(c) => { setShowChatPopover(false); onOpenGlobalChat(c); }}
                  />
                )}
              </div>
              <span className="nav-username" style={{ fontSize: 13, opacity: 0.9, whiteSpace: "nowrap" }}>
                👤 {user.name.split(" ").pop()}
                {user.isVerified && <span title="Đã xác minh" style={{ marginLeft: 4 }}>✅</span>}
              </span>
              <button
                onClick={logout}
                style={{
                  background: "rgba(255,255,255,0.15)", color: "#fff", border: "none",
                  padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                  fontSize: 12, fontFamily: "inherit", whiteSpace: "nowrap",
                }}
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              onClick={() => navTo("/dang-nhap")}
              style={{
                background: "#fff", color: C.ocean, border: "none",
                padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: 700, fontFamily: "inherit",
              }}
            >
              Đăng nhập
            </button>
          )}
        </div>

        {/* Mobile: notification + chat + hamburger */}
        <div className="nav-mobile-actions" style={{ display: "none", alignItems: "center", gap: 6, marginLeft: "auto" }}>
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
                    background: "rgba(255,255,255,0.15)", color: "#fff", border: "none",
                    borderRadius: "50%", width: 34, height: 34, cursor: "pointer",
                    fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  💬
                </button>
                {unread > 0 && (
                  <div style={{
                    position: "absolute", top: -4, right: -4, background: "#EF4444",
                    color: "#fff", borderRadius: "50%", width: 18, height: 18,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700,
                  }}>
                    {unread}
                  </div>
                )}
                {showChatPopover && (
                  <ChatPopover
                    user={user}
                    onClose={() => setShowChatPopover(false)}
                    onOpenChat={(c) => { setShowChatPopover(false); onOpenGlobalChat(c); }}
                  />
                )}
              </div>
            </>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "rgba(255,255,255,0.15)", color: "#fff", border: "none",
              borderRadius: 8, width: 36, height: 36, cursor: "pointer",
              fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
            }}
            aria-label="Menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div style={{
          background: C.ocean, borderTop: "1px solid rgba(255,255,255,0.15)",
          padding: "12px 16px 16px",
          display: "flex", flexDirection: "column", gap: 4,
          position: "sticky", top: 58, zIndex: 998,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}>
          <MobileNavItem label="🏠 Trang chủ" onClick={() => navTo("/")} />
          {user && <MobileNavItem label="📊 Dashboard" onClick={() => navTo("/dashboard")} />}
          {user && <MobileNavItem label="＋ Đăng bài" onClick={() => navTo("/dang-bai")} highlight />}
          {user?.role === "Admin" && <MobileNavItem label="⚙️ Admin" onClick={() => navTo("/admin")} />}
          {user ? (
            <MobileNavItem label="🚪 Đăng xuất" onClick={logout} />
          ) : (
            <MobileNavItem label="Đăng nhập" onClick={() => navTo("/dang-nhap")} highlight />
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
        color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8,
        cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 400,
        fontFamily: "inherit", whiteSpace: "nowrap",
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
        color: "#fff", border: "none",
        padding: "12px 16px", borderRadius: 8,
        cursor: "pointer", fontSize: 15, fontWeight: highlight ? 700 : 500,
        fontFamily: "inherit", textAlign: "left",
      }}
    >
      {label}
    </button>
  );
}
