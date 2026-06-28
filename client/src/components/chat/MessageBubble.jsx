import { CheckCheck, CornerUpLeft, MapPin } from "lucide-react";

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ isMine, message, onReply }) {
  return (
    <article className={`message-bubble ${isMine ? "is-mine" : ""}`}>
      <div className="message-bubble__content">
        {message.replyTo && (
          <blockquote>
            <strong>Tin nhắn được trả lời</strong>
            <span>{message.replyTo.content}</span>
          </blockquote>
        )}

        {message.isRecalled ? (
          <em>Tin nhắn đã được thu hồi</em>
        ) : (
          <>
            {message.imageUrl && (
              <a href={message.imageUrl} rel="noreferrer" target="_blank">
                <img src={message.imageUrl} alt="Ảnh trong cuộc trò chuyện" />
              </a>
            )}
            {message.content && <p>{message.content}</p>}
            {message.location && (
              <a
                className="message-location"
                href={`https://www.openstreetmap.org/?mlat=${message.location.latitude}&mlon=${message.location.longitude}#map=15/${message.location.latitude}/${message.location.longitude}`}
                rel="noreferrer"
                target="_blank"
              >
                <MapPin size={15} /> Xem vị trí trên bản đồ
              </a>
            )}
          </>
        )}
      </div>

      <footer>
        <time>{formatTime(message.sentAt || message.createdAt)}</time>
        {isMine && (
          <span className={message.isRead ? "is-read" : ""}>
            <CheckCheck size={13} /> {message.isRead ? "Đã xem" : "Đã gửi"}
          </span>
        )}
        {!message.isRecalled && (
          <button onClick={() => onReply(message)} type="button">
            <CornerUpLeft size={13} /> Trả lời
          </button>
        )}
      </footer>
    </article>
  );
}
