import { useState, useEffect, useRef } from "react";
import { C } from "../utils/theme";
import { getSocket } from "../services/socket";
import { api } from "../services/api";
import { MessageIcon, XIcon, CheckCircleIcon } from "./icons/index";
import { useToast } from "../context/ToastContext";
import { useVideoCall } from "../context/VideoCallContext";

const emojis = ["❤️", "😆", "😮", "😢", "😡", "👍"];

const actionIconBtnStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  padding: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  transition: "background 0.15s",
};

export function ChatBox({ product, onClose, user, fullHeight = false }) {
  const toast = useToast();
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingLocation, setSendingLocation] = useState(false);

  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeReactId, setActiveReactionId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [msgReactions, setMsgReactions] = useState({});
  const [recalledMsgs, setRecalledMsgs] = useState(new Set());

  const endRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const otherUserRef = useRef(null);

  // ✅ FIX 1: Ép kiểu string để so sánh không bị lỗi type mismatch
  const currentUserId = String(user?.id || user?.userId || "");

  const productSellerId = product.productSellerId || product.sellerId;
  const isSeller = currentUserId === String(productSellerId);
  const buyerId = isSeller
    ? product.otherUserId || product.sellerId
    : currentUserId;

  const { startCall } = useVideoCall();

  useEffect(() => {
    if (!currentUserId || !buyerId) return;

    api(`/messages/${product.id}?buyerId=${buyerId}`)
      .then((data) => {
        // ✅ FIX 1: Ép kiểu string khi so sánh senderId
        const mapped = data.map((m) => ({
          id: m.id,
          senderId: String(m.senderId),
          content: m.content,
          imageUrl: m.imageUrl,
          location: m.location,
          replyTo: m.replyTo || null,
          time: new Date(m.sentAt).toLocaleTimeString("vi", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isMine: String(m.senderId) === currentUserId, // ✅ so sánh string
          isRecalled: m.isRecalled || false, // ✅ FIX 3: map trường mới
          reaction: m.reaction || null, // ✅ FIX 3: map trường mới
        }));
        setMsgs(mapped);

        // ✅ FIX 3: Khởi tạo reactions và recalled từ dữ liệu đã lưu
        const initialReactions = {};
        const recalledSet = new Set();
        data.forEach((m) => {
          if (m.reaction) initialReactions[String(m.id)] = m.reaction;
          if (m.isRecalled) recalledSet.add(String(m.id));
        });
        setMsgReactions(initialReactions);
        setRecalledMsgs(recalledSet);

        const other = data.find((m) => String(m.senderId) !== currentUserId);
        if (other) otherUserRef.current = String(other.senderId);

        window.dispatchEvent(new CustomEvent("sync-unread"));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [product.id, currentUserId, buyerId]);

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

      // ✅ FIX 4: Lắng nghe các socket events còn thiếu
      socket.on("message_recalled", ({ id }) => {
        setRecalledMsgs((prev) => new Set([...prev, String(id)]));
      });

      socket.on("message_edited", ({ id, content }) => {
        setMsgs((prev) =>
          prev.map((m) =>
            String(m.id) === String(id) ? { ...m, content } : m,
          ),
        );
      });

      socket.on("message_reacted", ({ id, reaction }) => {
        setMsgReactions((prev) => ({ ...prev, [String(id)]: reaction }));
      });
    });

    function handleNewMessage(msg) {
      if (msg.productId !== product.id) return;
      const msgBuyerId =
        String(msg.senderId) === String(productSellerId)
          ? msg.receiverId
          : msg.senderId;
      if (String(msgBuyerId) !== String(buyerId)) return;

      if (String(msg.senderId) !== currentUserId)
        otherUserRef.current = String(msg.senderId);

      setMsgs((prev) => {
        if (prev.some((m) => String(m.id) === String(msg.id))) return prev;
        return [
          ...prev,
          {
            id: String(msg.id),
            senderId: String(msg.senderId),
            content: msg.content,
            imageUrl: msg.imageUrl,
            location: msg.location,
            replyTo: msg.replyTo || null,
            time: new Date(msg.sentAt).toLocaleTimeString("vi", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isMine: String(msg.senderId) === currentUserId, // ✅
            isRecalled: false,
            reaction: null,
          },
        ];
      });
    }

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.off("connect", joinRoom);
        socketRef.current.off("new_message", handleNewMessage);
        socketRef.current.off("message_recalled");
        socketRef.current.off("message_edited");
        socketRef.current.off("message_reacted");
        socketRef.current.emit("leave_room", {
          productId: product.id,
          buyerId,
        });
      }
    };
  }, [product.id, currentUserId, buyerId, productSellerId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const getReceiverId = () => {
    const sellerId = String(product.sellerId);
    return currentUserId === sellerId ? otherUserRef.current : sellerId;
  };

  const send = (txtContent = "", imgUrl = null, locationObj = null) => {
    const finalContent = txtContent.trim();
    if (!finalContent && !imgUrl && !locationObj) return;

    if (editingMsg) {
      api(`/messages/${editingMsg.id}/edit`, {
        method: "PATCH",
        body: JSON.stringify({ content: finalContent }),
      })
        .then(() => {
          setMsgs((prev) =>
            prev.map((m) =>
              m.id === editingMsg.id ? { ...m, content: finalContent } : m,
            ),
          );
          setEditingMsg(null);
          setInput("");
          toast.success("Đã chỉnh sửa tin nhắn!");
        })
        .catch((e) => toast.error(e.message));
      return;
    }

    const receiverId = getReceiverId();
    if (!receiverId) {
      toast.warn("Chưa có người nhận.");
      return;
    }
    const payload = {
      productId: product.id,
      receiverId,
      content: finalContent || null,
      imageUrl: imgUrl,
      location: locationObj,
      replyTo: replyTo
        ? {
            senderId: replyTo.senderId,
            content: replyTo.content || "Hình ảnh/Vị trí",
          }
        : null,
    };

    if (socketRef.current?.connected) {
      socketRef.current.emit("send_message", payload);
    } else {
      api("/messages", {
        method: "POST",
        body: JSON.stringify(payload),
      })
        .then((res) => {
          setMsgs((prev) => [
            ...prev,
            {
              id: String(res.id),
              senderId: currentUserId,
              content: finalContent || null,
              imageUrl: imgUrl,
              location: locationObj,
              replyTo: payload.replyTo,
              time: new Date().toLocaleTimeString("vi", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              isMine: true,
              isRecalled: false,
              reaction: null,
            },
          ]);
        })
        .catch((e) => toast.error(e.message));
    }
    setInput("");
    setReplyTo(null);
  };

  const handleMenuAction = (action, msg) => {
    setActiveMenuId(null);
    if (action === "recall") {
      api(`/messages/${msg.id}/recall`, { method: "PATCH" })
        .then(() => {
          setRecalledMsgs((prev) => new Set([...prev, String(msg.id)]));
          toast.success("Đã thu hồi tin nhắn.");
        })
        .catch((e) => toast.error(e.message));
    } else if (action === "edit") {
      setEditingMsg(msg);
      setInput(msg.content || "");
    } else if (action === "pin") {
      toast.info("Đã ghim tin nhắn này.");
    } else if (action === "forward") {
      toast.success("Đang chuyển tiếp...");
    } else if (action === "report") {
      toast.success("Đã gửi báo cáo.");
    }
  };

  const handleSelectReaction = (msgId, emoji) => {
    api(`/messages/${msgId}/react`, {
      method: "POST",
      body: JSON.stringify({ reaction: emoji }),
    })
      .then((res) => {
        setMsgReactions((prev) => ({ ...prev, [String(msgId)]: res.reaction }));
        setActiveReactionId(null);
      })
      .catch((e) => toast.error(e.message));
  };

  const handleSendLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị vị trí.");
      return;
    }
    setSendingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "vi-VN,vi;q=0.9" } },
          );
          const data = await response.json();
          const address = data?.display_name || "Vị trí hiện tại";
          send("", null, { latitude, longitude, address });
        } catch {
          send("", null, {
            latitude,
            longitude,
            address: "Vị trí được chia sẻ",
          });
        } finally {
          setSendingLocation(false);
        }
      },
      () => {
        setSendingLocation(false);
        toast.error("Không thể lấy vị trí hiện tại.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
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
      toast.warn("Không tìm thấy đối phương khả dụng để thực hiện cuộc gọi.");
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
      {/* ── Header ── */}
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
            }}
            title="Gọi video"
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

      {/* ── Danh sách tin nhắn ── */}
      <div
        style={{
          height: chatHeight,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
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
          msgs.map((m) => {
            const isRecalled = recalledMsgs.has(String(m.id));
            const activeReaction = msgReactions[String(m.id)];

            return (
              <div
                key={m.id}
                onMouseEnter={() => setHoveredMsgId(m.id)}
                onMouseLeave={() => {
                  setHoveredMsgId(null);
                  setActiveReactionId(null);
                  setActiveMenuId(null);
                }}
                style={{
                  // ✅ FIX 2: Layout 2 bên rõ ràng — KHÔNG dùng flexDirection row-reverse
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 6,
                  // Tin nhắn của mình: đẩy toàn bộ sang phải
                  justifyContent: m.isMine ? "flex-end" : "flex-start",
                }}
              >
                {/* Avatar người kia (chỉ hiện bên trái nếu không phải của mình) */}
                {!m.isMine && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #0b4f6c, #1a7fa0)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {(product.sellerName || "?").charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Bong bóng tin nhắn + toolbar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    // Toolbar: bên phải nếu là tin của mình, bên trái nếu của người kia
                    flexDirection: m.isMine ? "row-reverse" : "row",
                    maxWidth: "75%",
                  }}
                >
                  {/* Toolbar khi hover */}
                  {hoveredMsgId === m.id && !isRecalled && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        background: "rgba(255,255,255,0.95)",
                        border: "1px solid #e2e8f0",
                        borderRadius: 20,
                        padding: "2px 6px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        flexShrink: 0,
                      }}
                    >
                      {/* Nút Reaction */}
                      <div style={{ position: "relative" }}>
                        <button
                          onClick={() =>
                            setActiveReactionId((v) =>
                              v === m.id ? null : m.id,
                            )
                          }
                          style={actionIconBtnStyle}
                          title="Bày tỏ cảm xúc"
                        >
                          🙂
                        </button>
                        {activeReactId === m.id && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 30,
                              // ✅ Popup reaction xuất hiện đúng phía
                              left: m.isMine ? "auto" : 0,
                              right: m.isMine ? 0 : "auto",
                              background: "#fff",
                              border: "1px solid #e2e8f0",
                              borderRadius: 20,
                              padding: "4px 8px",
                              display: "flex",
                              gap: 6,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              zIndex: 20,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {emojis.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() =>
                                  handleSelectReaction(m.id, emoji)
                                }
                                style={{
                                  background: "none",
                                  border: "none",
                                  fontSize: 18,
                                  cursor: "pointer",
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Nút Reply */}
                      <button
                        onClick={() => setReplyTo(m)}
                        style={actionIconBtnStyle}
                        title="Trả lời"
                      >
                        ↩️
                      </button>

                      {/* Nút More */}
                      <div style={{ position: "relative" }}>
                        <button
                          onClick={() =>
                            setActiveMenuId((v) => (v === m.id ? null : m.id))
                          }
                          style={actionIconBtnStyle}
                          title="Xem thêm"
                        >
                          ⋮
                        </button>
                        {activeMenuId === m.id && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 30,
                              left: m.isMine ? "auto" : 0,
                              right: m.isMine ? 0 : "auto",
                              background: "#2d2d2d",
                              borderRadius: 10,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              zIndex: 20,
                              overflow: "hidden",
                              minWidth: 110,
                            }}
                          >
                            {[
                              { act: "edit", lbl: "Chỉnh sửa", show: m.isMine },
                              { act: "recall", lbl: "Thu hồi", show: m.isMine },
                              {
                                act: "forward",
                                lbl: "Chuyển tiếp",
                                show: true,
                              },
                              { act: "pin", lbl: "Ghim", show: true },
                              {
                                act: "report",
                                lbl: "Báo cáo",
                                show: !m.isMine,
                              },
                            ].map((item) => {
                              if (!item.show) return null;
                              return (
                                <button
                                  key={item.act}
                                  onClick={() => handleMenuAction(item.act, m)}
                                  style={{
                                    width: "100%",
                                    padding: "7px 14px",
                                    border: "none",
                                    background: "none",
                                    color: "#fff",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    fontSize: 12,
                                  }}
                                >
                                  {item.lbl}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bubble content */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      // ✅ Căn lề nội dung theo đúng phía
                      alignItems: m.isMine ? "flex-end" : "flex-start",
                    }}
                  >
                    {/* Quote reply */}
                    {m.replyTo && !isRecalled && (
                      <div
                        style={{
                          background: m.isMine
                            ? "rgba(15,23,42,0.12)"
                            : "#e2e8f0",
                          padding: "4px 10px",
                          borderRadius: m.isMine
                            ? "10px 10px 0 0"
                            : "10px 10px 0 0",
                          fontSize: 11,
                          color: "#64748b",
                          fontStyle: "italic",
                          borderBottom: "1px dashed #cbd5e1",
                          maxWidth: "100%",
                        }}
                      >
                        ↩️{" "}
                        {m.replyTo.senderId === currentUserId
                          ? "Bạn"
                          : product.sellerName}{" "}
                        viết: {m.replyTo.content}
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      style={{
                        // ✅ Màu bong bóng đúng: mình = tối, người kia = trắng
                        background: isRecalled
                          ? "#e2e8f0"
                          : m.isMine
                            ? "#0f172a"
                            : "#ffffff",
                        color: isRecalled
                          ? "#94a3b8"
                          : m.isMine
                            ? "#ffffff"
                            : "#1e293b",
                        padding: "9px 13px",
                        borderRadius: isRecalled
                          ? 10
                          : m.isMine
                            ? m.replyTo
                              ? "0 10px 10px 10px"
                              : "10px 10px 4px 10px" // góc dưới phải nhọn
                            : m.replyTo
                              ? "10px 0 10px 10px"
                              : "10px 10px 10px 4px", // góc dưới trái nhọn
                        fontSize: 13,
                        lineHeight: 1.45,
                        boxShadow: m.isMine
                          ? "none"
                          : "0 1px 3px rgba(0,0,0,0.06)",
                        border:
                          m.isMine || isRecalled ? "none" : "1px solid #f1f5f9",
                        position: "relative",
                        wordBreak: "break-word",
                        maxWidth: "100%",
                      }}
                    >
                      {isRecalled ? (
                        <span style={{ fontStyle: "italic" }}>
                          🚫 Tin nhắn đã bị thu hồi
                        </span>
                      ) : (
                        <>
                          {m.content && <div>{m.content}</div>}
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
                          {m.location && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${m.location.latitude},${m.location.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "block",
                                background: m.isMine
                                  ? "rgba(255,255,255,0.12)"
                                  : "#f1f5f9",
                                color: m.isMine ? "#fff" : "#1e293b",
                                padding: "10px",
                                borderRadius: 8,
                                textDecoration: "none",
                                marginTop: m.content || m.imageUrl ? 8 : 0,
                                border: m.isMine
                                  ? "1px solid rgba(255,255,255,0.2)"
                                  : "1px solid #e2e8f0",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: 10,
                                  alignItems: "center",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 20,
                                    background: m.isMine
                                      ? "rgba(255,255,255,0.25)"
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
                                        ? "rgba(255,255,255,0.8)"
                                        : "#64748b",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                    title={m.location.address}
                                  >
                                    {m.location.address || "Nhấn để xem bản đồ"}
                                  </div>
                                </div>
                              </div>
                            </a>
                          )}
                        </>
                      )}

                      {/* Reaction badge */}
                      {activeReaction && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: -10,
                            // ✅ Reaction badge đúng phía
                            right: m.isMine ? 4 : "auto",
                            left: m.isMine ? "auto" : 4,
                            background: "#fff",
                            borderRadius: 12,
                            padding: "1px 5px",
                            fontSize: 12,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            zIndex: 5,
                          }}
                        >
                          {activeReaction}
                        </div>
                      )}
                    </div>

                    {/* Timestamp + trạng thái gửi */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 4,
                        paddingLeft: m.isMine ? 0 : 4,
                        paddingRight: m.isMine ? 4 : 0,
                      }}
                    >
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>
                        {m.time}
                      </span>
                      {m.isMine && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#22c55e",
                            fontWeight: 600,
                          }}
                        >
                          · Đã gửi ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* ── Reply / Edit bar ── */}
      {replyTo && (
        <div
          style={{
            padding: "8px 12px",
            background: "#f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <div>
            Đang trả lời{" "}
            <strong>
              {replyTo.senderId === currentUserId
                ? "chính mình"
                : product.sellerName}
            </strong>
            :{" "}
            <span style={{ color: "#64748b" }}>
              {replyTo.content || "Hình ảnh/Vị trí"}
            </span>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            ✕
          </button>
        </div>
      )}
      {editingMsg && (
        <div
          style={{
            padding: "8px 12px",
            background: "#fffbeb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            borderTop: "1px solid #fef3c7",
          }}
        >
          <div style={{ color: "#b45309" }}>
            Đang chỉnh sửa:{" "}
            <span style={{ fontStyle: "italic" }}>{editingMsg.content}</span>
          </div>
          <button
            onClick={() => {
              setEditingMsg(null);
              setInput("");
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Thanh nhập liệu ── */}
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
          title="Gửi ảnh"
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
          title="Chia sẻ vị trí"
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
            transition: "border-color 0.15s",
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
          }}
        >
          {editingMsg ? "Lưu" : "Gửi"}
        </button>
      </div>
    </div>
  );
}
