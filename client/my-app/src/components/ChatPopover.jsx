/**
 * ChatPopover.jsx — Modernized UI/UX Version
 *
 * Giữ nguyên 100% logic fetch conversations và truyền callback onOpenChat.
 */
import React, { useState, useEffect } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";

export function ChatPopover({ user, onClose, onOpenChat }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/messages/conversations")
      .then((data) => setConversations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        right: 0,
        width: 330,
        background: "#fff",
        borderRadius: 16,
        boxShadow:
          "0 15px 35px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.05)",
        border: `1px solid ${C.border}`,
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          background: "#F8FAFC",
          borderBottom: `1px solid ${C.border}`,
          fontWeight: 800,
          fontSize: 14,
          color: C.dark,
        }}
      >
        💬 Hộp thư tin nhắn
      </div>

      {/* Danh sách các cuộc trò chuyện */}
      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {loading ? (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              color: C.muted,
              fontSize: 13,
            }}
          >
            Đang tải cuộc trò chuyện...
          </div>
        ) : conversations.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              color: C.muted,
              fontSize: 13,
            }}
          >
            Chưa có tin nhắn nào gần đây.
          </div>
        ) : (
          conversations.map((c) => (
            <div
              key={`${c.productId}-${c.otherUserId}`}
              onClick={() => onOpenChat(c)}
              style={{
                padding: "14px 18px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                gap: 12,
                cursor: "pointer",
                background: c.unread > 0 ? "rgba(11, 79, 108, 0.04)" : "#fff",
                // Đường vạch màu chỉ thị tin nhắn chưa đọc ở lề trái
                borderLeft:
                  c.unread > 0
                    ? `4px solid ${C.ocean}`
                    : `4px solid transparent`,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F1F5F9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  c.unread > 0 ? "rgba(11, 79, 108, 0.04)" : "#fff";
              }}
            >
              {/* Avatar dạng tròn phủ Gradient */}
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                  boxShadow: "0 2px 5px rgba(11, 79, 108, 0.15)",
                }}
              >
                {c.otherUserName.charAt(0).toUpperCase()}
              </div>

              {/* Thông tin nội dung */}
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 3,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: C.dark,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.otherUserName}
                  </div>

                  {/* Chấm tròn chưa đọc dạng Pulse rực rỡ */}
                  {c.unread > 0 && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: C.coral,
                        flexShrink: 0,
                        boxShadow: "0 0 0 2px rgba(232, 100, 58, 0.3)",
                      }}
                    />
                  )}
                </div>

                {/* Nội dung tin nhắn cuối */}
                <div
                  style={{
                    fontSize: 12,
                    color: c.unread > 0 ? C.dark : C.muted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontWeight: c.unread > 0 ? 700 : 400,
                  }}
                >
                  {c.lastMessage}
                </div>

                {/* Tag tên sản phẩm tinh tế */}
                <div style={{ marginTop: 4 }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 10,
                      fontWeight: 600,
                      background: "#F1F5F9",
                      color: "#475569",
                      padding: "2px 8px",
                      borderRadius: 6,
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    📦 {c.productName}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
