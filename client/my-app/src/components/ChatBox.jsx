/**
 * ChatBox.jsx — updated
 *
 * Thêm prop `fullHeight` để hiển thị cao hơn khi dùng trong InboxTab.
 * Không thay đổi logic cốt lõi.
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

  const chatHeight = fullHeight ? 420 : 200;

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        background: C.ocean, color: "#fff", padding: "12px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            💬 {product.sellerName}
            {product.sellerIsVerified && (
              <span title="Đã xác minh" style={{ marginLeft: 4 }}>✅</span>
            )}
          </div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>
            về: {product.name} {socketReady ? "● online" : ""}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 22, lineHeight: 1 }}
          >
            ×
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        height: chatHeight, overflowY: "auto", padding: "12px 14px",
        display: "flex", flexDirection: "column", gap: 8, background: "#F8FAFC",
      }}>
        {loading && (
          <div style={{ textAlign: "center", color: C.muted, fontSize: 13, marginTop: 60 }}>
            Đang tải...
          </div>
        )}
        {!loading && msgs.length === 0 && (
          <div style={{ textAlign: "center", color: C.muted, fontSize: 13, marginTop: 60 }}>
            Hãy bắt đầu cuộc trò chuyện 👋
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} style={{ display: "flex", justifyContent: m.isMine ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "75%",
              background: m.isMine ? C.ocean : C.white,
              color: m.isMine ? "#fff" : C.text,
              padding: "8px 12px",
              borderRadius: m.isMine ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
              fontSize: 13,
              border: m.isMine ? "none" : `1px solid ${C.border}`,
            }}>
              {m.content}
              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3, textAlign: m.isMine ? "right" : "left" }}>
                {m.time}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "10px 12px", display: "flex", gap: 8,
        borderTop: `1px solid ${C.border}`, background: C.white,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Nhập tin nhắn..."
          style={{
            flex: 1, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "inherit",
          }}
        />
        <button
          onClick={send}
          style={{
            background: C.ocean, color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit",
          }}
        >
          Gửi ▶
        </button>
      </div>
    </div>
  );
}
