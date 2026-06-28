import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, PackageOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import ChatComposer from "../components/chat/ChatComposer";
import ConversationList from "../components/chat/ConversationList";
import MessageBubble from "../components/chat/MessageBubble";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { apiMessages } from "../services/api";

function normalizeConversation(conversation) {
  const partnerId = conversation.otherUserId || conversation.partnerId;
  const productId = conversation.productId;
  return {
    ...conversation,
    id: conversation.id || `${productId}:${partnerId}`,
    partnerId,
    partnerName: conversation.otherUserName || conversation.partnerName || "Người dùng",
    productId,
    messages: conversation.messages || [],
  };
}

export default function Chat() {
  const { user } = useAuth();
  const location = useLocation();
  const { socket, joinConversation, leaveConversation, sendChatMessage } = useSocket() || {};
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [initialText, setInitialText] = useState("");
  const [pinnedIds, setPinnedIds] = useState(
    () => new Set(JSON.parse(localStorage.getItem("haisan-pinned-conversations") || "[]")),
  );
  const routeHandledRef = useRef("");
  const messagesEndRef = useRef(null);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) || null,
    [activeThreadId, threads],
  );
  const activeConversationId = activeThread?.id;
  const activeProductId = activeThread?.productId;
  const activePartnerId = activeThread?.partnerId;

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
        setThreads(nextThreads);
        setActiveThreadId((current) => current || nextThreads[0]?.id || "");
      })
      .catch((error) => console.error("Failed to load conversations:", error))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    const target = location.state;
    if (!target?.startChatWith) return;

    const productId = target.productId || "";
    const threadId = `${productId}:${target.startChatWith}`;
    if (routeHandledRef.current === threadId) return;
    routeHandledRef.current = threadId;
    setThreads((current) => {
      if (current.some((thread) => thread.id === threadId)) return current;
      return [
        normalizeConversation({
          id: threadId,
          productId,
          productName: target.productName || "Mẻ hải sản",
          productPrice: target.productPrice || 0,
          partnerId: target.startChatWith,
          partnerName: target.sellerName || "Ngư dân",
          messages: [],
        }),
        ...current,
      ];
    });
    setActiveThreadId(threadId);
    setInitialText(target.initialMessage || "");
  }, [location.state]);

  useEffect(() => {
    if (!activeConversationId || !activeProductId || !activePartnerId || !user) return undefined;
    const myId = user.id || user._id;
    const buyerId = ["Seller", "seller"].includes(user.role)
      ? activePartnerId
      : myId;
    let active = true;

    apiMessages
      .getHistory(activeProductId, buyerId)
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

    joinConversation?.(activeProductId, buyerId);
    return () => {
      active = false;
      leaveConversation?.(activeProductId, buyerId);
    };
  }, [activeConversationId, activePartnerId, activeProductId, joinConversation, leaveConversation, user]);

  useEffect(() => {
    if (!socket) return undefined;
    const handleMessage = (message) => {
      setThreads((current) =>
        current.map((thread) =>
          thread.productId === message.productId &&
          [message.senderId, message.receiverId].map(String).includes(String(thread.partnerId))
            ? { ...thread, messages: [...thread.messages, message], lastMessage: message.content }
            : thread,
        ),
      );
    };
    socket.on("new_message", handleMessage);
    return () => socket.off("new_message", handleMessage);
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
      window.alert(`Không thể gửi tin nhắn: ${error.message}`);
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
      () => window.alert("Không thể lấy vị trí. Vui lòng kiểm tra quyền định vị."),
    );
  };

  if (!user) {
    return (
      <div className="page-state">
        <p>Bạn cần đăng nhập để trò chuyện trực tiếp với người bán.</p>
        <Link to="/login">Đăng nhập</Link>
      </div>
    );
  }
  if (loading) return <div className="page-state">Đang tải tin nhắn...</div>;

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
              {activeThread.isTyping && <small>Đang nhập...</small>}
            </div>
            {!socket && (
              <span className="socket-status"><AlertCircle size={14} /> Mất kết nối realtime</span>
            )}
          </header>

          <div className="chat-window__messages">
            {activeThread.messages.map((message, index) => (
              <MessageBubble
                isMine={String(message.senderId) === String(user.id || user._id)}
                key={message.id || message._id || index}
                message={message}
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
