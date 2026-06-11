import { useState, useEffect } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

const MAX_CHARS = 200;

const TARGETS = [
  { value: "all", label: "👥 Tất cả người dùng" },
  { value: "Seller", label: "🐟 Chỉ người bán" },
  { value: "Buyer", label: "🛒 Chỉ người mua" },
];

function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: C.muted,
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {children}
    </div>
  );
}

export function AdminBroadcastTab() {
  const toast = useToast();
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("all");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);

  useEffect(() => {
    api("/admin/notifications/broadcasts")
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, []);

  const handleSend = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const res = await api("/admin/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({ content: content.trim(), targetRole: target }),
      });
      toast.success(`Đã gửi thông báo đến ${res.sentCount} người dùng.`);
      setContent("");
      setHistory((prev) => [res.broadcast, ...prev]);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const remaining = MAX_CHARS - content.length;

  return (
    <div className="row g-4">
      {/* ── Compose ─────────────────────────────────────────────── */}
      <div className="col-12 col-lg-6">
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            padding: 24,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: C.dark,
              marginBottom: 20,
            }}
          >
            📣 Soạn thông báo hệ thống
          </div>

          {/* Target selector */}
          <FieldLabel>Đối tượng nhận</FieldLabel>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            {TARGETS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTarget(t.value)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: `1.5px solid ${target === t.value ? C.ocean : C.border}`,
                  background: target === t.value ? C.ocean : C.white,
                  color: target === t.value ? "#fff" : C.text,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s ease",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Textarea + character counter */}
          <FieldLabel>Nội dung thông báo</FieldLabel>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Nhập nội dung thông báo gửi đến người dùng..."
              rows={4}
              style={{
                width: "100%",
                padding: "12px 14px",
                paddingBottom: 28,
                borderRadius: 12,
                border: `1.5px solid ${remaining < 20 ? "#f59e0b" : C.border}`,
                fontSize: 13,
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
                color: C.dark,
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: 8,
                right: 12,
                fontSize: 11,
                fontWeight: 600,
                color: remaining < 20 ? "#ef4444" : C.muted,
                pointerEvents: "none",
              }}
            >
              {remaining} / {MAX_CHARS}
            </span>
          </div>

          {/* Live preview */}
          {content.trim() && (
            <div
              style={{
                background: "rgba(11,79,108,0.04)",
                border: `1px solid ${C.border}`,
                borderLeft: `4px solid ${C.ocean}`,
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.muted,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Xem trước
              </div>
              <div
                style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#E6F4F9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  📢
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.dark }}>
                    {content.trim()}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                    Vừa xong · {TARGETS.find((t) => t.value === target)?.label}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={!content.trim() || sending}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 12,
              border: "none",
              background: !content.trim() || sending ? "#94a3b8" : C.ocean,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: !content.trim() || sending ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "background 0.2s",
            }}
          >
            {sending ? "⏳ Đang gửi..." : "📣 Gửi thông báo ngay"}
          </button>
        </div>
      </div>

      {/* ── History ─────────────────────────────────────────────── */}
      <div className="col-12 col-lg-6">
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            padding: 24,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: C.dark,
              marginBottom: 20,
            }}
          >
            🕒 Lịch sử đã phát sóng
          </div>

          {histLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: C.muted,
                fontSize: 13,
              }}
            >
              Đang tải...
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 13, color: C.muted }}>
                Chưa có thông báo nào được gửi.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                maxHeight: 420,
                overflowY: "auto",
              }}
            >
              {history.map((h, i) => (
                <div
                  key={h.id || i}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    background: "#fafbfc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.dark,
                        flex: 1,
                        lineHeight: 1.45,
                      }}
                    >
                      {h.content}
                    </div>
                    <span
                      style={{
                        background: "#E6F4F9",
                        color: C.ocean,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 10,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {h.sentCount} người
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      marginTop: 6,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        background: "#F1F5F9",
                        color: C.muted,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 10,
                      }}
                    >
                      {TARGETS.find((t) => t.value === h.targetRole)?.label ??
                        "👥 Tất cả"}
                    </span>
                    <span style={{ fontSize: 11, color: C.muted }}>
                      🕒 {new Date(h.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
