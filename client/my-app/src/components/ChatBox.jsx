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
  const [sendingLocation, setSendingLocation] = useState(false); // 🌟 State chờ gửi vị trí

  const endRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const otherUserRef = useRef(null);

  const currentUserId = user?.id || user?.userId;
  const productSellerId = product.productSellerId || product.sellerId;
  const isSeller = currentUserId === productSellerId;
  const buyerId = isSeller ? (product.otherUserId || product.sellerId) : currentUserId;

  const { startCall } = useVideoCall();

  // Load tin nhắn cũ
  useEffect(() => {
    if (!currentUserId || !buyerId) return;
    setMsgs([]);
    setLoading(true);
    api(`/messages/${product.id}?buyerId=${buyerId}`)
      .then((data) => {
        const mapped = data.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          content: m.content,
          imageUrl: m.imageUrl,
          location: m.location, // 🌟 Map thêm trường location từ backend
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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [product.id, currentUserId, buyerId]);

  // Lắng nghe WebSocket
  useEffect(() => {
    if (!currentUserId || !buyerId) return;
    let cancelled = false;

    const joinRoom = () => {
      if (socketRef.current) {
        socketRef.current.emit("join_room", { productId: product.id, buyerId });
      }
    };

    getSocket().then((socket) => {
      if (cancelled) return;
      socketRef.current = socket;
      joinRoom();

      socket.on("connect", joinRoom);
      socket.on("new_message", handleNewMessage);
      setSocketReady(true);
    });

    function handleNewMessage(msg) {
      if (msg.productId !== product.id) return;
      const msgBuyerId = msg.senderId === productSellerId ? msg.receiverId : msg.senderId;
      if (msgBuyerId !== buyerId) return;

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
            location: msg.location, // 🌟 Nhận thêm vị trí qua socket real-time
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
        socketRef.current.off("connect", joinRoom);
        socketRef.current.off("new_message", handleNewMessage);
        socketRef.current.emit("leave_room", { productId: product.id, buyerId });
      }
    };
  }, [product.id, currentUserId, buyerId, productSellerId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const getReceiverId = () => {
    const sellerId = product.sellerId;
    return currentUserId === sellerId ? otherUserRef.current : sellerId;
  };

  // 🌟 Hàm send nhận thêm tham số locationObj để truyền đi
  const send = (txtContent = "", imgUrl = null, locationObj = null) => {
    const finalContent = txtContent.trim();
    if (!finalContent && !imgUrl && !locationObj) return;

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
        location: locationObj, // Gửi qua Socket
      });
    } else {
      api("/messages", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          receiverId,
          content: finalContent || null,
          imageUrl: imgUrl,
          location: locationObj, // Gửi qua HTTP
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
              location: locationObj, // Hiển thị tức thì
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

  // 🌟 Hàm xử lý lấy Vị trí và giải mã Địa chỉ chữ (Reverse Geocoding)
  const handleSendLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt của bạn không hỗ trợ định vị vị trí.");
      return;
    }

    setSendingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Gọi API OpenStreetMap Nominatim miễn phí để phân tích tọa độ ra tên địa chỉ tiếng Việt
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "vi-VN,vi;q=0.9",
              },
            },
          );
          const data = await response.json();
          const address = data?.display_name || "Vị trí hiện tại";

          send("", null, { latitude, longitude, address });
        } catch (error) {
          // Nếu lỗi gọi API địa chỉ, vẫn gửi tọa độ kèm chữ mặc định
          send("", null, {
            latitude,
            longitude,
            address: "Vị trí được chia sẻ",
          });
        } finally {
          setSendingLocation(false);
        }
      },
      (error) => {
        setSendingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error(
              "Vui lòng cấp quyền truy cập GPS/Vị trí cho trang web.",
            );
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Không tìm thấy thông tin vị trí từ thiết bị.");
            break;
          case error.TIMEOUT:
            toast.error("Yêu cầu định vị quá thời gian chờ.");
            break;
          default:
            toast.error("Không thể lấy vị trí hiện tại.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const compressChatImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
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
            0.7,
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
              alignItems: "center",
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
                padding: "4px",
              }}
            >
              <XIcon size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Message Area */}
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
                    alt="Ảnh đính kèm"
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

                {/* 🌟 Bong bóng hiển thị vị trí (Google Maps) */}
                {m.location && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${m.location.latitude},${m.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      background: m.isMine
                        ? "rgba(255, 255, 255, 0.12)"
                        : "#f1f5f9",
                      color: m.isMine ? "#fff" : "#1e293b",
                      padding: "10px",
                      borderRadius: 8,
                      textDecoration: "none",
                      marginTop: m.content || m.imageUrl ? 8 : 0,
                      border: m.isMine
                        ? "1px solid rgba(255, 255, 255, 0.2)"
                        : "1px solid #e2e8f0",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = m.isMine
                        ? "rgba(255, 255, 255, 0.2)"
                        : "#e2e8f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = m.isMine
                        ? "rgba(255, 255, 255, 0.12)"
                        : "#f1f5f9";
                    }}
                  >
                    <div
                      style={{ display: "flex", gap: 10, alignItems: "center" }}
                    >
                      <div
                        style={{
                          fontSize: 20,
                          background: m.isMine
                            ? "rgba(255, 255, 255, 0.25)"
                            : "#fff",
                          borderRadius: "50%",
                          width: 36,
                          height: 36,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        📍
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            marginBottom: 2,
                          }}
                        >
                          {m.isMine
                            ? "Vị trí của tôi"
                            : "Vị trí của đối phương"}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: m.isMine
                              ? "rgba(255, 255, 255, 0.8)"
                              : "#64748b",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={m.location.address}
                        >
                          {m.location.address || "Nhấn để xem địa chỉ cụ thể"}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        borderTop: m.isMine
                          ? "1px solid rgba(255, 255, 255, 0.2)"
                          : "1px solid #e2e8f0",
                        marginTop: 8,
                        paddingTop: 6,
                        textAlign: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: m.isMine ? "#38bdf8" : "#0284c7",
                      }}
                    >
                      🗺️ Nhấn để chỉ đường bằng Google Maps
                    </div>
                  </a>
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

      {/* Input và Control Buttons */}
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
        {/* Nút gửi ảnh */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || sendingLocation}
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

        {/* 🌟 Nút gửi Vị trí hiện tại (📍) */}
        <button
          onClick={handleSendLocation}
          disabled={uploading || sendingLocation}
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
          title="Chia sẻ vị trí hiện tại của bạn"
        >
          {sendingLocation ? "⏳" : "📍"}
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          placeholder={sendingLocation ? "Đang định vị..." : "Nhập tin nhắn..."}
          disabled={sendingLocation}
          style={{
            flex: 1,
            border: `1.5px solid ${isInputFocused ? "#0f172a" : "#cbd5e1"}`,
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 13,
            outline: "none",
            transition: "all 0.15s ease",
            background: sendingLocation ? "#f8fafc" : "#fff",
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={sendingLocation}
          style={{
            background: "#0f172a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 14px",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
            opacity: sendingLocation ? 0.6 : 1,
          }}
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
