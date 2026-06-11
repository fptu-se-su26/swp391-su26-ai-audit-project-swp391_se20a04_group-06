import { useState } from "react";
import { C } from "../../utils/theme";
import { useApiFetch } from "../../hooks/useApiFetch";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export function FishermanBoatLogsTab({ sellerId }) {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading } = useApiFetch(
    `/fishermen/${sellerId}/boat-logs?limit=10`,
    [sellerId],
  );
  const [activeLog, setActiveLog] = useState(null);
  const [localLikes, setLocalLikes] = useState({});

  const logs = data?.data ?? data?.boatLogs ?? [];

  const handleLike = async (logId, e) => {
    e.stopPropagation();
    if (!user) {
      toast.warn("Vui lòng đăng nhập để thả tim");
      return;
    }
    try {
      const res = await api(`/boat-logs/${logId}/like`, { method: "POST" });
      setLocalLikes((prev) => ({
        ...prev,
        [logId]: { liked: res.liked, count: res.likeCount },
      }));
    } catch {
      /* silent */
    }
  };

  const getLikeInfo = (log) =>
    localLikes[log._id] ?? {
      liked: user ? (log.likes ?? []).includes(user.userId ?? user.id) : false,
      count: log.likes?.length ?? 0,
    };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{ height: 100, borderRadius: 12 }}
          />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          background: C.white,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>⛵</div>
        <div style={{ fontWeight: 700, color: C.dark }}>
          Chưa có nhật ký cabin
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {logs.map((log) => {
          const likeInfo = getLikeInfo(log);
          return (
            <div
              key={log._id}
              onClick={() => setActiveLog(log)}
              style={{
                background: C.white,
                borderRadius: 14,
                border: `1px solid ${C.border}`,
                padding: "16px 20px",
                cursor: "pointer",
                transition: "box-shadow 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(0,0,0,0.07)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                ⛵ {new Date(log.createdAt).toLocaleString("vi-VN")}
              </div>
              <p
                style={{
                  fontSize: 13.5,
                  color: C.dark,
                  lineHeight: 1.6,
                  margin: "0 0 10px",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {log.content}
              </p>
              {log.images?.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {log.images.slice(0, 4).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      style={{
                        width: 56,
                        height: 56,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  ))}
                </div>
              )}
              <button
                onClick={(e) => handleLike(log._id, e)}
                style={{
                  background: likeInfo.liked ? "#FFF1F2" : "none",
                  border: `1px solid ${likeInfo.liked ? "#FECACA" : C.border}`,
                  color: likeInfo.liked ? "#EF4444" : C.muted,
                  borderRadius: 8,
                  padding: "4px 12px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "inherit",
                }}
              >
                {likeInfo.liked ? "❤️" : "🤍"} {likeInfo.count}
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal xem đầy đủ log */}
      {activeLog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setActiveLog(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.white,
              borderRadius: 20,
              padding: 28,
              maxWidth: 500,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setActiveLog(null)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 22,
                cursor: "pointer",
                color: C.muted,
              }}
            >
              ×
            </button>
            <div
              style={{
                fontSize: 11,
                color: C.muted,
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              ⛵ {new Date(activeLog.createdAt).toLocaleString("vi-VN")}
            </div>
            <p
              style={{
                fontSize: 14,
                color: C.dark,
                lineHeight: 1.7,
                whiteSpace: "pre-line",
                marginBottom: 16,
              }}
            >
              {activeLog.content}
            </p>
            {activeLog.images?.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    activeLog.images.length === 1 ? "1fr" : "repeat(2, 1fr)",
                  gap: 8,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {activeLog.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    style={{
                      width: "100%",
                      height: activeLog.images.length === 1 ? "auto" : 160,
                      objectFit: "cover",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
