import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, PackageOpen, X, Video, Phone, BellOff, ChevronDown, User, Search, Type } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import ChatComposer from "../components/chat/ChatComposer";
import ConversationList from "../components/chat/ConversationList";
import MessageBubble from "../components/chat/MessageBubble";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { apiMessages } from "../services/api";
import { useConfirm } from "../context/ConfirmContext";

import {
  mergeConversations,
  normalizeConversation,
} from "../utils/chat";

const playMessageBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (err) {
    console.warn("Notification beep play failed:", err);
  }
};

function getInitials(name) {
  if (!name) return "ND";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Chat() {
  const { confirm, alert } = useConfirm();
  const { user } = useAuth();
  const location = useLocation();
  const { socket, isConnected, joinConversation, leaveConversation, sendChatMessage } = useSocket() || {};

  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [initialText, setInitialText] = useState("");
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("haisan-pinned-conversations");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to parse pinned conversations:", e);
    }
    return new Set();
  });

  const routeHandledRef = useRef("");
  const messagesEndRef = useRef(null);

  const [showWarning, setShowWarning] = useState(() => {
    return localStorage.getItem("haisan-chat-warning-dismissed") !== "true";
  });

  const dismissWarning = () => {
    setShowWarning(false);
    localStorage.setItem("haisan-chat-warning-dismissed", "true");
  };

  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [nickname, setNickname] = useState("");
  const [chatEmoji, setChatEmoji] = useState("👍");
  const [themeColor, setThemeColor] = useState("#0284c7");

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) || null,
    [activeThreadId, threads],
  );
  const activeConversationId = activeThread?.id;
  const activeProductId = activeThread?.productId;
  const activePartnerId = activeThread?.partnerId;

  // Determine if the current user is the product seller by comparing IDs,
  // NOT by checking user.role (roles are "User"/"Admin", never "Seller").
  const myId = user?.id || user?._id;
  const isMeSeller = activeThread?.productSellerId && String(activeThread.productSellerId) === String(myId);
  const activeBuyerId = isMeSeller ? activePartnerId : myId;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    apiMessages
      .getConversations()
      .then((data) => {
        const nextThreads = (Array.isArray(data) ? data : data?.conversations || []).map(
          normalizeConversation,
        );
        setThreads((current) => mergeConversations(current, nextThreads));
        setActiveThreadId((current) => current || nextThreads[0]?.id || "");
      })
      .catch((error) => console.error("Failed to load conversations:", error))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    const target = location.state;
    if (!target?.startChatWith) return;

    const productId = target.productId || "";
    const threadId = target.startChatWith;
    if (routeHandledRef.current === threadId) return;
    routeHandledRef.current = threadId;
    setThreads((current) => {
      const exists = current.some((thread) => thread.id === threadId);
      if (exists) {
        return current.map((thread) => {
          if (thread.id === threadId) {
            return {
              ...thread,
              productId,
              productName: target.productName || thread.productName,
              productPrice: target.productPrice || thread.productPrice,
              productSellerId: target.startChatWith,
            };
          }
          return thread;
        });
      }
      return [
        normalizeConversation({
          id: threadId,
          productId,
          productName: target.productName || "Mẻ hải sản",
          productPrice: target.productPrice || 0,
          partnerId: target.startChatWith,
          partnerName: target.sellerName || "Ngư dân",
          productSellerId: target.startChatWith,
          messages: [],
        }),
        ...current,
      ];
    });
    setActiveThreadId(threadId);
    setInitialText(target.initialMessage || "");
  }, [location.state]);

  useEffect(() => {
    if (!activeConversationId || !activeProductId || !activePartnerId || !user || !activeBuyerId) return undefined;
    let active = true;

    apiMessages
      .getHistory(activeProductId, activeBuyerId)
      .then((data) => {
        if (!active) return;
        const messages = Array.isArray(data) ? data : data?.messages || [];
        setThreads((current) =>
          current.map((thread) =>
            thread.id === activeConversationId ? { ...thread, messages, unread: 0 } : thread,
          ),
        );
      })
      .catch((error) => console.error("Failed to load chat history:", error));

    joinConversation?.(activeProductId, activeBuyerId);
    return () => {
      active = false;
      leaveConversation?.(activeProductId, activeBuyerId);
    };
  }, [activeConversationId, activePartnerId, activeProductId, activeBuyerId, joinConversation, leaveConversation, user]);

  const wasConnectedRef = useRef(false);

  useEffect(() => {
    if (isConnected && !wasConnectedRef.current && activeConversationId && activeProductId && activePartnerId && user && activeBuyerId) {
      joinConversation?.(activeProductId, activeBuyerId);
    }
    wasConnectedRef.current = isConnected;
  }, [isConnected, activeConversationId, activeProductId, activePartnerId, activeBuyerId, user, joinConversation]);

  const activeThreadRef = useRef(null);
  activeThreadRef.current = activeThread;

  useEffect(() => {
    if (!socket) return undefined;
    const updateMessage = (id, patch) => {
      setThreads((current) =>
        current.map((thread) => ({
          ...thread,
          messages: thread.messages.map((message) =>
            String(message.id || message._id) === String(id)
              ? { ...message, ...patch }
              : message,
          ),
        })),
      );
    };
    const handleMessage = (message) => {
      const myId = user?.id || user?._id;
      const isFromOthers = String(message.senderId) !== String(myId);
      const partnerId = isFromOthers ? String(message.senderId) : String(message.receiverId);

      if (isFromOthers) {
        const isCurrentThread = activeThreadRef.current &&
          String(activeThreadRef.current.partnerId) === partnerId;

        if (document.hidden || !isCurrentThread) {
          playMessageBeep();
        }
      }

      setThreads((current) =>
        current.map((thread) => {
          if (!thread) return thread;
          const matches = String(thread.partnerId) === partnerId;
          return matches
            ? {
                ...thread,
                productId: message.productId,
                messages: [...(thread.messages || []), message],
                lastMessage: message.content || (message.imageUrl ? "📷 [Hình ảnh]" : message.location ? "📍 [Vị trí]" : ""),
                lastSentAt: message.sentAt || message.createdAt
              }
            : thread;
        })
      );
    };
    const handleRecall = ({ id }) => updateMessage(id, { isRecalled: true, content: null });
    const handleEdit = ({ id, content }) => updateMessage(id, { content });
    const handleReaction = ({ id, reaction }) => updateMessage(id, { reaction });
    socket.on("new_message", handleMessage);
    socket.on("message_recalled", handleRecall);
    socket.on("message_edited", handleEdit);
    socket.on("message_reacted", handleReaction);
    return () => {
      socket.off("new_message", handleMessage);
      socket.off("message_recalled", handleRecall);
      socket.off("message_edited", handleEdit);
      socket.off("message_reacted", handleReaction);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeThread?.messages]);

  const togglePin = (threadId) => {
    setPinnedIds((current) => {
      const next = new Set(current);
      if (next.has(threadId)) next.delete(threadId);
      else next.add(threadId);
      localStorage.setItem("haisan-pinned-conversations", JSON.stringify([...next]));
      return next;
    });
  };

  const sendMessage = async ({ text, imageFile, replyTo: reply }) => {
    if (!activeThread || !user || (!text && !imageFile)) return false;

    if (imageFile) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!allowedTypes.includes(imageFile.type)) {
        await alert({
          title: "Định dạng không hợp lệ",
          message: "Chỉ cho phép gửi hình ảnh định dạng JPG, PNG hoặc WEBP.",
          variant: "warning"
        });
        return false;
      }
      if (imageFile.size > 2 * 1024 * 1024) {
        await alert({
          title: "Kích thước ảnh quá lớn",
          message: "Vui lòng chọn hình ảnh có dung lượng nhỏ hơn 2MB để gửi.",
          variant: "warning"
        });
        return false;
      }
    }

    setSending(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploaded = await apiMessages.uploadImage(formData);
        imageUrl = uploaded.imageUrl;
      }

      if (reply || !socket) {
        await apiMessages.send({
          productId: activeThread.productId,
          receiverId: activeThread.partnerId,
          content: text || null,
          imageUrl,
          ...(reply
            ? {
                replyTo: {
                  senderId: String(reply.senderId || ""),
                  content: reply.content || "Tin nhắn hình ảnh",
                },
              }
            : {}),
        });
      } else {
        sendChatMessage?.(
          activeThread.productId,
          activeThread.partnerId,
          text || null,
          imageUrl,
        );
      }
      setReplyTo(null);
      setInitialText("");
      return true;
    } catch (error) {
      await alert({
        title: "Lỗi gửi tin nhắn",
        message: error.message,
        variant: "danger"
      });
      return false;
    } finally {
      setSending(false);
    }
  };

  const shareLocation = () => {
    if (!activeThread || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        sendChatMessage?.(
          activeThread.productId,
          activeThread.partnerId,
          "Vị trí hiện tại của tôi",
          null,
          { latitude: coords.latitude, longitude: coords.longitude },
        ),
      async () => {
        await alert({
          title: "Lỗi vị trí",
          message: "Không thể lấy vị trí. Vui lòng kiểm tra quyền định vị.",
          variant: "warning"
        });
      },
    );
  };

  const patchMessage = (id, patch) => {
    setThreads((current) =>
      current.map((thread) =>
        thread.id === activeThreadId
          ? {
              ...thread,
              messages: thread.messages.map((message) =>
                String(message.id || message._id) === String(id)
                  ? { ...message, ...patch }
                  : message,
              ),
            }
          : thread,
      ),
    );
  };

  const recallMessage = async (message) => {
    const ok = await confirm({
      title: "Thu hồi tin nhắn?",
      message: "Bạn có chắc chắn muốn thu hồi tin nhắn này?",
      confirmText: "Thu hồi",
      variant: "warning"
    });
    if (!ok) return;
    const id = message.id || message._id;
    try {
      await apiMessages.recall(id);
      patchMessage(id, { isRecalled: true, content: null });
    } catch (error) {
      await alert({
        title: "Lỗi thu hồi",
        message: error.message,
        variant: "danger"
      });
    }
  };

  const editMessage = async (message) => {
    const content = window.prompt("Chỉnh sửa tin nhắn:", message.content || "");
    if (!content?.trim() || content.trim() === message.content) return;
    const id = message.id || message._id;
    try {
      await apiMessages.edit(id, content.trim());
      patchMessage(id, { content: content.trim() });
    } catch (error) {
      await alert({
        title: "Lỗi chỉnh sửa",
        message: error.message,
        variant: "danger"
      });
    }
  };

  const reactMessage = async (message, reaction) => {
    const id = message.id || message._id;
    try {
      await apiMessages.react(id, reaction);
      patchMessage(id, { reaction });
    } catch (error) {
      await alert({
        title: "Lỗi cảm xúc",
        message: error.message,
        variant: "danger"
      });
    }
  };


  if (!user) {
    return (
      <div className="page-state">
        <p>Bạn cần đăng nhập để trò chuyện trực tiếp với người bán.</p>
        <Link to="/login">Đăng nhập</Link>
      </div>
    );
  }
  if (loading && !activeThread) {
    return <div className="page-state">Đang tải tin nhắn...</div>;
  }

  return (
    <div className="chat-page">
      <ConversationList
        activeThreadId={activeThreadId}
        onPin={togglePin}
        onSelect={setActiveThreadId}
        pinnedIds={pinnedIds}
        threads={threads}
      />

      {activeThread ? (
        <>
          <section className="chat-window fb-chat-main-window">
            <header className="chat-window__header fb-chat-header">
              <div className="fb-chat-partner-info">
                <span className="fb-chat-partner-avatar" style={{ overflow: "hidden", display: "grid", placeItems: "center" }}>
                  {activeThread.partnerAvatar || activeThread.partnerAvatarUrl ? (
                    <img src={activeThread.partnerAvatar || activeThread.partnerAvatarUrl} alt={activeThread.partnerName || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    getInitials(nickname || activeThread.partnerName)
                  )}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <strong style={{ fontSize: "1rem", color: "#0f172a", lineHeight: "1.2" }}>{nickname || activeThread.partnerName}</strong>
                  <span className="fb-active-status" style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    {isConnected ? "Đang hoạt động" : "Hoạt động gần đây"} {activeThread.productName ? `· ${activeThread.productName}` : ""}
                  </span>
                </div>
              </div>
              <div className="chat-window__actions fb-header-actions" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  disabled={!socket || !isConnected}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("start_video_call", {
                      detail: {
                        partnerId: activeThread.partnerId,
                        partnerName: nickname || activeThread.partnerName,
                        productId: activeThread.productId
                      }
                    }));
                  }}
                  title={socket && isConnected ? "Cuộc gọi thoại" : "Socket chưa kết nối"}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#f1f5f9",
                    color: isConnected ? "#0284c7" : "#94a3b8",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isConnected ? "pointer" : "not-allowed"
                  }}
                >
                  <Phone size={18} />
                </button>

                <button
                  aria-label="Gọi video"
                  disabled={!socket || !isConnected}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("start_video_call", {
                      detail: {
                        partnerId: activeThread.partnerId,
                        partnerName: nickname || activeThread.partnerName,
                        productId: activeThread.productId
                      }
                    }));
                  }}
                  title={socket && isConnected ? "Gọi video" : "Socket chưa kết nối"}
                  type="button"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#f1f5f9",
                    color: isConnected ? "#0284c7" : "#94a3b8",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isConnected ? "pointer" : "not-allowed"
                  }}
                >
                  <Video size={18} />
                </button>

                {(!socket || !isConnected) && (
                  <span className="socket-status" style={{ color: "#ef4444", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
                    <AlertCircle size={14} /> Ngoại tuyến
                  </span>
                )}
              </div>
            </header>

            {(!socket || !isConnected) && (
              <div className="chat-offline-banner" style={{ background: "rgba(239, 68, 68, 0.08)", borderBottom: "1px solid rgba(239, 68, 68, 0.15)", color: "#ef4444", padding: "10px 16px", fontSize: "0.88rem", display: "flex", gap: "8px", alignItems: "center", fontWeight: "500" }}>
                <AlertCircle size={16} /> Mất kết nối máy chủ chat thời gian thực. Đang kết nối lại...
              </div>
            )}

            {showSearchBox && (
              <div style={{ padding: "8px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "8px", alignItems: "center" }}>
                <Search size={16} color="#64748b" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nội dung tin nhắn trong cuộc trò chuyện..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
                <button type="button" onClick={() => { setSearchQuery(""); setShowSearchBox(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                  <X size={16} />
                </button>
              </div>
            )}

            {showWarning && (
              <div className="chat-trade-warning-banner" style={{ background: "rgba(245, 158, 11, 0.08)", borderBottom: "1px solid rgba(245, 158, 11, 0.15)", color: "#d97706", padding: "10px 16px", fontSize: "0.83rem", display: "flex", gap: "8px", alignItems: "center", justifyContent: "space-between", fontWeight: "500", lineHeight: "1.4" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Cảnh báo an toàn:</strong> HảiSản.vn không xử lý thanh toán và vận chuyển. Vui lòng tự kiểm tra kỹ hàng hóa trước khi giao dịch trực tiếp, tuyệt đối không chuyển khoản đặt cọc trước cho người lạ.
                  </span>
                </div>
                <button 
                  onClick={dismissWarning} 
                  style={{ background: "transparent", border: 0, color: "#d97706", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.8 }}
                  type="button"
                  aria-label="Đóng cảnh báo"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="chat-window__messages">
              {(activeThread.messages || [])
                .filter(Boolean)
                .filter((msg) => !searchQuery.trim() || msg.content?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((message, index) => (
                  <MessageBubble
                    isMine={String(message.senderId) === String(user.id || user._id)}
                    key={message.id || message._id || index}
                    message={message}
                    onEdit={editMessage}
                    onReact={reactMessage}
                    onRecall={recallMessage}
                    onReply={setReplyTo}
                  />
                ))}
              {activeThread.messages.length === 0 && (
                <p className="chat-window__empty">
                  Hãy bắt đầu bằng một câu hỏi rõ ràng về mẻ hàng, giá hoặc thời gian nhận hàng.
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>

            <ChatComposer
              initialText={initialText}
              onCancelReply={() => setReplyTo(null)}
              onSend={sendMessage}
              onShareLocation={shareLocation}
              replyTo={replyTo}
              sending={sending}
            />
          </section>

          {/* Facebook Messenger Right Column Details Panel */}
          <aside className="fb-chat-info-sidebar">
            <div className="fb-info-profile-section">
              <div className="fb-info-avatar-lg" style={{ overflow: "hidden", display: "grid", placeItems: "center" }}>
                {activeThread.partnerAvatar || activeThread.partnerAvatarUrl ? (
                  <img src={activeThread.partnerAvatar || activeThread.partnerAvatarUrl} alt={activeThread.partnerName || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  getInitials(nickname || activeThread.partnerName)
                )}
              </div>
              <h2 className="fb-info-name">{nickname || activeThread.partnerName}</h2>
              <span className="fb-info-status">{isConnected ? "Đang hoạt động" : "Hoạt động gần đây"}</span>
              <div className="fb-encrypted-badge">🔒 Bảo mật kết nối thời gian thực</div>

              <div className="fb-info-quick-actions">
                <Link to={`/fisherman/${activeThread.partnerId}`} className="fb-info-action-btn" title="Trang cá nhân">
                  <div className="fb-circle-sm-btn"><User size={18} /></div>
                  <span>Hồ sơ cá nhân</span>
                </Link>
                <button type="button" className="fb-info-action-btn" onClick={() => setIsMuted(!isMuted)} title={isMuted ? "Bật thông báo" : "Tắt thông báo"}>
                  <div className="fb-circle-sm-btn" style={{ background: isMuted ? "#fee2e2" : undefined, color: isMuted ? "#ef4444" : undefined }}>
                    <BellOff size={18} />
                  </div>
                  <span>{isMuted ? "Đã tắt TV" : "Tắt thông báo"}</span>
                </button>
                <button type="button" className="fb-info-action-btn" onClick={() => setShowSearchBox(!showSearchBox)} title="Tìm kiếm tin nhắn">
                  <div className="fb-circle-sm-btn"><Search size={18} /></div>
                  <span>Tìm kiếm</span>
                </button>
              </div>
            </div>

            <div className="fb-info-accordion-list">
              <details open className="fb-info-accordion">
                <summary>
                  <span>Thông tin về đoạn chat</span>
                  <ChevronDown size={16} />
                </summary>
                <div className="fb-accordion-content">
                  <div className="fb-info-item" style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "6px 0" }}>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Sản phẩm quan tâm:</span>
                    <strong style={{ fontSize: "0.95rem", color: "#0284c7", fontWeight: "700" }}>{activeThread.productName || "Mẻ hải sản"}</strong>
                  </div>
                  {activeThread.productPrice > 0 && (
                    <div className="fb-info-item" style={{ marginTop: "6px" }}>
                      <span>Giá niêm yết</span>
                      <strong style={{ color: "#0284c7" }}>{activeThread.productPrice.toLocaleString("vi-VN")}đ / kg</strong>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </aside>
        </>
      ) : (
        <section className="chat-window chat-window--empty">
          <MessageSquareIcon />
          <p>Chọn một cuộc trò chuyện để xem tin nhắn.</p>
        </section>
      )}

    </div>
  );
}

function MessageSquareIcon() {
  return <PackageOpen size={38} />;
}
