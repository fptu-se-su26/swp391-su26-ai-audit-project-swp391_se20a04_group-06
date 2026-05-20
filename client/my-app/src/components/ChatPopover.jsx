import React, { useState, useEffect } from 'react';
import { C } from '../utils/theme';
import { api } from '../services/api';
export function ChatPopover({ user, onClose, onOpenChat }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/messages/conversations")
      .then(data => setConversations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{
      position: "absolute", top: 48, right: 0, width: 320,
      background: "#fff", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      border: `1px solid ${C.border}`, zIndex: 100, overflow: "hidden"
    }}>
      <div style={{ padding: "12px 16px", background: C.bg, borderBottom: `1px solid ${C.border}`, fontWeight: 800, color: C.dark }}>
        Tin nhắn
      </div>
      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: C.muted, fontSize: 13 }}>Đang tải...</div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: C.muted, fontSize: 13 }}>Chưa có tin nhắn nào.</div>
        ) : (
          conversations.map(c => (
            <div key={`${c.productId}-${c.otherUserId}`} onClick={() => onOpenChat(c)}
              style={{
                padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
                display: "flex", gap: 12, cursor: "pointer", background: c.unread > 0 ? C.oceanP : "#fff",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = C.bg}
              onMouseLeave={(e) => e.currentTarget.style.background = c.unread > 0 ? C.oceanP : "#fff"}
            >
              <div style={{
                width: 40, height: 40, borderRadius: "50%", background: C.ocean, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0
              }}>
                {c.otherUserName.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.dark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.otherUserName}
                  </div>
                  {c.unread > 0 && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.coral, marginTop: 4, flexShrink: 0 }} />}
                </div>
                <div style={{ fontSize: 12, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: c.unread > 0 ? 700 : 400 }}>
                  {c.lastMessage}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2, opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  về: {c.productName}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}