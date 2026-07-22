import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, PackageOpen, X, Video } from "lucide-react";
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
  const [showWarning, setShowWarning] = useState(() => {
    return localStorage.getItem("haisan-chat-warning-dismissed") !== "true";
  });

  const dismissWarning = () => {
    setShowWarning(false);
    localStorage.setItem("haisan-chat-warning-dismissed", "true");
  };
  const messagesEndRef = useRef(null);

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
        <section className="chat-window">
          <header className="chat-window__header">
            <div>
              <strong>{activeThread.partnerName}</strong>
              <span><PackageOpen size={14} /> {activeThread.productName}</span>
            </div>
            <div className="chat-window__actions">
              <button
                aria-label="Gọi video"
                className="video-call-trigger"
                disabled={!socket || !isConnected}
                onClick={() => {
                  console.log("[Chat.jsx] Video call clicked", {
                    partnerId: activeThread?.partnerId,
                    partnerName: activeThread?.partnerName,
                    productId: activeThread?.productId
                  });
                  window.dispatchEvent(new CustomEvent("start_video_call", {
                    detail: {
                      partnerId: activeThread.partnerId,
                      partnerName: activeThread.partnerName,
                      productId: activeThread.productId
                    }
                  }));
                }}
                title={socket && isConnected ? "Gọi video" : "Socket chưa kết nối"}
                type="button"
              >
                <Video size={18} /> Gọi video
              </button>
              {(!socket || !isConnected) && (
                <span className="socket-status" style={{ color: "#ef4444" }}><AlertCircle size={14} /> Ngoại tuyến</span>
              )}
            </div>
          </header>

          {(!socket || !isConnected) && (
            <div className="chat-offline-banner" style={{ background: "rgba(239, 68, 68, 0.08)", borderBottom: "1px solid rgba(239, 68, 68, 0.15)", color: "#ef4444", padding: "10px 16px", fontSize: "0.88rem", display: "flex", gap: "8px", alignItems: "center", fontWeight: "500" }}>
              <AlertCircle size={16} /> Mất kết nối máy chủ chat thời gian thực. Đang kết nối lại...
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
            {(activeThread.messages || []).filter(Boolean).map((message, index) => (
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
