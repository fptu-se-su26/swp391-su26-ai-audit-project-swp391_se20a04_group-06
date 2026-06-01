// Trong tệp: client/my-app/src/components/ChatBox.jsx

import { useState, useEffect, useRef } from "react";
import { C } from "../utils/theme";
import { getSocket } from "../services/socket";
import { api } from "../services/api";
import { MessageIcon, XIcon, CheckCircleIcon } from "./icons/index";
import { useToast } from "../context/ToastContext";
import { useVideoCall } from "../context/VideoCallContext";

export function ChatBox({ product, onClose, user, fullHeight = false }) {
  const toast = useToast();
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [socketReady, setSocketReady] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [uploading, setUploading] = useState(false);

  const endRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const otherUserRef = useRef(null);

  const currentUserId = user?.id || user?.userId;

  // LẤY TRỰC TIẾP HÀM BẮT ĐẦU CUỘC GỌI TỪ GLOBAL PROVIDER
  const { startCall } = useVideoCall();

  useEffect(() => {
    if (!currentUserId) return;
    setMsgs([]);
    setLoading(true);
    api(`/messages/${product.id}`)
      .then((data) => {
        const mapped = data.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          content: m.content,
          imageUrl: m.imageUrl,
          time: new Date(m.sentAt).toLocaleTimeString("vi", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isMine: m.senderId === currentUserId,
        }));
        setMsgs(mapped);
        const other = data.find((m) => m.senderId !== currentUserId);
        if (other) otherUserRef.current = other.senderId;
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [product.id, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;

    // 🌟 GIẢI PHÁP: Khai báo hàm joinRoom ở tầm vực useEffect để cả .then() lẫn cleanup return bên dưới đều đọc được
    const joinRoom = () => {
      if (socketRef.current) {
        socketRef.current.emit("join_room", product.id);
      }
    };

    getSocket().then((socket) => {
      if (cancelled) return;
      socketRef.current = socket;

      // Gia nhập phòng chat lần đầu
      joinRoom();

      // 🌟 Lắng nghe sự kiện kết nối lại thành công để tự động gia nhập lại phòng chat
      socket.on("connect", joinRoom);
      socket.on("new_message", handleNewMessage);

      setSocketReady(true);
    });

    function handleNewMessage(msg) {
      if (msg.productId !== product.id) return;
      if (msg.senderId !== currentUserId) otherUserRef.current = msg.senderId;
      setMsgs((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [
          ...prev,
          {
            id: msg.id,
            senderId: msg.senderId,
            content: msg.content,
            imageUrl: msg.imageUrl,
            time: new Date(msg.sentAt).toLocaleTimeString("vi", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isMine: msg.senderId === currentUserId,
          },
        ];
      });
    }

    return () => {
      cancelled = true;
      if (socketRef.current) {
        // Gỡ bỏ bộ lắng nghe kết nối khi unmount
        socketRef.current.off("connect", joinRoom);
        socketRef.current.off("new_message", handleNewMessage);
        socketRef.current.emit("leave_room", product.id);
      }
    };
  }, [product.id, currentUserId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const getReceiverId = () => {
    const sellerId = product.sellerId;
    return currentUserId === sellerId ? otherUserRef.current : sellerId;
  };

  const send = (txtContent = "", imgUrl = null) => {
    const finalContent = txtContent.trim();
    if (!finalContent && !imgUrl) return;

    const receiverId = getReceiverId();
    if (!receiverId) {
      toast.warn("Chưa có người nhận. Hãy chờ người mua nhắn trước.");
      return;
    }

    if (socketRef.current?.connected) {
      socketRef.current.emit("send_message", {
        productId: product.id,
        receiverId,
        content: finalContent || null,
        imageUrl: imgUrl,
      });
    } else {
      api("/messages", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          receiverId,
          content: finalContent || null,
          imageUrl: imgUrl,
        }),
      })
        .then((res) => {
          setMsgs((prev) => [
            ...prev,
            {
              id: res.id,
              senderId: currentUserId,
              content: finalContent || null,
              imageUrl: imgUrl,
              time: new Date().toLocaleTimeString("vi", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              isMine: true,
            },
          ]);
        })
        .catch((e) => toast.error(e.message));
    }
    setInput("");
  };

  // Hàm nén ảnh tối giản dành riêng cho khung Chat (Co về 800px, chất lượng 70%)
  const compressChatImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800; // Khung chat chỉ cần tối đa 800px là đủ sắc nét
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            },
            "image/jpeg",
            0.70 // Nén chất lượng về 70% để gửi siêu tốc
          );
        };
      };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const compressedFile = await compressChatImage(file);

      const fd = new FormData();
      fd.append("image", compressedFile);

      const res = await api("/messages/upload-image", {
        method: "POST",
        body: fd,
      });

      send("", res.imageUrl);
    } catch (err) {
      toast.error("Gửi ảnh thất bại: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleInitiateCall = () => {
    const targetId = getReceiverId();
    if (!targetId) {
      toast.warn("Không tìm thấy đối phương hoạt động để thực hiện cuộc gọi.");
      return;
    }
    startCall(targetId, product.sellerName);
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
      {/* Header */}
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

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* NÚT GỌI VIDEO CALL */}
          <button
            onClick={handleInitiateCall}
            style={{
              background: "none",
              border: "none",
              color: "#38bdf8",
              cursor: "pointer",
              fontSize: 14,
              padding: "4px",
              display: "flex",
              alignItems: "center"
            }}
            title="Gọi video cho đối phương"
          >
            📞
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "4px"
              }}
            >
              <XIcon size={16} />
            </button>
          )}
        </div>
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
                {m.content && (
                  <div style={{ wordBreak: "break-word" }}>{m.content}</div>
                )}

                {m.imageUrl && (
                  <img
                    src={m.imageUrl}
                    alt="Ảnh hải sản đính kèm"
                    style={{
                      maxWidth: "100%",
                      borderRadius: 8,
                      marginTop: m.content ? 6 : 0,
                      maxHeight: 180,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                )}

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
          alignItems: "center",
        }}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          type="button"
          style={{
            background: "#f1f5f9",
            border: "none",
            borderRadius: 6,
            width: 36,
            height: 36,
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Gửi hình ảnh thực tế"
        >
          {uploading ? "⏳" : "📷"}
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
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
          onClick={() => send(input)}
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