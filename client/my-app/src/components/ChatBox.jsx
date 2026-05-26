import React, { useState, useEffect, useRef } from "react";
import { C } from "../utils/theme";
import { getSocket } from "../services/socket";
import { api } from "../services/api";
import { MessageIcon, XIcon, CheckCircleIcon } from "./icons";

export function ChatBox({ product, onClose, user, fullHeight = false }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [socketReady, setSocketReady] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const endRef = useRef(null);
  const socketRef = useRef(null);
  const otherUserRef = useRef(null);

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

  useEffect(() => {
    // 🚀 THAY ĐỔI: Chỉ kết nối socket nếu người dùng đã đăng nhập (kiểm tra qua prop user)
    if (!user) return;
    let cancelled = false;

    // Không cần truyền token làm tham số nữa
    getSocket().then((socket) => {
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
  }, [product.id, user.id]); // trigger lại khi thông tin người dùng thay đổi

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

  const chatHeight = fullHeight ? 420 : 250;

  return (
    <div
      style={{
        border: "1.5px solid #eaeaea",
        borderRadius: 12,
        overflow: "hidden",
        background: C.white,
      }}
    >
      <div
        style={{
          background: "#0f172a",
          color: "#fff",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <MessageIcon size={14} />
            <span>{product.sellerName}</span>
            {product.sellerIsVerified && (
              <CheckCircleIcon size={12} style={{ color: "#38bdf8" }} />
            )}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            Sản phẩm: {product.name}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            <XIcon size={16} />
          </button>
        )}
      </div>

      <div
        style={{
          height: chatHeight,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: "#f8fafc",
        }}
      >
        {loading ? (
          <div
            style={{
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 12,
              marginTop: 40,
            }}
          >
            Đang tải tin nhắn...
          </div>
        ) : msgs.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 12,
              marginTop: 40,
            }}
          >
            Gửi tin nhắn để bắt đầu cuộc trò chuyện.
          </div>
        ) : (
          msgs.map((m) => (
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
                  background: m.isMine ? "#0f172a" : "#fff",
                  color: m.isMine ? "#fff" : "#1e293b",
                  padding: "8px 12px",
                  borderRadius: m.isMine
                    ? "8px 8px 0px 8px"
                    : "8px 8px 8px 0px",
                  fontSize: 13,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  border: m.isMine ? "none" : "1px solid #f1f5f9",
                }}
              >
                <div>{m.content}</div>
                <div
                  style={{
                    fontSize: 9,
                    color: m.isMine ? "rgba(255,255,255,0.6)" : "#94a3b8",
                    marginTop: 4,
                    textAlign: "right",
                  }}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div
        style={{
          padding: "12px",
          display: "flex",
          gap: 8,
          borderTop: "1px solid #f1f5f9",
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
            border: `1.5px solid ${isInputFocused ? "#0f172a" : "#cbd5e1"}`,
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 13,
            outline: "none",
            transition: "all 0.15s ease",
          }}
        />
        <button
          onClick={send}
          style={{
            background: "#0f172a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 14px",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
