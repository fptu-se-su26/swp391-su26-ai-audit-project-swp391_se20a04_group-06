import { memo } from "react";
import { Heart, MapPin, ShoppingBag, Sparkles, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  formatCurrency,
  getProductId,
  getProductImage,
} from "../utils/product";
import { formatRelativeDate } from "../utils/date";
import { getCategoryLabel } from "../utils/labelMaps";

function cleanTitle(name) {
  if (!name) return "Hải sản tươi sống";
  let str = String(name).trim();
  if (str.length > 2 && str[0].toUpperCase() === str[1].toUpperCase() && /[a-zA-Z]/.test(str[0])) {
    str = str.slice(1);
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getInitials(name) {
  if (!name) return "ND";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ProductCard({
  product,
  isFavorite = false,
  onToggleFavorite,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const productId = getProductId(product);
  const productImage = getProductImage(product);
  const title = cleanTitle(product?.name);
  const sellerName = product?.sellerName || product?.seller?.name || "Ngư dân biển";
  const categoryName = getCategoryLabel(product?.category) || "Hải sản";
  const isFresh = product?.type === "Fresh" || product?.type === "fresh" || !product?.type;

  const requireLogin = () => {
    if (user) return true;
    navigate("/login", {
      state: { message: "Bạn cần đăng nhập để lưu sản phẩm." },
    });
    return false;
  };

  const toggleFavorite = (event) => {
    event.stopPropagation();
    if (!requireLogin()) return;
    onToggleFavorite?.(productId);
  };

  return (
    <article
      className="market-product-card stylish-product-card"
      data-tour="product-card"
      onClick={() => navigate(`/product/${productId}`)}
      onKeyDown={(event) => event.key === "Enter" && navigate(`/product/${productId}`)}
      role="link"
      tabIndex={0}
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        position: "relative"
      }}
    >
      {/* ── CARD MEDIA ── */}
      <div 
        className="market-product-card__media"
        style={{
          position: "relative",
          width: "100%",
          height: "175px",
          overflow: "hidden",
          background: "#f8fafc"
        }}
      >
        <img
          alt={title}
          className="market-product-card__media-image"
          decoding="async"
          loading="lazy"
          src={productImage}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.35s ease"
          }}
        />

        {/* Freshness Badge Pill */}
        <span 
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: isFresh ? "rgba(22, 163, 74, 0.9)" : "rgba(217, 119, 6, 0.9)",
            color: "#ffffff",
            fontSize: "0.72rem",
            fontWeight: "700",
            padding: "4px 9px",
            borderRadius: "999px",
            backdropFilter: "blur(4px)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          {isFresh ? "🟢 Tươi sống" : "🌾 Đồ khô"}
        </span>

        {/* Heart / Favorite Button */}
        <button
          aria-label={isFavorite ? "Bỏ lưu sản phẩm" : "Lưu sản phẩm"}
          onClick={toggleFavorite}
          type="button"
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.92)",
            border: "none",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            backdropFilter: "blur(4px)",
            transition: "transform 0.2s ease, background 0.2s ease"
          }}
        >
          <Heart size={16} fill={isFavorite ? "#ef4444" : "none"} color={isFavorite ? "#ef4444" : "#64748b"} />
        </button>

        {product.createdAt && (
          <span 
            style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              background: "rgba(15, 23, 42, 0.75)",
              color: "#ffffff",
              fontSize: "0.68rem",
              fontWeight: "600",
              padding: "2px 8px",
              borderRadius: "6px",
              backdropFilter: "blur(4px)"
            }}
          >
            {formatRelativeDate(product.createdAt)}
          </span>
        )}
      </div>

      {/* ── CARD BODY ── */}
      <div 
        className="market-product-card__body"
        style={{
          padding: "14px 14px 16px 14px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: "8px"
        }}
      >
        {/* Category & Origin row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.76rem" }}>
          <span style={{ background: "#e0f2fe", color: "#0284c7", fontWeight: "700", padding: "2px 8px", borderRadius: "6px" }}>
            {categoryName}
          </span>
          <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "3px" }}>
            <MapPin size={12} color="#0284c7" /> {product.origin || "Đà Nẵng"}
          </span>
        </div>

        {/* Product Title */}
        <h3 
          className="product-card-title" 
          title={title}
          style={{
            margin: "2px 0 0 0",
            fontSize: "1rem",
            fontWeight: "700",
            color: "#0f172a",
            lineHeight: "1.35",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.7em"
          }}
        >
          {title}
        </h3>

        {/* Seller Info */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "2px 0 4px" }}>
          <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#0284c7", color: "#fff", display: "grid", placeItems: "center", fontSize: "0.65rem", fontWeight: "700" }}>
            {getInitials(sellerName)}
          </div>
          <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sellerName}
          </span>
        </div>

        {/* Price & Action Button Column (Vertical Layout) */}
        <div style={{ marginTop: "auto", paddingTop: "10px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0284c7", letterSpacing: "-0.2px" }}>
              {formatCurrency(product.price)}
            </span>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>/ kg</span>
          </div>

          <button 
            type="button" 
            className="card-action-btn"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              color: "#ffffff",
              fontSize: "0.82rem",
              fontWeight: "700",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)"
            }}
          >
            <ShoppingBag size={14} /> Xem chi tiết
          </button>
        </div>
      </div>
    </article>
  );
}

export default memo(ProductCard);
