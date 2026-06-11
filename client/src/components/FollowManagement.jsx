import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { C } from "../utils/theme";
import { useToast } from "../context/ToastContext";
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";

export function FollowManagement({ user }) {
  const toast = useToast();
  const vtNavigate = useViewTransitionNavigate();

  const [activeTab, setActiveTab] = useState("following"); // "following" | "followers"
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loadingFollowing, setLoadingFollowing] = useState(true);
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [unfollowingId, setUnfollowingId] = useState(null); // userId đang confirm
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  // ─── Fetch danh sách đang theo dõi (Thêm tham số showLoading) ───
  // ─── Fetch danh sách đang theo dõi ───
  const fetchFollowing = useCallback(() => {
    // Không gọi setLoadingFollowing(true) đồng bộ ở đầu nữa!
    api("/follows/following")
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setFollowing(list);
      })
      .catch(() => setFollowing([]))
      .finally(() => setLoadingFollowing(false));
  }, []);

  // ─── Fetch danh sách người theo dõi mình ───
  const fetchFollowers = useCallback(() => {
    // Không gọi setLoadingFollowers(true) đồng bộ ở đầu nữa!
    api("/follows/followers")
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setFollowers(list);
      })
      .catch(() => setFollowers([]))
      .finally(() => setLoadingFollowers(false));
  }, []);

  // Gọi fetch ban đầu không kích hoạt setLoading đồng bộ
  useEffect(() => {
    if (!user) return;
    fetchFollowing();
    fetchFollowers();
  }, [user, fetchFollowing, fetchFollowers]);

  // ─── Bỏ theo dõi ───
  const handleUnfollow = () => {
    if (!unfollowingId) return;
    setSubmitting(true);
    api(`/follows/${unfollowingId}`, { method: "DELETE" })
      .then(() => {
        toast.success("Đã bỏ theo dõi.");
        setUnfollowingId(null);

        // Chủ động bật trạng thái xoay vòng tải tại đây (Hợp lệ 100% vì nằm trong sự kiện click)
        setLoadingFollowing(true);
        fetchFollowing();
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setSubmitting(false));
  };

  // ─── Filter search ───
  const filtered = (list) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (u) =>
        u.Name?.toLowerCase().includes(q) ||
        u.FullName?.toLowerCase().includes(q) ||
        u.Location?.toLowerCase().includes(q),
    );
  };

  const isLoading =
    activeTab === "following" ? loadingFollowing : loadingFollowers;
  const list = filtered(activeTab === "following" ? following : followers);
  const total = activeTab === "following" ? following.length : followers.length;

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
      }}
    >
      {/* ─── Tabs ─── */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {[
          {
            k: "following",
            label: "Đang theo dõi",
            emoji: "📌",
            count: following.length,
          },
          {
            k: "followers",
            label: "Người theo dõi",
            emoji: "👥",
            count: followers.length,
          },
        ].map(({ k, label, emoji, count }) => (
          <button
            key={k}
            onClick={() => {
              setActiveTab(k);
              setSearch("");
            }}
            style={{
              flex: 1,
              padding: "14px 8px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: activeTab === k ? 700 : 500,
              color: activeTab === k ? C.ocean : C.muted,
              borderBottom:
                activeTab === k
                  ? `2px solid ${C.ocean}`
                  : "2px solid transparent",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <span>
              {emoji} {label}
            </span>
            <span
              style={{
                background: activeTab === k ? C.ocean : "#E5E7EB",
                color: activeTab === k ? "#fff" : C.muted,
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                padding: "1px 7px",
                minWidth: 22,
                textAlign: "center",
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Search ─── */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14,
              color: C.muted,
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === "following"
                ? "Tìm ngư dân bạn theo dõi..."
                : "Tìm người theo dõi bạn..."
            }
            style={{
              width: "100%",
              padding: "8px 10px 8px 32px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 13,
              boxSizing: "border-box",
              outline: "none",
              background: "#F9FAFB",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                color: C.muted,
                padding: 2,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ─── List ─── */}
      <div style={{ padding: 16 }}>
        {isLoading ? (
          <SkeletonList />
        ) : list.length === 0 ? (
          <EmptyState
            activeTab={activeTab}
            hasSearch={!!search}
            onClearSearch={() => setSearch("")}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map((person) => (
              <PersonCard
                key={person.UserID ?? person.userId}
                person={person}
                isFollowing={activeTab === "following"}
                onUnfollow={() =>
                  setUnfollowingId(person.UserID ?? person.userId)
                }
                onNavigate={() =>
                  vtNavigate(`/nguoi-ban/${person.UserID ?? person.userId}`)
                }
                C={C}
              />
            ))}
            {search && list.length > 0 && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: C.muted,
                  marginTop: 4,
                }}
              >
                {list.length} / {total} kết quả
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Unfollow confirm dialog ─── */}
      {unfollowingId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              width: "100%",
              maxWidth: 340,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Bỏ theo dõi?</h3>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 14,
                color: C.muted,
                lineHeight: 1.5,
              }}
            >
              Bạn sẽ không nhận thông báo khi ngư dân này đăng sản phẩm mới.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => setUnfollowingId(null)}
                disabled={submitting}
                style={cancelBtnStyle}
              >
                Giữ lại
              </button>
              <button
                onClick={handleUnfollow}
                disabled={submitting}
                style={dangerBtnStyle(submitting)}
              >
                {submitting ? "Đang xử lý..." : "Bỏ theo dõi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Person card ─── */
function PersonCard({ person, isFollowing, onUnfollow, onNavigate, C }) {
  const name = person.FullName || person.Name || "Người dùng";
  const avatar = person.AvatarURL || person.avatarUrl;
  const rating = person.SellerRating ?? person.sellerRating;
  const productCount = person.ProductCount ?? person.productCount;
  const location = person.Location || person.location;
  const isSeller = person.IsSeller ?? person.isSeller;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        background: "#FAFAFA",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
    >
      {/* Avatar */}
      <div onClick={onNavigate} style={{ cursor: "pointer", flexShrink: 0 }}>
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.ocean}, ${C.coral})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          onClick={onNavigate}
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: C.dark,
            cursor: "pointer",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          {name}
          {isSeller && (
            <span
              style={{
                fontSize: 10,
                background: "#DBEAFE",
                color: "#1D4ED8",
                borderRadius: 4,
                padding: "1px 5px",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              🎣 Ngư dân
            </span>
          )}
        </div>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "2px 10px",
            marginTop: 2,
          }}
        >
          {location && <span style={metaStyle}>📍 {location}</span>}
          {rating != null && (
            <span style={metaStyle}>⭐ {Number(rating).toFixed(1)}</span>
          )}
          {productCount != null && (
            <span style={metaStyle}>📦 {productCount} sản phẩm</span>
          )}
        </div>
      </div>

      {/* Action button */}
      {isFollowing ? (
        <button
          onClick={onUnfollow}
          style={{
            flexShrink: 0,
            padding: "6px 12px",
            borderRadius: 7,
            border: `1px solid #E5E7EB`,
            background: "#fff",
            color: "#374151",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background 0.15s, border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#FFF1F2";
            e.currentTarget.style.borderColor = "#FECACA";
            e.currentTarget.style.color = "#EF4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.borderColor = "#E5E7EB";
            e.currentTarget.style.color = "#374151";
          }}
        >
          Bỏ theo dõi
        </button>
      ) : (
        <button
          onClick={onNavigate}
          style={{
            flexShrink: 0,
            padding: "6px 12px",
            borderRadius: 7,
            border: "none",
            background: "#EFF6FF",
            color: "#3B82F6",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Xem trang
        </button>
      )}
    </div>
  );
}

/* ─── Skeleton loading ─── */
function SkeletonList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #F3F4F6",
            background: "#FAFAFA",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#E5E7EB",
              animation: "pulse 1.5s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 14,
                width: "55%",
                borderRadius: 6,
                background: "#E5E7EB",
                marginBottom: 8,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
            <div
              style={{
                height: 11,
                width: "35%",
                borderRadius: 6,
                background: "#F3F4F6",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          </div>
          <div
            style={{
              width: 80,
              height: 30,
              borderRadius: 7,
              background: "#F3F4F6",
              animation: "pulse 1.5s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

/* ─── Empty state ─── */
function EmptyState({ activeTab, hasSearch, onClearSearch }) {
  if (hasSearch) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#374151",
            marginBottom: 4,
          }}
        >
          Không tìm thấy kết quả
        </div>
        <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 12 }}>
          Thử tìm với từ khóa khác
        </div>
        <button
          onClick={onClearSearch}
          style={{
            padding: "6px 16px",
            borderRadius: 7,
            border: "1px solid #E5E7EB",
            background: "#fff",
            cursor: "pointer",
            fontSize: 13,
            color: "#374151",
          }}
        >
          Xóa tìm kiếm
        </button>
      </div>
    );
  }

  const config =
    activeTab === "following"
      ? {
          emoji: "📌",
          title: "Chưa theo dõi ai",
          body: "Khám phá và theo dõi các ngư dân để nhận thông báo sản phẩm mới.",
        }
      : {
          emoji: "👥",
          title: "Chưa có người theo dõi",
          body: "Khi có người theo dõi bạn, họ sẽ xuất hiện ở đây.",
        };

  return (
    <div style={{ textAlign: "center", padding: "36px 0" }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>{config.emoji}</div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#374151",
          marginBottom: 6,
        }}
      >
        {config.title}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#9CA3AF",
          lineHeight: 1.5,
          maxWidth: 260,
          margin: "0 auto",
        }}
      >
        {config.body}
      </div>
    </div>
  );
}

/* ─── Shared button styles ─── */
const cancelBtnStyle = {
  padding: "8px 20px",
  borderRadius: 7,
  border: "1px solid #E5E7EB",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
  color: "#374151",
};

const dangerBtnStyle = (disabled) => ({
  padding: "8px 20px",
  borderRadius: 7,
  border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
  background: "#EF4444",
  color: "#fff",
  fontWeight: 600,
  fontSize: 13,
  opacity: disabled ? 0.7 : 1,
});

const metaStyle = {
  fontSize: 12,
  color: "#6B7280",
};
