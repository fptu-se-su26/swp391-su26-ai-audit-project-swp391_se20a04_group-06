import React, { useState, useEffect } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { fmt, pill } from "../utils/format";
import { ImageSlider } from "../components/ImageSlider";
import { MapMini } from "../components/MapMini";
import { ChatBox } from "../components/ChatBox";
import { CountdownBadge } from "../components/ProductCard";
import { ReviewList } from "../components/ReviewList";
export function ProductDetailPage({
  product: initialProduct,
  setPage,
  user,
  setSelectedSeller,
}) {
  const [product, setProduct] = useState(initialProduct);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(!initialProduct?.images);
  const [isFollowing, setIsFollowing] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);

  useEffect(() => {
    if (!initialProduct?.id) {
      setPage("home");
      return;
    }
    // Fetch đầy đủ chi tiết (có images + rating)
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
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 20px 80px" }}>
      <button
        onClick={() => setPage("home")}
        style={{
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
              <div
                style={{
                  background: C.white,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  padding: 20,
                  marginTop: 16,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    marginBottom: 10,
                    color: C.dark,
                  }}
                >
                  📝 Mô tả sản phẩm
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: C.text,
                    lineHeight: 1.75,
                    margin: 0,
                  }}
                >
                  {product.description || "Chưa có mô tả."}
                </p>
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
                )}
              </div>
              {product.type === "Fresh" && product.lat && (
                <div style={{ marginTop: 16 }}>
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
                  background: C.white,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      background:
                        product.type === "Fresh" ? "#FDE8E0" : "#FEF5E4",
                      color: product.type === "Fresh" ? C.coral : C.warn,
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {product.type === "Fresh"
                      ? "🌊 Hải sản Tươi"
                      : "🔥 Hải sản Khô"}
                  </span>
                  {product.salesType === "Wholesale" && (
                    <span
                      style={{
                        background: C.oceanP,
                        color: C.ocean,
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      📦 Bán Buôn
                    </span>
                  )}
                </div>
                <h1
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: C.dark,
                    margin: "0 0 12px",
                  }}
                >
                  {product.name}
                </h1>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: C.coral,
                    marginBottom: 16,
                  }}
                >
                  {fmt(product.price)}
                  <span
                    style={{ fontSize: 14, fontWeight: 400, color: C.muted }}
                  >
                    /kg
                  </span>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      color: C.muted,
                      marginBottom: 6,
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
                    style={{ height: 8, background: C.border, borderRadius: 4 }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background:
                          pct > 50 ? C.ok : pct > 20 ? C.warn : "#EF4444",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>

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

                <div
                  style={{
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 14,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
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
                    <button
                      onClick={handleToggleFollow}
                      disabled={togglingFollow}
                      style={{
                        padding: "6px 12px",
                        background: isFollowing ? "#f1f1f1" : C.ocean,
                        color: isFollowing ? C.dark : "#fff",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        marginBottom: 8,
                      }}
                    >
                      {isFollowing ? "✔️ Đang theo dõi" : "❤️ Theo dõi"}
                    </button>
                  )}
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
                  <button
                    onClick={() => setPage("auth")}
                    style={{
                      width: "100%",
                      padding: 13,
                      background: C.coral,
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "inherit",
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
          </div>
        </>
      )}
    </div>
  );
}
