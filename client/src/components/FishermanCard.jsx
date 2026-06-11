import { C } from "../utils/theme";
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";

/**
 * FishermanCard
 * @param {object} fisherman - { id, name, avatar, isVerified, isPremium, badges,
 *                               activeProducts, avgRating, ratingCount }
 * @param {"compact"|"full"} size - compact = grid nhỏ (homepage), full = list card
 */
export function FishermanCard({ fisherman, size = "compact" }) {
  const navigate = useViewTransitionNavigate();
  const {
    id,
    name,
    avatar,
    isVerified,
    isPremium,
    badges = [],
    activeProducts = 0,
    avgRating = 0,
    ratingCount = 0,
  } = fisherman;

  const hasActive = activeProducts > 0;

  const handleClick = () => navigate(`/nguoi-ban/${id}`);

  // ── Compact size (dùng ở HomePage grid) ────────────────
  if (size === "compact") {
    return (
      <div
        onClick={handleClick}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          cursor: "pointer",
          padding: "10px 12px",
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          background: "#FAFAFA",
          transition: "all 0.22s ease",
          textAlign: "center",
          width: 110,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
          e.currentTarget.style.borderColor = C.ocean;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = C.border;
        }}
      >
        {/* Avatar với ring gradient khi có listing active */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            marginBottom: 8,
            padding: hasActive ? 3 : 2,
            background: hasActive
              ? "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #bc1888 100%)"
              : C.border,
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: "#fff",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {/* Badge xác minh */}
          {isVerified && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                background: "#0284C7",
                color: "#fff",
                borderRadius: "50%",
                width: 16,
                height: 16,
                fontSize: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid #fff",
                fontWeight: 700,
              }}
            >
              ✓
            </div>
          )}
        </div>

        {/* Tên */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.dark,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%",
            display: "block",
          }}
        >
          {isPremium ? "👑 " : ""}
          {name}
        </span>

        {/* Stats mini */}
        {activeProducts > 0 && (
          <span style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
            📦 {activeProducts}
            {avgRating > 0 ? ` · ⭐ ${avgRating}` : ""}
          </span>
        )}
      </div>
    );
  }

  // ── Full size (dùng ở FishermanListPage) ────────────────
  return (
    <div
      onClick={handleClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 20px",
        background: C.white,
        borderRadius: 14,
        border: `1px solid ${C.border}`,
        cursor: "pointer",
        transition: "all 0.22s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.ocean;
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(11,79,108,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          flexShrink: 0,
          padding: hasActive ? 2.5 : 2,
          background: hasActive
            ? "linear-gradient(45deg, #f09433 0%, #dc2743 50%, #bc1888 100%)"
            : C.border,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: "#fff",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 800,
            fontSize: 15,
            color: C.dark,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {isPremium && <span>👑</span>}
          {name}
          {isVerified && (
            <span
              style={{
                background: "#0284C7",
                color: "#fff",
                borderRadius: 4,
                padding: "1px 6px",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              ✓
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            fontSize: 12,
            color: C.muted,
            marginTop: 3,
          }}
        >
          {activeProducts > 0 && <span>📦 {activeProducts} sản phẩm</span>}
          {avgRating > 0 && (
            <span>
              ⭐ {avgRating} ({ratingCount} đánh giá)
            </span>
          )}
        </div>
        {badges.length > 0 && (
          <div
            style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}
          >
            {badges.slice(0, 2).map((b, i) => (
              <span
                key={i}
                style={{
                  background: "#F0FDF4",
                  border: "1px solid #99F6E4",
                  color: "#0F766E",
                  borderRadius: 4,
                  padding: "2px 7px",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                🎖️ {b}
              </span>
            ))}
          </div>
        )}
      </div>

      <span style={{ fontSize: 18, color: C.muted }}>›</span>
    </div>
  );
}
