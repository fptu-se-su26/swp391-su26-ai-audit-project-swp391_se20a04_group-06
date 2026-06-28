import { useEffect, useRef, useState } from "react";
import { ImagePlus, MapPin, Send, Smile, X } from "lucide-react";

const emojis = ["😀", "👍", "🦐", "🐟", "🦀", "❤️", "🔥", "⛵"];

export default function ChatComposer({
  initialText = "",
  onSend,
  onShareLocation,
  replyTo,
  onCancelReply,
  sending,
}) {
  const [text, setText] = useState(initialText);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => setText(initialText), [initialText]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const submit = async (event) => {
    event.preventDefault();
    if (!text.trim() && !imageFile) return;
    const sent = await onSend({ text: text.trim(), imageFile, replyTo });
    if (sent) {
      setText("");
      setImageFile(null);
      setEmojiOpen(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="chat-composer-wrap">
      {replyTo && (
        <div className="chat-reply-preview">
          <span>
            <strong>Đang trả lời</strong>
            {replyTo.content || "Tin nhắn hình ảnh"}
          </span>
          <button aria-label="Hủy trả lời" onClick={onCancelReply} type="button"><X size={16} /></button>
        </div>
      )}

      {imagePreview && (
        <div className="chat-image-preview">
          <img src={imagePreview} alt="Ảnh sắp gửi" />
          <button aria-label="Bỏ ảnh" onClick={() => setImageFile(null)} type="button"><X size={15} /></button>
        </div>
      )}

      {emojiOpen && (
        <div className="chat-emoji-picker">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setText((current) => `${current}${emoji}`);
                setEmojiOpen(false);
              }}
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <form className="chat-composer" onSubmit={submit}>
        <button
          aria-label="Chọn emoji"
          className="chat-composer__tool"
          onClick={() => setEmojiOpen((open) => !open)}
          type="button"
        >
          <Smile size={20} />
        </button>
        <button
          aria-label="Chọn ảnh"
          className="chat-composer__tool"
          onClick={() => fileRef.current?.click()}
          type="button"
        >
          <ImagePlus size={20} />
        </button>
        <input
          accept="image/*"
          className="visually-hidden"
          onChange={(event) => setImageFile(event.target.files?.[0] || null)}
          ref={fileRef}
          type="file"
        />
        <button
          aria-label="Chia sẻ vị trí"
          className="chat-composer__tool"
          onClick={onShareLocation}
          type="button"
        >
          <MapPin size={20} />
        </button>
        <input
          aria-label="Nội dung tin nhắn"
          maxLength={1000}
          onChange={(event) => setText(event.target.value)}
          placeholder="Nhập tin nhắn cho người bán..."
          type="text"
          value={text}
        />
        <button
          aria-label="Gửi tin nhắn"
          className="chat-composer__send"
          disabled={sending || (!text.trim() && !imageFile)}
          type="submit"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
