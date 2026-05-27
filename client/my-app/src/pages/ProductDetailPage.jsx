/**
 * ProductDetailPage.jsx — Refactored
 *
 * CHANGES:
 *   - Loại bỏ prop `user` → useAuth() (Context Pattern)
 *   - Thay toàn bộ alert() → useToast() (Observer Pattern)
 *   - Giữ nguyên 100% UI, layout, SEO logic
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { fmt } from "../utils/format";
import { ImageSlider } from "../components/ImageSlider";
import { MapMini } from "../components/MapMini";
import { ChatBox } from "../components/ChatBox";
import { CountdownBadge } from "../components/ProductCard";
import { ReviewList } from "../components/ReviewList";
import { useSEO } from "../hooks/useSEO";
import { ogImage } from "../utils/cloudinary";
import { useAuth } from "../context/AuthContext"; // ← NEW
import { useToast } from "../context/ToastContext"; // ← NEW

export function ProductDetailPage({ product: initialProduct }) {
  // ← THAY ĐỔI: không nhận user qua props nữa
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState(initialProduct);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(!initialProduct?.images);
  const [isFollowing, setIsFollowing] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

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
    if (user && initialProduct.id) {
      api(`/favorites/ids`)
        .then((ids) => setIsFavorited(ids.includes(initialProduct.id)))
        .catch(() => {});
    }
  }, [initialProduct?.id, user]);

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setReportLoading(true);
    try {
      await api(`/reports/${product.id}`, {
        method: "POST",
        body: JSON.stringify({ reason: reportReason }),
      });
      setReportSent(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSent(false);
        setReportReason("");
      }, 2000);
    } catch (e) {
      toast.error(e.message); // ← THAY alert()
    } finally {
      setReportLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate("/dang-nhap");
      return;
    }
    setFavLoading(true);
    try {
      const res = await api(`/favorites/${product.id}`, { method: "POST" });
      setIsFavorited(res.favorited);
    } catch {
      /* silent */
    } finally {
      setFavLoading(false);
    }
  };

  const handleToggleFollow = () => {
    if (!user) {
      toast.warn("Vui lòng đăng nhập để theo dõi!"); // ← THAY alert()
      return;
    }
    setTogglingFollow(true);
    api(`/follows/${product.sellerId}/toggle`, { method: "POST" })
      .then((res) => {
        setIsFollowing(res.isFollowing);
        toast.success(res.message); // ← THAY alert()
      })
      .catch((err) => toast.error(err.message)) // ← THAY alert()
      .finally(() => setTogglingFollow(false));
  };

  if (!product) return null;

  const pct = Math.round((product.remainingWeight / product.totalWeight) * 100);

  return (
    <div
      style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          color: C.ocean,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 13,
          marginBottom: 20,
          padding: "8px 16px",
          borderRadius: 10,
          fontFamily: "inherit",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#F1F5F9";
          e.currentTarget.style.borderColor = C.ocean;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = C.white;
          e.currentTarget.style.borderColor = C.border;
        }}
      >
        ⟨ Quay lại chợ hải sản
      </button>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 80,
            color: C.muted,
            fontWeight: 500,
          }}
        >
          ⏳ Đang tải thông tin chi tiết hải sản...
        </div>
      ) : (
        <>
          <div
            className="product-detail-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 380px",
              gap: 24,
              marginBottom: 24,
            }}
          >
            {/* LEFT */}
            <div>
              <ImageSlider product={product} />

              <div
                style={{
                  background: C.white,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  padding: "24px",
                  marginTop: 20,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.01)",
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    marginBottom: 12,
                    color: C.dark,
                  }}
                >
                  📝 Mô tả sản phẩm từ ngư dân
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: C.text,
                    lineHeight: 1.8,
                    margin: 0,
                  }}
                >
                  {product.description ||
                    "Ngư dân chưa thêm thông tin mô tả chi tiết cho sản phẩm này."}
                </p>
                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid #F3F4F6",
                    margin: "16px 0",
                  }}
                />
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {product.origin && (
                    <div style={{ fontSize: 13, color: C.muted }}>
                      📍 Xuất xứ đánh bắt:{" "}
                      <strong style={{ color: C.text }}>
                        {product.origin}
                      </strong>
                    </div>
                  )}
                  {product.expiryDate && (
                    <div style={{ fontSize: 13, color: C.muted }}>
                      📅 Hạn sử dụng khuyên dùng:{" "}
                      <strong style={{ color: C.text }}>
                        {product.expiryDate}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {product.type === "Fresh" && product.lat && (
                <div
                  style={{
                    marginTop: 20,
                    borderRadius: 16,
                    overflow: "hidden",
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <MapMini lat={product.lat} lng={product.lng} />
                </div>
              )}

              {showChat && user && (
                <div style={{ marginTop: 20 }}>
                  <ChatBox
                    product={product}
                    onClose={() => setShowChat(false)}
                    user={user}
                  />
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div>
              <div
                style={{
                  background: C.white,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  padding: "24px",
                  boxShadow: "0 10px 25px -5px rgba(11, 79, 108, 0.03)",
                  position: "sticky",
                  top: 80,
                }}
              >
                {/* Badges */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      background:
                        product.type === "Fresh" ? "#FDE8E0" : "#FEF5E4",
                      color: product.type === "Fresh" ? C.coral : "#B45309",
                      borderRadius: 8,
                      padding: "4px 12px",
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {product.type === "Fresh"
                      ? "🌊 Hải sản Tươi"
                      : "🔥 Hải sản Khô"}
                  </span>
                  {product.salesType === "Wholesale" && (
                    <span
                      style={{
                        background: "#F1F5F9",
                        color: "#334155",
                        borderRadius: 8,
                        padding: "4px 12px",
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      Bán sỉ
                    </span>
                  )}
                </div>

                <h1
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: C.dark,
                    marginBottom: 8,
                    lineHeight: 1.3,
                  }}
                >
                  {product.name}
                </h1>

                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: C.ocean,
                    marginBottom: 16,
                  }}
                >
                  {fmt(product.price)}
                  <span
                    style={{ fontSize: 14, fontWeight: 600, color: C.muted }}
                  >
                    /kg
                  </span>
                </div>

                {/* Stock */}
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: C.muted,
                      marginBottom: 4,
                    }}
                  >
                    <span>Còn lại {product.remainingWeight} kg</span>
                    <span>{pct}%</span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: C.bg,
                      borderRadius: 99,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, pct)}%`,
                        background:
                          pct > 50
                            ? "#10b981"
                            : pct > 20
                              ? "#f59e0b"
                              : "#ef4444",
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </div>

                {/* Countdown for fresh */}
                {product.type === "Fresh" && product.catchTime && (
                  <div style={{ marginBottom: 14 }}>
                    <CountdownBadge catchTime={product.catchTime} />
                  </div>
                )}

                {/* CTA Buttons */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <button
                    onClick={() => {
                      if (!user) {
                        navigate("/dang-nhap");
                        return;
                      }
                      setShowChat((v) => !v);
                    }}
                    style={{
                      padding: "14px 0",
                      borderRadius: 12,
                      border: "none",
                      background: `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 15,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    💬 Nhắn tin với ngư dân
                  </button>
                  <button
                    onClick={handleToggleFavorite}
                    disabled={favLoading}
                    style={{
                      padding: "12px 0",
                      borderRadius: 12,
                      border: `1.5px solid ${isFavorited ? "#DC2626" : C.border}`,
                      background: isFavorited ? "#FEE2E2" : C.white,
                      color: isFavorited ? "#DC2626" : C.muted,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {isFavorited ? "❤️ Đã lưu" : "🤍 Lưu yêu thích"}
                  </button>
                  <button
                    onClick={handleToggleFollow}
                    disabled={togglingFollow}
                    style={{
                      padding: "12px 0",
                      borderRadius: 12,
                      border: `1.5px solid ${isFollowing ? C.ocean : C.border}`,
                      background: isFollowing ? C.oceanP : C.white,
                      color: isFollowing ? C.ocean : C.muted,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {isFollowing ? "✅ Đang theo dõi" : "+ Theo dõi ngư dân"}
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    style={{
                      fontSize: 12,
                      color: C.muted,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      paddingTop: 4,
                    }}
                  >
                    🚩 Báo cáo sản phẩm
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <ReviewList product={product} user={user} />

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
                  background: C.white,
                  borderRadius: 16,
                  padding: 28,
                  maxWidth: 400,
                  width: "90%",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: C.dark,
                    marginBottom: 8,
                  }}
                >
                  🚩 Báo cáo sản phẩm
                </h3>
                {reportSent ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "20px 0",
                      color: C.ok,
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
                        borderRadius: 10,
                        border: `1px solid ${C.border}`,
                        fontFamily: "inherit",
                        fontSize: 14,
                        resize: "vertical",
                        marginBottom: 14,
                      }}
                    />
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => setShowReportModal(false)}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          borderRadius: 10,
                          border: `1px solid ${C.border}`,
                          background: C.white,
                          color: C.muted,
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
                          borderRadius: 10,
                          border: "none",
                          background: C.coral,
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
        </>
      )}
    </div>
  );
}
