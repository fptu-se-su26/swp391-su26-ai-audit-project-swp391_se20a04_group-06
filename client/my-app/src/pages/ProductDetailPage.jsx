import React, { useState, useEffect } from "react";
<<<<<<< Updated upstream
import { C } from "../utils/theme";
=======
import { useNavigate } from "react-router-dom";
>>>>>>> Stashed changes
import { api } from "../services/api";
import { fmt, pill } from "../utils/format";
import { ImageSlider } from "../components/ImageSlider";
import { MapMini } from "../components/MapMini";
import { ChatBox } from "../components/ChatBox";
import { CountdownBadge } from "../components/ProductCard";
import { ReviewList } from "../components/ReviewList";
<<<<<<< Updated upstream
export function ProductDetailPage({
  product: initialProduct,
  setPage,
  user,
  setSelectedSeller,
}) {
=======
import { useSEO } from "../hooks/useSEO";
import { ogImage } from "../utils/cloudinary";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const CATEGORY_MAP = {
  Fish: "🐟 Cá tươi câu",
  Shrimp: "🦐 Tôm sống",
  Squid: "🦑 Mực, Bạch tuộc",
  Crab: "🦀 Cua, Ghẹ",
  Shellfish: "🐚 Nghêu, Sò, Ốc",
  Others: "✨ Loại khác",
};

// ── Design tokens (Editorial palette) ──
const T = {
  bg: "#fbf9f8",
  bg2: "#f5f3f3",
  white: "#ffffff",
  dark: "#1b1c1c",
  text: "#1b1c1c",
  muted: "#747878",
  border: "#c4c7c7",
  borderL: "#e4e2e2",
  accent: "#775a19", // amber
  accentL: "#fef3c7",
  accentD: "#5d4201",
  error: "#ba1a1a",
  errorL: "#ffdad6",
  ok: "#1e8449",
  okL: "#d5f5e3",
};

export function ProductDetailPage({ product: initialProduct }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

>>>>>>> Stashed changes
  const [product, setProduct] = useState(initialProduct);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(!initialProduct?.images);
  const [isFollowing, setIsFollowing] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);
<<<<<<< Updated upstream

  useEffect(() => {
    if (!initialProduct?.id) {
      setPage("home");
      return;
    }
    // Fetch đầy đủ chi tiết (có images + rating)
=======
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [showPriceHistory, setShowPriceHistory] = useState(false);

  useSEO({
    title: product
      ? `${product.name} — ${product.sellerName}`
      : "Chi tiết sản phẩm",
    description: product
      ? `${product.type === "Fresh" ? "🌊 Hải sản tươi" : "🔥 Hải sản khô"} — ${product.name}. Còn ${product.remainingWeight}kg. Giá ${parseFloat(product.price || 0).toLocaleString("vi-VN")}đ/kg.`
      : undefined,
    image: product ? ogImage(product.coverImg) : undefined,
    url: product
      ? `${window.location.origin}/san-pham/${product.id}`
      : undefined,
    product: product || undefined,
  });

  useEffect(() => {
    if (!initialProduct?.id) return;
>>>>>>> Stashed changes
    api(`/products/${initialProduct.id}`)
      .then((data) =>
        setProduct({
          ...data,
          description: data.description || data.desc,
          scrollToReviewId: initialProduct.scrollToReviewId || null,
        }),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
<<<<<<< Updated upstream

=======
    api(`/products/${initialProduct.id}/price-history`)
      .then((history) => setPriceHistory(history || []))
      .catch(() => {});
>>>>>>> Stashed changes
    if (user && initialProduct.sellerId) {
      api(`/follows/${initialProduct.sellerId}/check`)
        .then((res) => setIsFollowing(res.isFollowing))
        .catch(() => {});
    }
  }, [initialProduct?.id, user]);

  const handleToggleFollow = () => {
    if (!user) return alert("Vui lòng đăng nhập để theo dõi!");
    setTogglingFollow(true);
    api(`/follows/${product.sellerId}/toggle`, { method: "POST" })
      .then((res) => {
        setIsFollowing(res.isFollowing);
        alert(res.message);
      })
      .catch((err) => alert(err.message))
      .finally(() => setTogglingFollow(false));
  };

  if (!product) {
    setPage("home");
    return null;
  }

  const pct = Math.round((product.remainingWeight / product.totalWeight) * 100);

  return (
<<<<<<< Updated upstream
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 20px 80px" }}>
=======
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "32px 24px 80px",
        background: T.bg,
      }}
    >
      {/* Back button */}
>>>>>>> Stashed changes
      <button
        onClick={() => setPage("home")}
        style={{
<<<<<<< Updated upstream
          background: "none",
          border: "none",
          color: C.ocean,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 14,
          marginBottom: 16,
          padding: 0,
          fontFamily: "inherit",
        }}
      >
        ← Quay lại
      </button>

      {loading ? (
        <div style={{ textAlign: "center", padding: 80, color: C.muted }}>
          ⏳ Đang tải...
=======
          background: T.white,
          border: `1px solid ${T.border}`,
          color: T.dark,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 13,
          marginBottom: 24,
          padding: "8px 18px",
          borderRadius: 0,
          fontFamily: "inherit",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          letterSpacing: "0.04em",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = T.bg2;
          e.currentTarget.style.borderColor = T.dark;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = T.white;
          e.currentTarget.style.borderColor = T.border;
        }}
      >
        ← Quay lại chợ hải sản
      </button>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 80,
            color: T.muted,
            fontWeight: 500,
          }}
        >
          Đang tải thông tin chi tiết hải sản...
>>>>>>> Stashed changes
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 360px",
              gap: 24,
            }}
          >
            {/* LEFT */}
            <div>
              <ImageSlider product={product} />
<<<<<<< Updated upstream
              <div
                style={{
                  background: C.white,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  padding: 20,
                  marginTop: 16,
=======

              {/* Description */}
              <div
                style={{
                  background: T.white,
                  border: `1px solid ${T.border}`,
                  padding: "24px",
                  marginTop: 20,
>>>>>>> Stashed changes
                }}
              >
                <div
                  style={{
<<<<<<< Updated upstream
                    fontWeight: 700,
                    fontSize: 15,
                    marginBottom: 10,
                    color: C.dark,
                  }}
                >
                  📝 Mô tả sản phẩm
=======
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: T.muted,
                    marginBottom: 12,
                  }}
                >
                  Mô tả từ ngư dân
>>>>>>> Stashed changes
                </div>
                <p
                  style={{
                    fontSize: 14,
<<<<<<< Updated upstream
                    color: C.text,
                    lineHeight: 1.75,
=======
                    color: T.text,
                    lineHeight: 1.8,
>>>>>>> Stashed changes
                    margin: 0,
                  }}
                >
                  {product.description || "Chưa có mô tả."}
                </p>
<<<<<<< Updated upstream
                {product.origin && (
                  <div style={{ marginTop: 10, fontSize: 13, color: C.muted }}>
                    🏷️ Xuất xứ:{" "}
                    <strong style={{ color: C.text }}>{product.origin}</strong>
                  </div>
                )}
                {product.expiryDate && (
                  <div style={{ marginTop: 4, fontSize: 13, color: C.muted }}>
                    📅 Hạn sử dụng:{" "}
                    <strong style={{ color: C.text }}>
                      {product.expiryDate}
                    </strong>
                  </div>
=======
                {(product.origin || product.expiryDate) && (
                  <>
                    <hr
                      style={{
                        border: "none",
                        borderTop: `1px solid ${T.borderL}`,
                        margin: "16px 0",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {product.origin && (
                        <div style={{ fontSize: 13, color: T.muted }}>
                          📍 Xuất xứ:{" "}
                          <strong style={{ color: T.text }}>
                            {product.origin}
                          </strong>
                        </div>
                      )}
                      {product.expiryDate && (
                        <div style={{ fontSize: 13, color: T.muted }}>
                          📅 Hạn dùng:{" "}
                          <strong style={{ color: T.text }}>
                            {product.expiryDate}
                          </strong>
                        </div>
                      )}
                    </div>
                  </>
>>>>>>> Stashed changes
                )}
              </div>
              {product.type === "Fresh" && product.lat && (
<<<<<<< Updated upstream
                <div style={{ marginTop: 16 }}>
=======
                <div
                  style={{
                    marginTop: 20,
                    overflow: "hidden",
                    border: `1px solid ${T.border}`,
                  }}
                >
>>>>>>> Stashed changes
                  <MapMini lat={product.lat} lng={product.lng} />
                </div>
              )}
              {showChat && user && (
                <div style={{ marginTop: 16 }}>
                  <ChatBox
                    product={product}
                    onClose={() => setShowChat(false)}
                    user={user}
                  />
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div>
              <div
                style={{
<<<<<<< Updated upstream
                  background: C.white,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  padding: 20,
=======
                  background: T.white,
                  border: `1px solid ${T.border}`,
                  padding: "24px",
                  position: "sticky",
                  top: 80,
>>>>>>> Stashed changes
                }}
              >
                <div
                  style={{
                    display: "flex",
<<<<<<< Updated upstream
                    gap: 8,
                    marginBottom: 10,
=======
                    gap: 6,
                    marginBottom: 16,
>>>>>>> Stashed changes
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      background:
<<<<<<< Updated upstream
                        product.type === "Fresh" ? "#FDE8E0" : "#FEF5E4",
                      color: product.type === "Fresh" ? C.coral : C.warn,
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 700,
=======
                        product.type === "Fresh" ? "#dbeafe" : "#fef3c7",
                      color: product.type === "Fresh" ? "#1d4ed8" : "#92400e",
                      padding: "3px 10px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
>>>>>>> Stashed changes
                    }}
                  >
                    {product.type === "Fresh" ? "🌊 Tươi" : "🔥 Khô"}
                  </span>
<<<<<<< Updated upstream
                  {product.salesType === "Wholesale" && (
                    <span
                      style={{
                        background: C.oceanP,
                        color: C.ocean,
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 12,
                        fontWeight: 700,
=======
                  <span
                    style={{
                      background: T.accentL,
                      color: T.accent,
                      padding: "3px 10px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {CATEGORY_MAP[product.category] || "Khác"}
                  </span>
                  {product.salesType === "Wholesale" && (
                    <span
                      style={{
                        background: T.bg2,
                        color: T.muted,
                        padding: "3px 10px",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
>>>>>>> Stashed changes
                      }}
                    >
                      📦 Bán Buôn
                    </span>
                  )}
                </div>
<<<<<<< Updated upstream
                <h1
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: C.dark,
                    margin: "0 0 12px",
=======

                {/* Name */}
                <h1
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 22,
                    fontWeight: 600,
                    color: T.dark,
                    marginBottom: 8,
                    lineHeight: 1.3,
>>>>>>> Stashed changes
                  }}
                >
                  {product.name}
                </h1>
<<<<<<< Updated upstream
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: C.coral,
=======

                {/* Price */}
                <div
                  style={{
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    color: T.accent,
>>>>>>> Stashed changes
                    marginBottom: 16,
                  }}
                >
                  {fmt(product.price)}
<<<<<<< Updated upstream
                  <span
                    style={{ fontSize: 14, fontWeight: 400, color: C.muted }}
                  >
                    /kg
                  </span>
                </div>

=======
                  <span style={{ fontWeight: 400, color: T.muted }}> /kg</span>
                </div>

                {/* Price history */}
                {priceHistory.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <button
                      onClick={() => setShowPriceHistory(!showPriceHistory)}
                      style={{
                        background: "none",
                        border: "none",
                        color: T.accent,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 12,
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontFamily: "inherit",
                      }}
                    >
                      📈{" "}
                      {showPriceHistory
                        ? "Ẩn lịch sử giá ▲"
                        : "Xem lịch sử giá ▼"}
                    </button>
                    {showPriceHistory && (
                      <div
                        style={{
                          background: T.bg2,
                          border: `1px solid ${T.border}`,
                          padding: 12,
                          marginTop: 8,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {priceHistory.map((h, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 12,
                              borderLeft: `2px solid ${T.accent}`,
                              paddingLeft: 10,
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  textDecoration: "line-through",
                                  color: T.muted,
                                }}
                              >
                                {fmt(h.oldPrice)}
                              </span>
                              {" → "}
                              <strong style={{ color: T.error }}>
                                {fmt(h.newPrice)}
                              </strong>
                            </div>
                            <span style={{ color: T.muted }}>
                              {new Date(h.changedAt).toLocaleDateString(
                                "vi-VN",
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Stock bar */}
>>>>>>> Stashed changes
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
<<<<<<< Updated upstream
                      fontSize: 13,
                      color: C.muted,
                      marginBottom: 6,
=======
                      fontSize: 12,
                      color: T.muted,
                      marginBottom: 4,
>>>>>>> Stashed changes
                    }}
                  >
                    <span>
                      Còn lại:{" "}
                      <strong style={{ color: C.text }}>
                        {product.remainingWeight}kg
                      </strong>
                    </span>
                    <span>Tổng: {product.totalWeight}kg</span>
                  </div>
                  <div
<<<<<<< Updated upstream
                    style={{ height: 8, background: C.border, borderRadius: 4 }}
=======
                    style={{
                      height: 3,
                      background: T.borderL,
                      overflow: "hidden",
                    }}
>>>>>>> Stashed changes
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background:
<<<<<<< Updated upstream
                          pct > 50 ? C.ok : pct > 20 ? C.warn : "#EF4444",
                        borderRadius: 4,
=======
                          pct > 50
                            ? "#10b981"
                            : pct > 20
                              ? "#f59e0b"
                              : "#ef4444",
>>>>>>> Stashed changes
                      }}
                    />
                  </div>
                </div>

<<<<<<< Updated upstream
=======
                {/* Countdown */}
>>>>>>> Stashed changes
                {product.type === "Fresh" && product.catchTime && (
                  <div
                    style={{
                      background: C.warnL,
                      borderRadius: 8,
                      padding: "10px 12px",
                      marginBottom: 12,
                      fontSize: 13,
                    }}
                  >
                    ⏱ Bắt lúc:{" "}
                    <strong>
                      {new Date(product.catchTime).toLocaleString("vi")}
                    </strong>
                    <div style={{ marginTop: 4 }}>
                      <CountdownBadge catchTime={product.catchTime} />
                    </div>
                  </div>
                )}

<<<<<<< Updated upstream
                <div
                  style={{
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 14,
                    marginBottom: 14,
                  }}
=======
                {/* CTA buttons */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
>>>>>>> Stashed changes
                >
                  <div
                    style={{
<<<<<<< Updated upstream
                      fontWeight: 700,
                      fontSize: 13,
                      color: C.dark,
                      marginBottom: 8,
                    }}
                  >
                    👤 Thông tin người bán
                  </div>
                  <div
                    onClick={() => {
                      if (setSelectedSeller) {
                        setSelectedSeller({
                          id: product.sellerId,
                          name: product.sellerName,
                        });
                        setPage("seller");
                      }
                    }}
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: C.ocean,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    {product.sellerName}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: C.muted,
                      marginTop: 2,
                      marginBottom: 8,
                    }}
                  >
                    📞 {product.sellerPhone}
                  </div>

                  {user && user.id !== product.sellerId && (
=======
                      padding: "13px 0",
                      border: "none",
                      background: T.dark,
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      letterSpacing: "0.04em",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = T.accent)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = T.dark)
                    }
                  >
                    💬 Nhắn tin với ngư dân
                  </button>

                  <button
                    onClick={handleToggleFavorite}
                    disabled={favLoading}
                    style={{
                      padding: "11px 0",
                      border: `1px solid ${isFavorited ? T.error : T.border}`,
                      background: isFavorited ? T.errorL : T.white,
                      color: isFavorited ? T.error : T.muted,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {isFavorited ? "❤️ Đã lưu" : "🤍 Lưu yêu thích"}
                  </button>

                  {!isOwnProduct && (
>>>>>>> Stashed changes
                    <button
                      onClick={handleToggleFollow}
                      disabled={togglingFollow}
                      style={{
<<<<<<< Updated upstream
                        padding: "6px 12px",
                        background: isFollowing ? "#f1f1f1" : C.ocean,
                        color: isFollowing ? C.dark : "#fff",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
=======
                        padding: "11px 0",
                        border: `1px solid ${isFollowing ? T.accent : T.border}`,
                        background: isFollowing ? T.accentL : T.white,
                        color: isFollowing ? T.accent : T.muted,
                        fontWeight: 600,
                        fontSize: 13,
>>>>>>> Stashed changes
                        cursor: "pointer",
                        marginBottom: 8,
                      }}
                    >
                      {isFollowing ? "✔️ Đang theo dõi" : "❤️ Theo dõi"}
                    </button>
                  )}
<<<<<<< Updated upstream
                  {product.sellerRating > 0 && (
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                      ⭐ {parseFloat(product.sellerRating).toFixed(1)} (
                      {product.ratingCount} đánh giá)
                    </div>
                  )}
                </div>

                {user ? (
                  user.id !== product.sellerId ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <button
                        onClick={() => setShowChat(!showChat)}
                        style={{
                          width: "100%",
                          padding: 13,
                          background: C.ocean,
                          color: "#fff",
                          border: "none",
                          borderRadius: 10,
                          cursor: "pointer",
                          fontSize: 15,
                          fontWeight: 700,
                          fontFamily: "inherit",
                        }}
                      >
                        💬 {showChat ? "Đóng chat" : "Liên hệ người bán"}
                      </button>
                      <a
                        href={`tel:${product.sellerPhone}`}
                        style={{
                          display: "block",
                          textAlign: "center",
                          width: "100%",
                          padding: 13,
                          background: C.ok,
                          color: "#fff",
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: 700,
                          textDecoration: "none",
                          boxSizing: "border-box",
                        }}
                      >
                        📞 Gọi ngay: {product.sellerPhone}
                      </a>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          background: C.oceanP,
                          borderRadius: 8,
                          padding: "10px 14px",
                          fontSize: 13,
                          color: C.ocean,
                          textAlign: "center",
                        }}
                      >
                        Đây là bài đăng của bạn
                      </div>
                      <button
                        onClick={() => setShowChat(!showChat)}
                        style={{
                          width: "100%",
                          padding: 13,
                          background: C.ocean,
                          color: "#fff",
                          border: "none",
                          borderRadius: 10,
                          cursor: "pointer",
                          fontSize: 15,
                          fontWeight: 700,
                          fontFamily: "inherit",
                        }}
                      >
                        💬{" "}
                        {showChat ? "Đóng chat" : "Xem tin nhắn từ người mua"}
                      </button>
                    </div>
                  )
                ) : (
=======

>>>>>>> Stashed changes
                  <button
                    onClick={() => setPage("auth")}
                    style={{
<<<<<<< Updated upstream
                      width: "100%",
                      padding: 13,
                      background: C.coral,
                      color: "#fff",
=======
                      fontSize: 11,
                      color: T.muted,
                      background: "none",
>>>>>>> Stashed changes
                      border: "none",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "inherit",
<<<<<<< Updated upstream
=======
                      paddingTop: 4,
                      letterSpacing: "0.04em",
>>>>>>> Stashed changes
                    }}
                  >
                    🔐 Đăng nhập để liên hệ
                  </button>
                )}
              </div>
            </div>
          </div>

          <div id="reviews-section">
            <ReviewList
              sellerId={product.sellerId}
              user={user}
              productId={product.id}
              scrollToReviewId={product.scrollToReviewId || null}
            />
<<<<<<< Updated upstream
          </div>
=======
          )}

          {/* Report Modal */}
          {showReportModal && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setShowReportModal(false)}
            >
              <div
                style={{
                  background: T.white,
                  border: `1px solid ${T.border}`,
                  padding: 28,
                  maxWidth: 400,
                  width: "90%",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: T.dark,
                    marginBottom: 12,
                  }}
                >
                  🚩 Báo cáo sản phẩm
                </h3>
                {reportSent ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "20px 0",
                      color: T.ok,
                      fontWeight: 700,
                    }}
                  >
                    ✅ Đã gửi báo cáo. Xin cảm ơn!
                  </div>
                ) : (
                  <>
                    <textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Mô tả lý do báo cáo..."
                      style={{
                        width: "100%",
                        minHeight: 100,
                        padding: "10px 14px",
                        border: `1px solid ${T.border}`,
                        fontFamily: "inherit",
                        fontSize: 14,
                        resize: "vertical",
                        marginBottom: 14,
                        outline: "none",
                      }}
                    />
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => setShowReportModal(false)}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          border: `1px solid ${T.border}`,
                          background: T.white,
                          color: T.muted,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Huỷ
                      </button>
                      <button
                        onClick={handleReport}
                        disabled={reportLoading || !reportReason.trim()}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          border: "none",
                          background: T.error,
                          color: "#fff",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          opacity: reportLoading ? 0.7 : 1,
                        }}
                      >
                        {reportLoading ? "Đang gửi…" : "Gửi báo cáo"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
>>>>>>> Stashed changes
        </>
      )}
    </div>
  );
}
