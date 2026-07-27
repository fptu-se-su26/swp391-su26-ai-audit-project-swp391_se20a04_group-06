import { useState } from "react";
import { Pin, Search, MoreHorizontal, Edit, CheckCircle } from "lucide-react";

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

function formatConversationTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function ConversationList({
  activeThreadId,
  onPin,
  onSelect,
  pinnedIds,
  threads,
}) {
  const [filter, setFilter] = useState("all"); // "all" | "unread" | "group"
  const [search, setSearch] = useState("");

  const filteredThreads = (threads || []).filter(Boolean).filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = t.partnerName?.toLowerCase().includes(q);
      const matchProduct = t.productName?.toLowerCase().includes(q);
      if (!matchName && !matchProduct) return false;
    }
    if (filter === "unread") return t.unread > 0;
    return true;
  });

  const orderedThreads = [...filteredThreads].sort((left, right) => {
    const leftPinned = pinnedIds?.has?.(left.id) ? 1 : 0;
    const rightPinned = pinnedIds?.has?.(right.id) ? 1 : 0;
    if (leftPinned !== rightPinned) return rightPinned - leftPinned;
    return new Date(right.lastSentAt || 0) - new Date(left.lastSentAt || 0);
  });

  return (
    <aside className="conversation-list fb-chat-sidebar">
      <header className="fb-sidebar-header">
        <div className="fb-sidebar-title-row">
          <h1 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>Đoạn chat</h1>
        </div>

        <div className="fb-sidebar-search">
          <Search size={16} className="fb-search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm trên Messenger"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="fb-sidebar-filter-pills">
          <button
            type="button"
            className={`fb-pill-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={`fb-pill-btn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Chưa đọc
          </button>
          <button
            type="button"
            className={`fb-pill-btn ${filter === "group" ? "active" : ""}`}
            onClick={() => setFilter("group")}
          >
            Nhóm
          </button>
        </div>
      </header>

      <div className="conversation-list__items fb-chat-list">
        {orderedThreads.map((thread) => {
          const lastMessage = thread.messages?.at(-1);
          const preview = lastMessage?.content || thread.lastMessage || "Chưa có tin nhắn";
          const active = thread.id === activeThreadId;

          return (
            <div className={`conversation-row fb-chat-item ${active ? "is-active" : ""}`} key={thread.id}>
              <button className="conversation-row__main" onClick={() => onSelect(thread.id)} type="button">
                <div className="fb-avatar-online-wrapper">
                  <span className="conversation-row__avatar" style={{ overflow: "hidden", display: "grid", placeItems: "center" }}>
                    {thread.partnerAvatar || thread.partnerAvatarUrl ? (
                      <img src={thread.partnerAvatar || thread.partnerAvatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      getInitials(thread.partnerName)
                    )}
                  </span>
                  <span className="fb-online-badge" />
                </div>

                <span className="conversation-row__copy">
                  <span className="fb-chat-name-row">
                    <strong>{thread.partnerName || "Người dùng"}</strong>
                    <time>{formatConversationTime(lastMessage?.sentAt || thread.lastSentAt)}</time>
                  </span>
                  <small className="fb-chat-product-tag">{thread.productName || "Mẻ hải sản"}</small>
                  <span className="conversation-row__preview">{preview}</span>
                </span>
                {thread.unread > 0 && <b className="conversation-row__unread">{thread.unread}</b>}
              </button>
              <button
                aria-label={pinnedIds.has(thread.id) ? "Bỏ ghim hội thoại" : "Ghim hội thoại"}
                className={`conversation-row__pin ${pinnedIds.has(thread.id) ? "is-pinned" : ""}`}
                onClick={() => onPin(thread.id)}
                type="button"
              >
                <Pin size={14} />
              </button>
            </div>
          );
        })}

        {orderedThreads.length === 0 && (
          <p className="conversation-list__empty">
            Chưa có cuộc trò chuyện. Hãy mở một mẻ hàng và nhắn trực tiếp cho người bán.
          </p>
        )}
      </div>
    </aside>
  );
}

