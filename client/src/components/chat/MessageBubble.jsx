import { memo } from "react";
import {
  CheckCheck,
  CornerUpLeft,
  MapPin,
  Pencil,
  RotateCcw,
  Smile,
} from "lucide-react";

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({
  isMine,
  message,
  onEdit,
  onReact,
  onRecall,
  onReply,
}) {
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
                <img src={message.imageUrl} alt="Ảnh trong cuộc trò chuyện" loading="lazy" />
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
        {message.reaction && <span className="message-reaction">{message.reaction}</span>}
      </div>

      <footer>
        <time>{formatTime(message.sentAt || message.createdAt)}</time>
        {isMine && (
          <span className={message.isRead ? "is-read" : ""}>
            <CheckCheck size={13} /> {message.isRead ? "Đã xem" : "Đã gửi"}
          </span>
        )}
        {!message.isRecalled && (
          <>
            <button onClick={() => onReply(message)} type="button">
              <CornerUpLeft size={13} /> Trả lời
            </button>
            <button onClick={() => onReact(message, message.reaction ? null : "❤️")} type="button">
              <Smile size={13} /> Cảm xúc
            </button>
            {isMine && message.content && (
              <button onClick={() => onEdit(message)} type="button">
                <Pencil size={13} /> Sửa
              </button>
            )}
            {isMine && (
              <button onClick={() => onRecall(message)} type="button">
                <RotateCcw size={13} /> Thu hồi
              </button>
            )}
          </>
        )}
      </footer>
    </article>
  );
}

export default memo(MessageBubble);
