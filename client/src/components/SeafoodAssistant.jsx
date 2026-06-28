import { useState } from "react";
import { Bot, Send, X } from "lucide-react";
import { apiAssistant } from "../services/api";

const allowedTopics = [
  "hai san", "ca ", "tom", "cua", "ghe", "muc", "so ", "oc ", "ngheu",
  "gia", "bao quan", "tuoi", "dong lanh", "che bien", "nau", "nguon goc",
  "danh bat", "so che",
];

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}

function isSeafoodQuestion(message) {
  const normalized = ` ${normalizeText(message)} `;
  return allowedTopics.some((topic) => normalized.includes(topic));
}

export default function SeafoodAssistant() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([
    {
      role: "assistant",
      content: "Xin chào! Tôi hỗ trợ về hải sản, giá bán, bảo quản, chế biến và nguồn gốc.",
    },
  ]);
  const [sending, setSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const question = message.trim();
    if (!question) return;
    setMessage("");
    const userEntry = { role: "user", content: question };

    if (!isSeafoodQuestion(question)) {
      setHistory((current) => [
        ...current,
        userEntry,
        {
          role: "assistant",
          content: "Tôi chỉ có thể hỗ trợ các chủ đề về hải sản, giá bán, bảo quản, chế biến và nguồn gốc.",
        },
      ]);
      return;
    }

    setHistory((current) => [...current, userEntry]);
    setSending(true);
    try {
      const result = await apiAssistant.ask(question, history.slice(-8));
      setHistory((current) => [
        ...current,
        { role: "assistant", content: result.reply || "Tôi chưa thể trả lời lúc này." },
      ]);
    } catch (error) {
      setHistory((current) => [
        ...current,
        { role: "assistant", content: error.message },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="seafood-assistant">
      {open && (
        <section className="seafood-assistant__panel" aria-label="Seafood AI Assistant">
          <header>
            <span><Bot size={19} /></span>
            <div><strong>Seafood AI Assistant</strong><small>Chuyên gia hải sản</small></div>
            <button aria-label="Đóng trợ lý" onClick={() => setOpen(false)} type="button"><X size={18} /></button>
          </header>
          <div className="seafood-assistant__messages">
            {history.map((entry, index) => (
              <p className={entry.role === "user" ? "is-user" : ""} key={`${entry.role}-${index}`}>
                {entry.content}
              </p>
            ))}
            {sending && <p>Đang tìm câu trả lời...</p>}
          </div>
          <form onSubmit={submit}>
            <input
              aria-label="Câu hỏi cho trợ lý hải sản"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Hỏi về hải sản..."
              value={message}
            />
            <button aria-label="Gửi câu hỏi" disabled={sending} type="submit"><Send size={17} /></button>
          </form>
        </section>
      )}
      <button
        aria-expanded={open}
        aria-label="Mở Seafood AI Assistant"
        className="seafood-assistant__launcher"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? <X size={22} /> : <Bot size={23} />}
      </button>
    </div>
  );
}
