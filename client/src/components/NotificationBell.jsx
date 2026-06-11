import { useState, useEffect, useRef, useCallback } from "react";
import { C } from "../utils/theme";

export function NotificationBell({
  notifs,
  unreadCount,
  onMarkAllRead, // FIX: đổi từ onMarkRead → onMarkAllRead cho nhất quán với Navbar/useNotifications
  onNotifClick,
}) {
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev); // 🌟 Chỉ bật/tắt hộp thông báo thông thường
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={bellRef} style={{ position: "relative" }}>
      <button
        onClick={handleToggle}
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
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.25)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
        }
        aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        🔔
      </button>

      {unreadCount > 0 && <Badge count={unreadCount} />}

      {open && (
        <NotifDropdown
          notifs={notifs}
          unreadCount={unreadCount}
          onMarkAllRead={onMarkAllRead}
          onNotifClick={(n) => {
            setOpen(false);
            onNotifClick?.(n);
          }}
        />
      )}
    </div>
  );
}

function Badge({ count }) {
  return (
    <div
      aria-hidden="true"
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
        boxShadow: "0 2px 8px rgba(239, 68, 68, 0.45)",
        pointerEvents: "none",
      }}
    >
      {count > 99 ? "99+" : count}
    </div>
  );
}

// Trong tệp: client/my-app/src/components/NotificationBell.jsx (phần cuối tệp)

function NotifDropdown({ notifs, unreadCount, onNotifClick, onMarkAllRead }) {
  // 👈 Thêm nhận diện onMarkAllRead ở đây
  return (
    <div
      role="dialog"
      aria-label="Thông báo"
      style={{
        position: "absolute",
        top: 46,
        right: 0,
        width: 330,
        background: "#fff",
        borderRadius: 16,
        boxShadow:
          "0 15px 35px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.05)",
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        zIndex: 1000,
      }}
    >
      {/* Giao diện tiêu đề nâng cấp */}
      <div
        style={{
          padding: "14px 18px",
          background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
          color: "#fff",
          fontWeight: 700,
          fontSize: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Thông báo của bạn</span>

        {/* Nhóm các nút điều hướng phụ bên góc phải */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {unreadCount > 0 && (
            // 🌟 CẢI TIẾN: Nút bấm "Đọc tất cả" nhỏ gọn, tinh tế ngay trong Header
            <button
              onClick={(e) => {
                e.stopPropagation(); // Chặn nổi bọt sự kiện để không bị đóng dropdown
                onMarkAllRead?.();
              }}
              style={{
                background: "rgba(255, 255, 255, 0.18)",
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 8px",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255, 255, 255, 0.28)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)")
              }
            >
              ✓ Đọc tất cả
            </button>
          )}

          {unreadCount > 0 && (
            <span
              style={{
                fontSize: 10,
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                padding: "3px 10px",
                borderRadius: 20,
                fontWeight: 700,
              }}
            >
              {unreadCount} mới
            </span>
          )}
        </div>
      </div>

      <div style={{ maxHeight: 340, overflowY: "auto" }}>
        {notifs.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: C.muted,
              fontSize: 13,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
            <div style={{ fontWeight: 600, color: C.dark }}>
              Không có thông báo nào
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              Chúng tôi sẽ báo cho bạn khi có tin mới.
            </div>
          </div>
        ) : (
          notifs.map((n, i) => (
            <NotifItem
              key={n.id || i}
              notif={n}
              onClick={() => onNotifClick(n)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NotifItem({ notif: n, onClick }) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      style={{
        padding: "14px 18px",
        borderBottom: `1px solid ${C.border}`,
        fontSize: 13,
        color: C.dark,
        borderLeft: n.isRead ? "4px solid transparent" : `4px solid ${C.ocean}`,
        background: n.isRead ? "#fff" : "rgba(11, 79, 108, 0.04)",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        cursor: n.productId ? "pointer" : "default",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = n.isRead
          ? "#fff"
          : "rgba(11, 79, 108, 0.04)")
      }
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: n.type === "new_review" ? "#FEF3C7" : "#E6F4F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          flexShrink: 0,
          marginTop: 1,
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        }}
      >
        {n.type === "new_review" ? "⭐" : "📢"}
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        <div
          style={{
            lineHeight: 1.45,
            fontWeight: n.isRead ? 400 : 700,
            color: n.isRead ? C.text : C.dark,
          }}
        >
          {n.preview || n.content}
        </div>
        {n.createdAt && (
          <div
            style={{
              fontSize: 11,
              color: C.muted,
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>🕒</span>
            <span>
              {new Date(n.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" - "}
              {new Date(n.createdAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {!n.isRead && (
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: C.ocean,
            flexShrink: 0,
            marginTop: 6,
            boxShadow: "0 0 0 2px rgba(11, 79, 108, 0.2)",
          }}
        />
      )}
    </div>
  );
}
