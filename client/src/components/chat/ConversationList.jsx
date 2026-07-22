import { Pin } from "lucide-react";

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
  const orderedThreads = [...(threads || [])].filter(Boolean).sort((left, right) => {
    const leftPinned = pinnedIds?.has?.(left.id) ? 1 : 0;
    const rightPinned = pinnedIds?.has?.(right.id) ? 1 : 0;
    if (leftPinned !== rightPinned) return rightPinned - leftPinned;
    return new Date(right.lastSentAt || 0) - new Date(left.lastSentAt || 0);
  });

  return (
    <aside className="conversation-list">
      <header>
        <span className="eyebrow">CHỢ HẢI SẢN TRỰC TIẾP</span>
        <h1>Tin nhắn</h1>
      </header>

      <div className="conversation-list__items">
        {orderedThreads.filter(Boolean).map((thread) => {
          const lastMessage = thread.messages?.at(-1);
          const preview = lastMessage?.content || thread.lastMessage || "Chưa có tin nhắn";
          const active = thread.id === activeThreadId;

          return (
            <div className={`conversation-row ${active ? "is-active" : ""}`} key={thread.id}>
              <button className="conversation-row__main" onClick={() => onSelect(thread.id)} type="button">
                <span className="conversation-row__avatar">
                  {(thread.partnerName || "ND").slice(0, 2).toUpperCase()}
                </span>
                <span className="conversation-row__copy">
                  <span>
                    <strong>{thread.partnerName || "Người dùng"}</strong>
                    <time>{formatConversationTime(lastMessage?.sentAt || thread.lastSentAt)}</time>
                  </span>
                  <small>{thread.productName || "Mẻ hải sản"}</small>
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

        {threads.length === 0 && (
          <p className="conversation-list__empty">
            Chưa có cuộc trò chuyện. Hãy mở một mẻ hàng và nhắn trực tiếp cho người bán.
          </p>
        )}
      </div>
    </aside>
  );
}
