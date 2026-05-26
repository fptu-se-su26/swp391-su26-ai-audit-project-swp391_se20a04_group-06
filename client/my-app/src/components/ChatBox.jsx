/**
 * ChatBox.jsx — Modernized UI/UX Version
 *
 * Thêm prop `fullHeight` để hiển thị cao hơn khi dùng trong InboxTab.
 * Giữ nguyên 100% logic Socket.IO và APIs cốt lõi.
 */

import React, { useState, useEffect, useRef } from "react";
import { C } from "../utils/theme";
import { getSocket } from "../services/socket";
import { getToken, api } from "../services/api";

export function ChatBox({ product, onClose, user, fullHeight = false }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [socketReady, setSocketReady] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false); // Hiệu ứng focus input

  const endRef = useRef(null);
  const socketRef = useRef(null);
  const otherUserRef = useRef(null);

  // Fetch lịch sử tin nhắn
  useEffect(() => {
    setMsgs([]);
    setLoading(true);
    api(`/messages/${product.id}`)
      .then((data) => {
        const mapped = data.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          content: m.content,
          time: new Date(m.sentAt).toLocaleTimeString("vi", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isMine: m.senderId === user.id,
        }));
        setMsgs(mapped);
        const other = data.find((m) => m.senderId !== user.id);
        if (other) otherUserRef.current = other.senderId;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [product.id, user.id]);

  // Kết nối Socket.IO
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    let cancelled = false;
    getSocket(token).then((socket) => {
      if (cancelled) return;
      socketRef.current = socket;
      socket.emit("join_room", product.id);
      socket.on("new_message", handleNewMessage);
      setSocketReady(true);
    });

    function handleNewMessage(msg) {
      if (msg.productId !== product.id) return;
      if (msg.senderId !== user.id) otherUserRef.current = msg.senderId;
      setMsgs((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [
          ...prev,
          {
            id: msg.id,
            senderId: msg.senderId,
            content: msg.content,
            time: new Date(msg.sentAt).toLocaleTimeString("vi", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isMine: msg.senderId === user.id,
          },
        ];
      });
    }

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.off("new_message", handleNewMessage);
        socketRef.current.emit("leave_room", product.id);
      }
    };
  }, [product.id, user.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = () => {
    if (!input.trim()) return;
    const sellerId = product.sellerId;
    const receiverId = user.id === sellerId ? otherUserRef.current : sellerId;
    if (!receiverId) {
      alert("Chưa có người nhận. Hãy chờ người mua nhắn trước.");
      return;
    }
    if (socketRef.current?.connected) {
      socketRef.current.emit("send_message", {
        productId: product.id,
        receiverId,
        content: input.trim(),
      });
    } else {
      api("/messages", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          receiverId,
          content: input.trim(),
        }),
      })
        .then((res) => {
          setMsgs((prev) => [
            ...prev,
            {
              id: res.id,
              senderId: user.id,
              content: input.trim(),
              time: new Date().toLocaleTimeString("vi", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              isMine: true,
            },
          ]);
        })
        .catch((e) => alert(e.message));
    }
    setInput("");
  };

  const chatHeight = fullHeight ? 420 : 220;

  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(11, 79, 108, 0.08)",
        background: C.white,
      }}
    >
      {/* Header thanh lịch */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
          color: "#fff",
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            💬 {product.sellerName}
            {product.sellerIsVerified && <span title="Đã xác minh">✅</span>}
          </div>
          <div
            style={{
              fontSize: 11,
              opacity: 0.9,
              marginTop: 2,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 140,
                whiteSpace: "nowrap",
              }}
            >
              Hải sản: {product.name}
            </span>
            {socketReady && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontWeight: 600,
                }}
              >
                •
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#10B981",
                    boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.3)",
                  }}
                />
                online
              </span>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: 18,
              width: 26,
              height: 26,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.25)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
            }
          >
            ×
          </button>
        )}
      </div>

      {/* Tin nhắn được thiết kế lại mượt mà */}
      <div
        style={{
          height: chatHeight,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          background: "#F1F5F9",
        }}
      >
        {loading && (
          <div
            style={{
              textAlign: "center",
              color: C.muted,
              fontSize: 13,
              marginTop: 60,
            }}
          >
            Đang tải dữ liệu trò chuyện...
          </div>
        )}
        {!loading && msgs.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: C.muted,
              fontSize: 13,
              marginTop: 60,
            }}
          >
            Hãy mở lời trước để kết nối giao dịch 👋
          </div>
        )}

        {msgs.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              justifyContent: m.isMine ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                background: m.isMine
                  ? `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`
                  : C.white,
                color: m.isMine ? "#fff" : C.text,
                padding: "10px 14px",
                borderRadius: m.isMine
                  ? "16px 16px 4px 16px"
                  : "16px 16px 16px 4px",
                fontSize: 13,
                lineHeight: 1.4,
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                border: m.isMine ? "none" : `1px solid #E2E8F0`,
              }}
            >
              {m.content}
              <div
                style={{
                  fontSize: 9,
                  opacity: 0.7,
                  marginTop: 4,
                  textAlign: m.isMine ? "right" : "left",
                  color: m.isMine ? "rgba(255, 255, 255, 0.8)" : C.muted,
                }}
              >
                {m.time}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Khung nhập liệu nâng cấp viền phát sáng */}
      <div
        style={{
          padding: "12px",
          display: "flex",
          gap: 8,
          borderTop: `1px solid ${C.border}`,
          background: C.white,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          placeholder="Nhập tin nhắn..."
          style={{
            flex: 1,
            border: `1.5px solid ${isInputFocused ? C.ocean : C.border}`,
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            outline: "none",
            fontFamily: "inherit",
            transition: "all 0.2s ease",
            boxShadow: isInputFocused
              ? `0 0 0 3px rgba(11, 79, 108, 0.1)`
              : "none",
          }}
        />
        <button
          onClick={send}
          style={{
            background: C.ocean,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
            fontFamily: "inherit",
            boxShadow: "0 2px 8px rgba(11, 79, 108, 0.25)",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.9)}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
