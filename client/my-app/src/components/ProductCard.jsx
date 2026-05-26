/**
 * ProductCard.jsx - Premium UI/UX Redesigned Version
 */
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
        background: expired ? "#FEE2E2" : urgent ? "#FECACA" : "#FEF3C7",
        color: expired ? "#991B1B" : urgent ? "#DC2626" : "#B45309",
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 6,
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
      }}
    >
      ⏱️ {rem}
    </span>
  );
}

export function ProductCard({
  product,
  onClick,
  onSellerClick,
  favoriteIds,
  onFavoriteChange,
  user,
}) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = onClick || (() => navigate(`/san-pham/${product.id}`));
  const handleSellerClick = (e) => {
    e.stopPropagation();
    if (onSellerClick) onSellerClick(e);
    else navigate(`/nguoi-ban/${product.sellerId}`);
  };

  const typeColor = product.type === "Fresh" ? C.coral : "#B45309";
  const typeLabel = product.type === "Fresh" ? "🌊 Tươi" : "🔥 Khô";
  const pct = Math.round((product.remainingWeight / product.totalWeight) * 100);

  const isFav = favoriteIds ? favoriteIds.includes(product.id) : false;
  const [favLoading, setFavLoading] = useState(false);
  const [localFav, setLocalFav] = useState(null);
  const currentFav = localFav !== null ? localFav : isFav;

  const toggleFav = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate("/dang-nhap");
      return;
    }
    setFavLoading(true);
    try {
      const res = await api(`/favorites/${product.id}`, { method: "POST" });
      setLocalFav(res.favorited);
      if (onFavoriteChange) onFavoriteChange(product.id, res.favorited);
    } catch {
    } finally {
      setFavLoading(false);
    }
  };

  const optimizedImg = cardImage(product.coverImg);

  return (
    <div
      onClick={() => handleClick(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: C.white,
        borderRadius: 20,
        border: "1px solid #E5E7EB",
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isHovered ? "translateY(-4px)" : "none",
        boxShadow: isHovered
          ? "0 20px 25px -5px rgba(11, 79, 108, 0.12), 0 10px 10px -5px rgba(11, 79, 108, 0.04)"
          : "0 4px 6px -1px rgba(11, 79, 108, 0.02), 0 2px 4px -1px rgba(11, 79, 108, 0.01)",
      }}
    >
      {/* Floating Badges trên góc ảnh */}
      <span
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 2,
          background:
            product.type === "Fresh"
              ? "rgba(253, 232, 224, 0.95)"
              : "rgba(254, 245, 228, 0.95)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          color: typeColor,
          fontSize: 11,
          fontWeight: 800,
          padding: "4px 10px",
          borderRadius: 8,
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        }}
      >
        {typeLabel}
      </span>

      {/* Nút lưu yêu thích mượt mà */}
      <button
        onClick={toggleFav}
        disabled={favLoading}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 2,
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          border: "none",
          borderRadius: "50%",
          width: 34,
          height: 34,
          cursor: "pointer",
          fontSize: 15,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          transition: "transform 0.2s ease",
          transform: isHovered ? "scale(1.05)" : "scale(1)",
        }}
        title={currentFav ? "Bỏ yêu thích" : "Lưu yêu thích"}
      >
        {currentFav ? "❤️" : "🤍"}
      </button>

      {/* Ảnh bìa sản phẩm */}
      <div style={{ position: "relative", overflow: "hidden", height: 160 }}>
        {optimizedImg ? (
          <img
            src={optimizedImg}
            alt={product.name}
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transition: "transform 0.5s ease",
              transform: isHovered ? "scale(1.06)" : "scale(1)",
            }}
          />
        ) : (
          <div
            style={{
              height: "100%",
              background: `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
            }}
          >
            🐟
          </div>
        )}
      </div>

      {/* Nội dung chi tiết của Card */}
      <div style={{ padding: "16px 18px" }}>
        {/* Tên sản phẩm */}
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: C.dark,
            lineHeight: 1.4,
            marginBottom: 8,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            height: 44, // Giữ chiều cao cố định để các card thẳng hàng nhau
          }}
        >
          {product.name}
        </div>

        {/* Giá sản phẩm thiết kế lớn nổi bật */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: C.coral,
            marginBottom: 12,
            display: "flex",
            alignItems: "baseline",
            gap: 2,
          }}
        >
          {fmt(product.price)}
          <span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>
            /kg
          </span>
        </div>

        {/* Thông tin số lượng còn lại + lượt xem */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: C.muted,
            marginBottom: 8,
          }}
        >
          <span>
            ⚖️ Sẵn có:{" "}
            <strong style={{ color: C.dark }}>
              {product.remainingWeight} kg
            </strong>
          </span>
          {product.salesType === "Wholesale" && (
            <span
              style={{
                color: C.ocean,
                fontWeight: 700,
                background: C.oceanP,
                padding: "1px 6px",
                borderRadius: 4,
              }}
            >
              Buôn
            </span>
          )}
          {product.viewCount > 0 && (
            <span>👁️ {product.viewCount} lượt xem</span>
          )}
        </div>

        {/* Thanh Progress đo lường nâng cấp bo góc lớn */}
        <div
          style={{
            height: 6,
            background: "#E5E7EB",
            borderRadius: 10,
            marginBottom: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: pct > 50 ? C.ok : pct > 20 ? C.warn : "#EF4444",
              borderRadius: 10,
              transition: "width 0.4s ease-out",
            }}
          />
        </div>

        {/* Dòng xuất xứ thu gọn */}
        {product.origin && (
          <div
            style={{
              fontSize: 11,
              color: C.muted,
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <span>📍</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {product.origin}
            </span>
          </div>
        )}

        <hr
          style={{
            border: "none",
            borderTop: "1px solid #F3F4F6",
            margin: "12px 0 10px",
          }}
        />

        {/* Khu vực Người bán + Badge thời gian/địa điểm */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            onClick={handleSellerClick}
            style={{
              fontSize: 13,
              color: C.ocean,
              cursor: "pointer",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.8)}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
          >
            👤 {product.sellerName?.split(" ").pop()}
            {product.sellerIsVerified && <VerifiedBadge />}
          </span>
          {product.type === "Fresh" && product.catchTime && (
            <CountdownBadge catchTime={product.catchTime} />
          )}
          {product.type === "Dried" && product.origin && (
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>
              📍 {product.origin.split(",").pop()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div
      style={{
        background: C.white,
        borderRadius: 20,
        border: "1px solid #E5E7EB",
        overflow: "hidden",
      }}
    >
      <div
        className="skeleton-shimmer"
        style={{ width: "100%", height: 160 }}
      />
      <div style={{ padding: "16px 18px" }}>
        <div
          className="skeleton-shimmer"
          style={{
            width: "80%",
            height: 18,
            borderRadius: 4,
            marginBottom: 12,
          }}
        />
        <div
          className="skeleton-shimmer"
          style={{
            width: "50%",
            height: 24,
            borderRadius: 4,
            marginBottom: 12,
          }}
        />
        <div
          className="skeleton-shimmer"
          style={{ width: "40%", height: 12, borderRadius: 4, marginBottom: 8 }}
        />
        <div
          className="skeleton-shimmer"
          style={{
            width: "100%",
            height: 6,
            borderRadius: 10,
            marginBottom: 16,
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div
            className="skeleton-shimmer"
            style={{ width: 70, height: 14, borderRadius: 4 }}
          />
          <div
            className="skeleton-shimmer"
            style={{ width: 90, height: 18, borderRadius: 4 }}
          />
        </div>
      </div>
    </div>
  );
}
