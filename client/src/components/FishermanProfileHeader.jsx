import { useState } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { VerifiedBadge } from "./VerifiedBadge";
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";

export function FishermanProfileHeader({ profile, isLoading, sellerId }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useViewTransitionNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);

  const isOwnProfile =
    user && (user.userId === sellerId || user.id === sellerId);

  const handleToggleFollow = async () => {
    if (!user) {
      toast.warn("Vui lòng đăng nhập để theo dõi!");
      return;
    }
    if (isOwnProfile) {
      toast.warn("Bạn không thể tự theo dõi chính mình!");
      return;
    }
    setTogglingFollow(true);
    try {
      const res = await api(`/follows/${sellerId}/toggle`, { method: "POST" });
      setIsFollowing(res.isFollowing);
      toast.success(res.message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setTogglingFollow(false);
    }
  };

  // ── Skeleton loading ─────────────────────────────────────
  if (isLoading || !profile) {
    return (
      <div
        style={{
          background: C.white,
          borderRadius: 20,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
          marginBottom: 28,
        }}
      >
        <div className="skeleton-shimmer" style={{ height: 110 }} />
        <div style={{ padding: "44px 28px 24px" }}>
          <div
            className="skeleton-shimmer"
            style={{
              width: 200,
              height: 24,
              borderRadius: 6,
              marginBottom: 12,
            }}
          />
          <div style={{ display: "flex", gap: 16 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer"
                style={{ width: 80, height: 60, borderRadius: 12 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { user: sellerUser, stats } = profile;

  const statCards = [
    { emoji: "📦", value: stats.activeProducts, label: "Đang bán" },
    { emoji: "🍳", value: stats.totalRecipes, label: "Công thức" },
    { emoji: "💬", value: stats.totalPosts, label: "Cộng đồng" },
    { emoji: "⛵", value: stats.totalBoatLogs, label: "Nhật ký" },
    { emoji: "👥", value: stats.followersCount, label: "Theo dõi" },
    {
      emoji: "⭐",
      value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—",
      label: `(${stats.ratingCount} đg)`,
    },
  ];

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 20,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        marginBottom: 28,
        boxShadow: "0 10px 25px -5px rgba(11, 79, 108, 0.04)",
      }}
    >
      {/* Banner */}
      <div
        style={{
          height: 110,
          background: "linear-gradient(135deg, #0B4F6C 0%, #1A7FA0 100%)",
          position: "relative",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            position: "absolute",
            bottom: -28,
            left: 28,
            width: 68,
            height: 68,
            borderRadius: "50%",
            border: "3px solid #fff",
            overflow: "hidden",
            zIndex: 3,
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
          }}
        >
          {sellerUser.avatar ? (
            <img
              src={sellerUser.avatar}
              alt={sellerUser.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #E8643A, #D94E21)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                color: "#fff",
                fontWeight: 800,
              }}
            >
              {sellerUser.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "44px 28px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {/* Tên + badges */}
          <div>
            <h1
              style={{
                margin: "0 0 6px",
                fontSize: 22,
                fontWeight: 800,
                color: C.dark,
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {sellerUser.name}
              {sellerUser.isVerified && <VerifiedBadge size="md" showLabel />}
              {sellerUser.isPremium && (
                <span title="Thành viên Premium" style={{ fontSize: 18 }}>
                  👑
                </span>
              )}
            </h1>

            {/* Badges row */}
            {sellerUser.badges?.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                {sellerUser.badges.map((b, i) => (
                  <span
                    key={i}
                    style={{
                      background: "#F0FDF4",
                      border: "1px solid #99F6E4",
                      color: "#0F766E",
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    🎖️ {b}
                  </span>
                ))}
              </div>
            )}

            {/* Thành viên từ */}
            {sellerUser.memberSince && (
              <div style={{ fontSize: 12, color: C.muted }}>
                Thành viên từ{" "}
                {new Date(sellerUser.memberSince).toLocaleDateString("vi-VN", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {isOwnProfile ? (
              <button
                onClick={() => navigate("/profile")}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.white,
                  color: C.text,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ✏️ Chỉnh sửa hồ sơ
              </button>
            ) : (
              <button
                onClick={handleToggleFollow}
                disabled={togglingFollow}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,

                  background: isFollowing
                    ? "rgba(11,79,108,0.08)"
                    : `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
                  color: isFollowing ? C.ocean : "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  border: isFollowing ? `1.5px solid ${C.ocean}` : "none",
                }}
              >
                {togglingFollow
                  ? "..."
                  : isFollowing
                    ? "✅ Đang theo dõi"
                    : "+ Theo dõi ngư dân"}
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}
        >
          {statCards.map((s) => (
            <div
              key={s.label}
              style={{
                textAlign: "center",
                padding: "10px 16px",
                background: "#F8FAFC",
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                minWidth: 72,
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 2 }}>{s.emoji}</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.dark,
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: C.muted,
                  fontWeight: 600,
                  marginTop: 3,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
