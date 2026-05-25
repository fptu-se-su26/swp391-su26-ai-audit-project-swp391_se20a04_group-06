/**
 * InboxTab.jsx
 *
 * Tab "Tin nhắn" đầy đủ trong Dashboard.
 * Hiện danh sách hội thoại + mở ChatBox inline khi click.
 *
 * Dùng API đã có sẵn:
 *   GET /api/messages/conversations  → danh sách hội thoại
 *   GET /api/messages/:productId      → lịch sử tin nhắn (trong ChatBox)
 */

import React, { useState, useEffect } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { ChatBox } from "./ChatBox";

export function InboxTab({ user }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null); // { productId, productName, otherUserId, otherUserName }

  const loadConversations = () => {
    setLoading(true);
    api("/messages/conversations")
      .then((data) => setConversations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Đánh dấu đã đọc khi mở hội thoại
  const openChat = (conv) => {
    setActiveChat(conv);
    // Update local unread = 0 ngay lập tức
    setConversations((prev) =>
      prev.map((c) =>
        c.productId === conv.productId && c.otherUserId === conv.otherUserId
          ? { ...c, unread: 0 }
          : c,
      ),
    );
  };

  const totalUnread = conversations.reduce((s, c) => s + (c.unread || 0), 0);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: activeChat ? "1fr 1fr" : "1fr",
        gap: 20,
      }}
    >
      {/* ─── Danh sách hội thoại ─── */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2
            style={{ fontSize: 16, fontWeight: 800, color: C.dark, margin: 0 }}
          >
            📬 Hộp thư
            {totalUnread > 0 && (
              <span
                style={{
                  marginLeft: 8,
                  background: C.coral,
                  color: "#fff",
                  borderRadius: 12,
                  padding: "2px 8px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {totalUnread} chưa đọc
              </span>
            )}
          </h2>
          <button
            onClick={loadConversations}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: 12,
              color: C.muted,
              fontFamily: "inherit",
            }}
          >
            🔄 Làm mới
          </button>
        </div>

        {loading ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: C.muted,
              fontSize: 13,
            }}
          >
            Đang tải hội thoại...
          </div>
        ) : conversations.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: C.muted,
              fontSize: 14,
              background: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              Chưa có tin nhắn nào
            </div>
            <div style={{ fontSize: 12 }}>
              Khi ai đó hỏi về sản phẩm của bạn, tin nhắn sẽ hiện ở đây.
            </div>
          </div>
        ) : (
          <div
            style={{
              borderRadius: 12,
              overflow: "hidden",
              border: `1px solid ${C.border}`,
            }}
          >
            {conversations.map((conv, i) => {
              const isActive =
                activeChat?.productId === conv.productId &&
                activeChat?.otherUserId === conv.otherUserId;

              return (
                <div
                  key={`${conv.productId}-${conv.otherUserId}`}
                  onClick={() => openChat(conv)}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                    background: isActive
                      ? C.oceanP
                      : conv.unread > 0
                        ? "#FFF8F0"
                        : C.white,
                    borderBottom:
                      i < conversations.length - 1
                        ? `1px solid ${C.border}`
                        : "none",
                    transition: "background 0.15s",
                    borderLeft: isActive
                      ? `3px solid ${C.ocean}`
                      : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = C.bg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isActive
                      ? C.oceanP
                      : conv.unread > 0
                        ? "#FFF8F0"
                        : C.white;
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: C.ocean,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {conv.otherUserName.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 2,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: conv.unread > 0 ? 800 : 600,
                          fontSize: 14,
                          color: C.dark,
                        }}
                      >
                        {conv.otherUserName}
                        {conv.otherUserIsVerified && (
                          <span
                            title="Đã xác minh"
                            style={{ marginLeft: 4, fontSize: 12 }}
                          >
                            ✅
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: C.muted,
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      >
                        {formatTime(conv.lastSentAt)}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: conv.unread > 0 ? C.dark : C.muted,
                        fontWeight: conv.unread > 0 ? 700 : 400,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: 2,
                      }}
                    >
                      {conv.lastMessage}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: C.muted,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        🐟 {conv.productName}
                      </div>
                      {conv.unread > 0 && (
                        <div
                          style={{
                            background: C.coral,
                            color: "#fff",
                            borderRadius: 10,
                            padding: "1px 7px",
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {conv.unread}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── ChatBox khi đã chọn hội thoại ─── */}
      {activeChat && (
        <div style={{ position: "sticky", top: 80, alignSelf: "flex-start" }}>
          <div
            style={{
              marginBottom: 8,
              fontSize: 13,
              color: C.muted,
              fontWeight: 600,
            }}
          >
            Đang chat với{" "}
            <strong style={{ color: C.dark }}>
              {activeChat.otherUserName}
            </strong>
          </div>
          <ChatBox
            product={{
              id: activeChat.productId,
              name: activeChat.productName,
              sellerId: activeChat.otherUserId,
              sellerName: activeChat.otherUserName,
            }}
            user={user}
            onClose={() => setActiveChat(null)}
            fullHeight // prop để ChatBox biết dùng height lớn hơn
          />
        </div>
      )}
    </div>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "vừa xong";
  if (diffMin < 60) return `${diffMin} phút`;
  if (diffH < 24) return `${diffH} giờ`;
  if (diffD < 7) return `${diffD} ngày`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}
