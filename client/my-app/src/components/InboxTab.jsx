/**
 * InboxTab.jsx — Modernized UI/UX Version
 *
 * Tab "Tin nhắn" đầy đủ trong Dashboard.
 * Giữ nguyên 100% logic fetch conversations, cập nhật unread = 0 và mở ChatBox inline.
 * Tích hợp responsive grid mượt mà cho thiết bị di động.
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

  const openChat = (conv) => {
    setActiveChat(conv);
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
      className="inbox-tab-grid"
      style={{
        display: "grid",
        gridTemplateColumns: activeChat ? "1fr 1fr" : "1fr",
        gap: 24,
      }}
    >
      {/* ─── DANH SÁCH HỘI THOẠI ─── */}
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
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: C.dark,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            📬 Hộp thư tin nhắn
            {totalUnread > 0 && (
              <span
                style={{
                  background: C.coral,
                  color: "#fff",
                  borderRadius: 20,
                  padding: "2px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(232, 100, 58, 0.45)",
                }}
              >
                {totalUnread} chưa đọc
              </span>
            )}
          </h2>
          <button
            onClick={loadConversations}
            style={{
              background: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              color: C.muted,
              fontFamily: "inherit",
              boxShadow: "0 2px 4px rgba(0,0,0,0.01)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
          >
            🔄 Làm mới hộp thư
          </button>
        </div>

        {loading ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: C.muted,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Đang tải dữ liệu hội thoại...
          </div>
        ) : conversations.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: C.muted,
              fontSize: 14,
              background: C.white,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              boxShadow: "0 4px 10px rgba(0,0,0,0.01)",
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 10 }}>💬</div>
            <div style={{ fontWeight: 700, marginBottom: 4, color: C.dark }}>
              Chưa có cuộc trò chuyện nào
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              Khi có bất kỳ ai hỏi mua hoặc hỏi về sản phẩm của bạn, hộp chat sẽ
              xuất hiện tại đây.
            </div>
          </div>
        ) : (
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: `1px solid ${C.border}`,
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.02)",
              background: C.white,
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
                    padding: "16px",
                    cursor: "pointer",
                    background: isActive
                      ? "rgba(11, 79, 108, 0.05)"
                      : conv.unread > 0
                        ? "rgba(11, 79, 108, 0.03)"
                        : C.white,
                    borderBottom:
                      i < conversations.length - 1
                        ? `1px solid #F1F5F9`
                        : "none",
                    transition: "all 0.2s ease",
                    // Vạch lề trái chỉ thị đang hoạt động/chưa đọc đồng bộ
                    borderLeft: isActive
                      ? `4px solid ${C.ocean}`
                      : conv.unread > 0
                        ? `4px solid ${C.coral}`
                        : "4px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "#F1F5F9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isActive
                      ? "rgba(11, 79, 108, 0.05)"
                      : conv.unread > 0
                        ? "rgba(11, 79, 108, 0.03)"
                        : C.white;
                  }}
                >
                  {/* Avatar Tròn Gradient */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 15,
                      flexShrink: 0,
                      boxShadow: "0 2px 6px rgba(11, 79, 108, 0.15)",
                    }}
                  >
                    {conv.otherUserName.charAt(0).toUpperCase()}
                  </div>

                  {/* Chi tiết tin nhắn */}
                  <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: conv.unread > 0 ? 800 : 700,
                          fontSize: 14,
                          color: C.dark,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {conv.otherUserName}
                        {conv.otherUserIsVerified && (
                          <span title="Đã xác minh" style={{ fontSize: 12 }}>
                            ✅
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: C.muted,
                          fontWeight: 500,
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      >
                        {formatTime(conv.lastSentAt)}
                      </div>
                    </div>

                    {/* Tin nhắn cuối cùng */}
                    <div
                      style={{
                        fontSize: 13,
                        color: conv.unread > 0 ? C.dark : C.muted,
                        fontWeight: conv.unread > 0 ? 700 : 400,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: 6,
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
                      {/* Thẻ sản phẩm Tag bo tròn mượt mà */}
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: 10,
                          fontWeight: 600,
                          background: "#E2E8F0",
                          color: "#475569",
                          padding: "2px 8px",
                          borderRadius: 6,
                          maxWidth: "75%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        📦 {conv.productName}
                      </span>

                      {conv.unread > 0 && (
                        <div
                          style={{
                            background: C.coral,
                            color: "#fff",
                            borderRadius: 10,
                            padding: "1px 8px",
                            fontSize: 10,
                            fontWeight: 700,
                            flexShrink: 0,
                            boxShadow: "0 2px 6px rgba(232, 100, 58, 0.3)",
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

      {/* ─── KHUNG CHAT INLINE KHI ĐÃ CHỌN HỘI THOẠI ─── */}
      {activeChat && (
        <div style={{ position: "sticky", top: 80, alignSelf: "flex-start" }}>
          <div
            style={{
              marginBottom: 10,
              fontSize: 13,
              color: C.muted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Đang chat với:{" "}
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
              productSellerId: activeChat.productSellerId,
              otherUserId: activeChat.otherUserId,
            }}
            user={user}
            onClose={() => setActiveChat(null)}
            fullHeight // Sử dụng kích thước chiều cao đầy đủ
          />
        </div>
      )}

      {/* Đoạn mã CSS hỗ trợ co giãn/responsive cho Khung Inbox */}
      <style>{`
        @media (max-width: 768px) {
          .inbox-tab-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
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
