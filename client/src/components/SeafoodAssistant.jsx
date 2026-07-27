import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bot, Send, X } from "lucide-react";
import { apiAssistant } from "../services/api";

const allowedTopics = [
  "hai san", "ca ", "tom", "cua", "ghe", "muc", "so ", "oc ", "ngheu",
  "gia", "bao quan", "tuoi", "dong lanh", "che bien", "nau", "nguon goc",
  "danh bat", "so che", "premium",
];

const suggestedQuestions = [
  { icon: "🐟", text: "Cách chọn cá tươi như thế nào?" },
  { icon: "🍤", text: "Làm sao biết tôm còn tươi?" },
  { icon: "❄️", text: "Cách bảo quản hải sản khi chưa nấu?" },
  { icon: "🧊", text: "Cá tươi để tủ lạnh được bao lâu?" },
  { icon: "🍲", text: "Gợi ý món ngon từ cá thu" },
  { icon: "🦑", text: "Mực lá nên nấu món gì?" },
  { icon: "📍", text: "Cách tìm hải sản gần tôi?" },
  { icon: "⭐", text: "Premium có lợi ích gì?" },
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
      content: "Xin chào! Tôi hỗ trợ về hải sản, giá bán, bảo quan, chế biến và nguồn gốc.",
    },
  ]);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const hasUserMessage = history.some((entry) => entry.role === "user");

  // Draggable position state
  const dragRef = useRef(null);
  const draggedRef = useRef(false);
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem("chatbotPosition");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.x && parsed.x > 200) {
          return {
            x: Math.max(10, Math.min(parsed.x, window.innerWidth - 70)),
            y: Math.max(10, Math.min(parsed.y, window.innerHeight - 70))
          };
        }
      }
    } catch {}
    // Default: bottom-right (80px from right, bottom of screen)
    return { x: Math.max(10, window.innerWidth - 80), y: Math.max(10, window.innerHeight - 100) };
  });

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => ({
        x: Math.max(10, Math.min(current.x, window.innerWidth - 70)),
        y: Math.max(10, Math.min(current.y, window.innerHeight - 70))
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    draggedRef.current = false;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = position.x;
    const startPosY = position.y;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        draggedRef.current = true;
      }
      const newX = Math.max(10, Math.min(startPosX + dx, window.innerWidth - 70));
      const newY = Math.max(10, Math.min(startPosY + dy, window.innerHeight - 70));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = (upEvent) => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (draggedRef.current) {
        const dx = upEvent.clientX - startX;
        const dy = upEvent.clientY - startY;
        const finalX = Math.max(10, Math.min(startPosX + dx, window.innerWidth - 70));
        const finalY = Math.max(10, Math.min(startPosY + dy, window.innerHeight - 70));
        setPosition({ x: finalX, y: finalY });
        localStorage.setItem("chatbotPosition", JSON.stringify({ x: finalX, y: finalY }));
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e) => {
    draggedRef.current = false;
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const startPosX = position.x;
    const startPosY = position.y;

    const handleTouchMove = (moveEvent) => {
      const touchMove = moveEvent.touches[0];
      const dx = touchMove.clientX - startX;
      const dy = touchMove.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        draggedRef.current = true;
      }
      const newX = Math.max(10, Math.min(startPosX + dx, window.innerWidth - 70));
      const newY = Math.max(10, Math.min(startPosY + dy, window.innerHeight - 70));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = (endEvent) => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      if (draggedRef.current) {
        const touchEnd = endEvent.changedTouches[0] || endEvent.touches[0];
        if (touchEnd) {
          const dx = touchEnd.clientX - startX;
          const dy = touchEnd.clientY - startY;
          const finalX = Math.max(10, Math.min(startPosX + dx, window.innerWidth - 70));
          const finalY = Math.max(10, Math.min(startPosY + dy, window.innerHeight - 70));
          setPosition({ x: finalX, y: finalY });
          localStorage.setItem("chatbotPosition", JSON.stringify({ x: finalX, y: finalY }));
        }
      }
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);
  };

  const sendQuestion = useCallback(async (value) => {
    const question = value.trim();
    if (!question || sendingRef.current) return;

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
    sendingRef.current = true;
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
      sendingRef.current = false;
      setSending(false);
    }
  }, [history]);

  useEffect(() => {
    const handleContextQuestion = (event) => {
      const question = event.detail?.question;
      if (typeof question !== "string" || !question.trim()) return;
      setOpen(true);
      void sendQuestion(question);
    };
    window.addEventListener("haisan:assistant-question", handleContextQuestion);
    return () =>
      window.removeEventListener(
        "haisan:assistant-question",
        handleContextQuestion,
      );
  }, [sendQuestion]);

  useEffect(() => {
    const openAssistant = () => setOpen(true);
    window.addEventListener("haisan:open-ai-assistant", openAssistant);
    return () =>
      window.removeEventListener("haisan:open-ai-assistant", openAssistant);
  }, []);

  const submit = (event) => {
    event.preventDefault();
    void sendQuestion(message);
  };

  const handleSuggestedQuestionClick = (question) => {
    void sendQuestion(question);
  };

  const toggleAssistant = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("haisan:ai-assistant-opened"),
        );
      }, 0);
    }
  };

  const handleLauncherClick = (e) => {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    toggleAssistant();
  };

  const isLeft = position.x < window.innerWidth / 2;
  const isTop = position.y < window.innerHeight / 2;

  return createPortal(
    <div
      className="seafood-assistant"
      ref={dragRef}
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        right: "auto",
        bottom: "auto",
        zIndex: 9999,
        touchAction: "none"
      }}
    >
      {open && (
        <section
          className="seafood-assistant__panel"
          aria-label="Trợ lý Hải Sản AI"
          data-tour="ai-panel"
          style={{
            position: "absolute",
            left: isLeft ? "0" : "auto",
            right: isLeft ? "auto" : "0",
            top: isTop ? "64px" : "auto",
            bottom: isTop ? "auto" : "64px",
            margin: 0
          }}
        >
          <header>
            <span><Bot size={19} /></span>
            <div><strong>Trợ lý Hải Sản AI</strong><small>Chuyên gia hải sản</small></div>
            <button aria-label="Đóng trợ lý" onClick={() => setOpen(false)} type="button"><X size={18} /></button>
          </header>
          <div className="seafood-assistant__messages" aria-live="polite">
            {history.map((entry, index) => (
              <p className={entry.role === "user" ? "is-user" : ""} key={`${entry.role}-${index}`}>
                {entry.content}
              </p>
            ))}
            {!hasUserMessage && (
              <section
                aria-labelledby="seafood-assistant-suggestions-title"
                className="seafood-assistant__suggestions"
                data-tour="ai-suggested-questions"
              >
                <strong id="seafood-assistant-suggestions-title">
                  Bạn có thể hỏi AI
                </strong>
                <div className="seafood-assistant__suggestion-list">
                  {suggestedQuestions.map((suggestion) => (
                    <button
                      className="seafood-assistant__suggestion-chip"
                      disabled={sending}
                      key={suggestion.text}
                      onClick={() => handleSuggestedQuestionClick(suggestion.text)}
                      type="button"
                    >
                      <span aria-hidden="true">{suggestion.icon}</span>
                      {suggestion.text}
                    </button>
                  ))}
                </div>
              </section>
            )}
            {sending && <p>Đang tìm câu trả lời...</p>}
          </div>
          <form onSubmit={submit}>
            <input
              aria-label="Câu hỏi cho trợ lý hải sản"
              data-tour="ai-input"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Hỏi về hải sản..."
              value={message}
            />
            <button aria-label="Gửi câu hỏi" data-tour="ai-send-button" disabled={sending} type="submit"><Send size={17} /></button>
          </form>
        </section>
      )}
      <button
        aria-expanded={open}
        aria-label={open ? "Đóng Trợ lý AI" : "Mở Trợ lý AI"}
        className="seafood-assistant__launcher"
        data-tour="ai-launcher"
        data-tooltip={open ? "Đóng trợ lý AI" : "Trợ lý AI"}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleLauncherClick}
        title="Trợ lý AI"
        type="button"
      >
        {open ? <X size={22} /> : <Bot size={23} />}
      </button>
    </div>,
    document.body
  );
}
