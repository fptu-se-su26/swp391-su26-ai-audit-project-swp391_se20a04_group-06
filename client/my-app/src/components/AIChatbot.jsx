import React, { useState, useEffect, useRef } from "react";
import { C, S } from "../utils/theme";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

export function AIChatbot() {
    const toast = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: "model",
            text: "Xin chào! 🐟 Tôi là Trợ lý Hải Sản. Bạn có cần tôi tư vấn cách chọn hải sản tươi ngon hay hướng dẫn sử dụng các chức năng trên HảiSản.vn không?",
            time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userText = input.trim();
        setInput("");
        const currentTime = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

        // Thêm tin nhắn của user vào giao diện cục bộ
        const updatedMessages = [...messages, { role: "user", text: userText, time: currentTime }];
        setMessages(updatedMessages);
        setLoading(true);

        try {
            // SỬA TẠI ĐÂY: Sử dụng 'messages' thay vì 'updatedMessages'
            // để lọc bỏ tin nhắn hiện tại ra khỏi lịch sử quá khứ gửi lên API
            const chatHistory = messages
                .filter((_, idx) => idx > 0) // Loại bỏ tin nhắn chào mừng mặc định của model
                .map((m) => ({
                    role: m.role === "model" ? "model" : "user",
                    parts: [{ text: m.text }],
                }));

            // Gửi mảng chatHistory đã được làm sạch lên Backend
            const response = await api("/chatbot", {
                method: "POST",
                body: JSON.stringify({ message: userText, history: chatHistory }),
            });

            setMessages((prev) => [
                ...prev,
                {
                    role: "model",
                    text: response.reply,
                    time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
                },
            ]);
        } catch (err) {
            toast.error(err.message || "Lỗi kết nối với Trợ lý AI.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", bottom: 24, left: 24, zIndex: 9999, fontFamily: "inherit" }}>
            {/* Nút bong bóng chat thu nhỏ */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 8px 24px rgba(11, 79, 108, 0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 26,
                        transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08) translateY(-2px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                >
                    🤖
                </button>
            )}

            {/* Khung chat bot phóng to */}
            {isOpen && (
                <div
                    style={{
                        width: 350,
                        height: 480,
                        background: C.white,
                        borderRadius: 16,
                        boxShadow: S.xl,
                        border: `1px solid ${C.border}`,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        animation: "slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: "14px 18px",
                            background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
                            color: "#fff",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 22 }}>🤖</span>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 13.5 }}>Trợ Lý Hải Sản AI</div>
                                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                                    🟢 Trực tuyến 24/7
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#fff",
                                fontSize: 18,
                                cursor: "pointer",
                                padding: "2px 6px",
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            padding: "16px",
                            background: "#F8FAFC",
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                        }}
                    >
                        {messages.map((m, idx) => {
                            const isAI = m.role === "model";
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        display: "flex",
                                        justifyContent: isAI ? "flex-start" : "flex-end",
                                    }}
                                >
                                    <div
                                        style={{
                                            maxWidth: "85%",
                                            background: isAI ? C.white : C.ocean,
                                            color: isAI ? C.dark : "#fff",
                                            padding: "10px 14px",
                                            borderRadius: isAI ? "12px 12px 12px 0px" : "12px 12px 0px 12px",
                                            fontSize: 13,
                                            lineHeight: 1.5,
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                                            border: isAI ? `1px solid ${C.border}` : "none",
                                            whiteSpace: "pre-line", // Giúp hiển thị xuống dòng của AI mượt hơn
                                        }}
                                    >
                                        {m.text}
                                        <div
                                            style={{
                                                fontSize: 9,
                                                color: isAI ? C.muted : "rgba(255,255,255,0.7)",
                                                marginTop: 4,
                                                textAlign: "right",
                                            }}
                                        >
                                            {m.time}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {loading && (
                            <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                <div
                                    style={{
                                        background: C.white,
                                        border: `1px solid ${C.border}`,
                                        padding: "10px 16px",
                                        borderRadius: "12px 12px 12px 0px",
                                        fontSize: 13,
                                    }}
                                >
                                    <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, marginRight: 6 }}></span>
                                    Trợ lý đang suy nghĩ...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={handleSend}
                        style={{
                            padding: "12px",
                            background: C.white,
                            borderTop: `1px solid ${C.border}`,
                            display: "flex",
                            gap: 8,
                        }}
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Hỏi về cách chọn cá ngon hoặc đăng tin..."
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: `1px solid ${C.border}`,
                                fontSize: 13,
                                outline: "none",
                                fontFamily: "inherit",
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            style={{
                                background: C.ocean,
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                padding: "8px 16px",
                                cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                                fontWeight: 700,
                                fontSize: 13,
                                opacity: !input.trim() || loading ? 0.6 : 1,
                            }}
                        >
                            Gửi
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}   