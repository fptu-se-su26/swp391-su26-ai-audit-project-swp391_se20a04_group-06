import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/theme";
import { fmt } from "../utils/format";
import { useCountdown } from "../hooks/useCountdown";
import { VerifiedBadge } from "./VerifiedBadge";
import { api } from "../services/api";
import { cardImage } from "../utils/cloudinary";

export function CountdownBadge({ catchTime }) {
  const rem = useCountdown(catchTime);
  if (!rem) return null;
  const expired = rem === "Hết hạn";
  const diff = 24 * 3600000 - (Date.now() - new Date(catchTime).getTime());
  const urgent = !expired && diff > 0 && diff < 5 * 3600000;
  return (
    <span
      className={urgent ? "pulse-urgent" : ""}
      style={{
        background: expired ? "#FEE2E2" : urgent ? "#FECACA" : C.warnL,
        color: expired ? "#991B1B" : urgent ? "#DC2626" : "#92400E",
        fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 4, display: "inline-block",
      }}
    >
      ⏱ {rem}
    </span>
  );
}

export function ProductCard({ product, onClick, onSellerClick, favoriteIds, onFavoriteChange, user }) {
  const navigate = useNavigate();
  const handleClick = onClick || (() => navigate(`/san-pham/${product.id}`));
  const handleSellerClick = onSellerClick || ((e) => {
    e.stopPropagation();
    navigate(`/nguoi-ban/${product.sellerId}`);
  });

  const typeColor = product.type === "Fresh" ? C.coral : C.warn;
  const typeLabel = product.type === "Fresh" ? "🌊 Tươi" : "🔥 Khô";
  const pct = Math.round((product.remainingWeight / product.totalWeight) * 100);

  const isFav = favoriteIds ? favoriteIds.includes(product.id) : false;
  const [favLoading, setFavLoading] = useState(false);
  const [localFav, setLocalFav] = useState(null);
  const currentFav = localFav !== null ? localFav : isFav;

  const toggleFav = async (e) => {
    e.stopPropagation();
    if (!user) { navigate("/dang-nhap"); return; }
    setFavLoading(true);
    try {
      const res = await api(`/favorites/${product.id}`, { method: "POST" });
      setLocalFav(res.favorited);
      if (onFavoriteChange) onFavoriteChange(product.id, res.favorited);
    } catch {}
    finally { setFavLoading(false); }
  };

  // Ảnh đã được tối ưu qua Cloudinary (f_auto, q_auto, w_400)
  const optimizedImg = cardImage(product.coverImg);

  return (
    <div
      onClick={() => handleClick(product)}
      style={{
        background: C.white, borderRadius: 14,
        border: `1px solid ${C.border}`, overflow: "hidden",
        cursor: "pointer", transition: "box-shadow 0.15s", position: "relative",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.12)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Favorite button */}
      <button
        onClick={toggleFav}
        disabled={favLoading}
        style={{
          position: "absolute", top: 8, right: 8, zIndex: 2,
          background: "rgba(255,255,255,0.9)", border: "none",
          borderRadius: "50%", width: 32, height: 32, cursor: "pointer",
          fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          transition: "transform 0.1s",
        }}
        title={currentFav ? "Bỏ yêu thích" : "Lưu yêu thích"}
      >
        {currentFav ? "❤️" : "🤍"}
      </button>

      {/* Ảnh với lazy loading native */}
      {optimizedImg ? (
        <img
          src={optimizedImg}
          alt={product.name}
          loading="lazy"                        /* Native lazy loading */
          decoding="async"                      /* Không block main thread */
          width={400}
          height={140}
          style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{
          height: 140,
          background: `linear-gradient(135deg,${C.ocean},${C.oceanL})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64,
        }}>
          🐟
        </div>
      )}

      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.dark, flex: 1, lineHeight: 1.3 }}>
            {product.name}
          </div>
          <span style={{
            background: product.type === "Fresh" ? "#FDE8E0" : "#FEF5E4",
            color: typeColor, fontSize: 11, fontWeight: 700,
            padding: "2px 7px", borderRadius: 4, marginLeft: 6, whiteSpace: "nowrap",
          }}>
            {typeLabel}
          </span>
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, color: C.coral, marginBottom: 6 }}>
          {fmt(product.price)}
          <span style={{ fontSize: 12, fontWeight: 400, color: C.muted }}>/kg</span>
        </div>

        <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
          <span>⚖️ Còn {product.remainingWeight}kg</span>
          {product.salesType === "Wholesale" && (
            <span style={{ marginLeft: 8, color: C.ocean, fontWeight: 600 }}>📦 Buôn</span>
          )}
          {product.viewCount > 0 && (
            <span style={{ marginLeft: 8, color: C.muted }}>👁 {product.viewCount}</span>
          )}
        </div>

        {product.origin && (
          <div style={{
            fontSize: 11, color: C.muted, marginBottom: 8,
            display: "flex", alignItems: "center", gap: 3,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            <span>📍</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{product.origin}</span>
          </div>
        )}

        {/* Stock bar */}
        <div style={{ height: 4, background: C.border, borderRadius: 2, marginBottom: 8 }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: pct > 50 ? C.ok : pct > 20 ? C.warn : "#EF4444",
            borderRadius: 2, transition: "width 0.3s",
          }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            onClick={handleSellerClick}
            style={{
              fontSize: 12, color: C.ocean, cursor: "pointer", fontWeight: 600,
              display: "inline-flex", alignItems: "center", gap: 3,
            }}
          >
            👤 {product.sellerName?.split(" ").pop()}
            {product.sellerIsVerified && <VerifiedBadge />}
          </span>
          {product.type === "Fresh" && product.catchTime && (
            <CountdownBadge catchTime={product.catchTime} />
          )}
          {product.type === "Dried" && product.origin && (
            <span style={{ fontSize: 11, color: C.muted }}>📍 {product.origin}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <div className="skeleton-shimmer" style={{ width: "100%", height: 140 }} />
      <div style={{ padding: "12px 14px" }}>
        <div className="skeleton-shimmer" style={{ width: "60%", height: 18, borderRadius: 4, marginBottom: 12 }} />
        <div className="skeleton-shimmer" style={{ width: "40%", height: 24, borderRadius: 4, marginBottom: 12 }} />
        <div className="skeleton-shimmer" style={{ width: "30%", height: 12, borderRadius: 4, marginBottom: 8 }} />
        <div className="skeleton-shimmer" style={{ width: "100%", height: 4, borderRadius: 2, marginBottom: 12 }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="skeleton-shimmer" style={{ width: 60, height: 14, borderRadius: 4 }} />
          <div className="skeleton-shimmer" style={{ width: 80, height: 18, borderRadius: 4 }} />
        </div>
      </div>
    </div>
  );
}
