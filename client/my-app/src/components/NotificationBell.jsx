/**
 * NotificationBell.jsx — Modernized UI/UX Version
 *
 * Tách biệt hoàn toàn logic và khoác lên mình giao diện cao cấp.
 * Giữ nguyên 100% logic states, props và callbacks.
 */
import React, { useState, useEffect, useRef } from "react";
import { C } from "../utils/theme";

export function NotificationBell({
  notifs,
  unreadCount,
  onMarkRead,
  onNotifClick,
}) {
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) onMarkRead();
  };

  // Đóng dropdown thông báo khi nhấp chuột ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        aria-label="Thông báo"
      >
        🔔
      </button>

      {unreadCount > 0 && <Badge count={unreadCount} />}

      {open && (
        <NotifDropdown
          notifs={notifs}
          unreadCount={unreadCount}
          onNotifClick={(n) => {
            setOpen(false);
            onNotifClick(n);
          }}
        />
      )}
    </div>
  );
}

function Badge({ count }) {
  return (
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
        boxShadow: "0 2px 8px rgba(239, 68, 68, 0.45)", // Đổ bóng rực rỡ dạng glow
        pointerEvents: "none",
      }}
    >
      {count}
    </div>
  );
}

function NotifDropdown({ notifs, unreadCount, onNotifClick }) {
  return (
    <div
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
      {/* Header Gradient */}
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
      style={{
        padding: "14px 18px",
        borderBottom: `1px solid ${C.border}`,
        fontSize: 13,
        color: C.dark,
        // Điểm chỉ thị tin nhắn chưa đọc bên lề trái đồng bộ với Popover chat
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
      {/* Vòng tròn Icon đẹp mắt thay cho Emoji trần */}
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

      {/* Chấm chỉ thị chưa đọc */}
      {!n.isRead && (
        <span
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
