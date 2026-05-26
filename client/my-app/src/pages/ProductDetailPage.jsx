/**
 * ProductDetailPage.jsx — Modernized UI/UX Version
 *
 * Giữ nguyên 100% logic dynamic SEO, Favorites, Follows, Report Modal và Reviews.
 * Tích hợp responsive grid mượt mà cho thiết bị di động.
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

export function ProductDetailPage({
  product: initialProduct,
  setPage,
  user,
  setSelectedSeller,
}) {
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

  // ── SEO: dynamic meta per product ────────────────────────────
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
    if (!initialProduct?.id) {
      if (setPage) setPage("home");
      return;
    }
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
      alert(e.message);
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
    } finally {
      setFavLoading(false);
    }
  };

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
    if (setPage) setPage("home");
    return null;
  }

  const pct = Math.round((product.remainingWeight / product.totalWeight) * 100);

  return (
    <div
      style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}
    >
      {/* Nút Quay Lại được thiết kế dạng Pill Button hiện đại */}
      <button
        onClick={() => (setPage ? setPage("home") : navigate(-1))}
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
          {/* Lưới chi tiết: Gắn class "product-detail-grid" phục vụ responsive */}
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

              {/* Mô tả sản phẩm bo tròn lớn */}
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
                    borderTop: `1px solid #F3F4F6`,
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

            {/* RIGHT SIDEBAR (Khung mua hàng & thông tin người bán) */}
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
                {/* Mác phân loại */}
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
                        background: C.oceanP,
                        color: C.ocean,
                        borderRadius: 8,
                        padding: "4px 12px",
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      📦 Bán Buôn
                    </span>
                  )}
                </div>

                {/* Tên sản phẩm chính */}
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: C.dark,
                    margin: "0 0 14px",
                    lineHeight: 1.4,
                  }}
                >
                  {product.name}
                </h1>

                {/* Đơn giá nổi bật */}
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: C.coral,
                    marginBottom: 20,
                  }}
                >
                  {fmt(product.price)}
                  <span
                    style={{ fontSize: 14, fontWeight: 500, color: C.muted }}
                  >
                    /kg
                  </span>
                </div>

                {/* Trọng lượng và thanh đo sẵn có */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      color: C.muted,
                      marginBottom: 8,
                    }}
                  >
                    <span>
                      Còn lại:{" "}
                      <strong style={{ color: C.dark, fontWeight: 700 }}>
                        {product.remainingWeight} kg
                      </strong>
                    </span>
                    <span>Tổng mẻ: {product.totalWeight} kg</span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: "#E5E7EB",
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background:
                          pct > 50 ? C.ok : pct > 20 ? C.warn : "#EF4444",
                        borderRadius: 10,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Badge thời điểm đánh bắt */}
                {product.type === "Fresh" && product.catchTime && (
                  <div
                    style={{
                      background: "#FEF3C7",
                      borderRadius: 12,
                      padding: "12px 14px",
                      marginBottom: 20,
                      fontSize: 13,
                      border: "1px solid rgba(245, 158, 11, 0.15)",
                    }}
                  >
                    <span style={{ color: "#92400E", fontWeight: 500 }}>
                      ⏱️ Đánh bắt lúc:
                    </span>{" "}
                    <strong style={{ color: C.dark }}>
                      {new Date(product.catchTime).toLocaleString("vi")}
                    </strong>
                    <div style={{ marginTop: 8 }}>
                      <CountdownBadge catchTime={product.catchTime} />
                    </div>
                  </div>
                )}

                {/* Thông tin ngư dân bán */}
                <div
                  style={{
                    borderTop: `1px solid #F3F4F6`,
                    paddingTop: 16,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 13,
                      color: C.muted,
                      marginBottom: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
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
                        if (setPage) setPage("seller");
                      } else {
                        navigate(`/nguoi-ban/${product.sellerId}`);
                      }
                    }}
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: C.ocean,
                      cursor: "pointer",
                      textDecoration: "underline",
                      display: "inline-block",
                    }}
                  >
                    {product.sellerName}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: C.dark,
                      fontWeight: 600,
                      marginTop: 4,
                      marginBottom: 10,
                    }}
                  >
                    📞 {product.sellerPhone}
                  </div>

                  {user && user.id !== product.sellerId && (
                    <button
                      onClick={handleToggleFollow}
                      disabled={togglingFollow}
                      style={{
                        padding: "6px 14px",
                        background: isFollowing ? "#E5E7EB" : C.ocean,
                        color: isFollowing ? C.dark : "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        marginBottom: 10,
                        transition: "all 0.2s",
                      }}
                    >
                      {isFollowing ? "✔️ Đang theo dõi" : "❤️ Theo dõi ngư dân"}
                    </button>
                  )}
                  {product.sellerRating > 0 && (
                    <div
                      style={{
                        fontSize: 12,
                        color: C.muted,
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      ⭐{" "}
                      <strong style={{ color: "#F59E0B" }}>
                        {parseFloat(product.sellerRating).toFixed(1)}
                      </strong>{" "}
                      ({product.ratingCount} đánh giá uy tín)
                    </div>
                  )}
                </div>

                {/* Các nút Kêu gọi hành động (Gradients & CTA) */}
                {user ? (
                  user.id !== product.sellerId ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <button
                        onClick={() => setShowChat(!showChat)}
                        style={{
                          width: "100%",
                          padding: 14,
                          background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
                          color: "#fff",
                          border: "none",
                          borderRadius: 12,
                          cursor: "pointer",
                          fontSize: 15,
                          fontWeight: 700,
                          fontFamily: "inherit",
                          boxShadow: "0 4px 14px rgba(11, 79, 108, 0.2)",
                        }}
                      >
                        💬{" "}
                        {showChat ? "Đóng hộp chat" : "Trò chuyện thương lượng"}
                      </button>
                      <a
                        href={`tel:${product.sellerPhone}`}
                        style={{
                          display: "block",
                          textAlign: "center",
                          width: "100%",
                          padding: 14,
                          background: `linear-gradient(135deg, ${C.ok} 0%, #15803d 100%)`,
                          color: "#fff",
                          borderRadius: 12,
                          fontSize: 14,
                          fontWeight: 700,
                          textDecoration: "none",
                          boxSizing: "border-box",
                          boxShadow: "0 4px 14px rgba(45, 125, 70, 0.25)",
                        }}
                      >
                        📞 Gọi trực tiếp ngay
                      </a>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          background: C.oceanP,
                          borderRadius: 10,
                          padding: "10px 14px",
                          fontSize: 13,
                          color: C.ocean,
                          textAlign: "center",
                          fontWeight: 700,
                        }}
                      >
                        Bài viết này thuộc sở hữu của bạn
                      </div>
                      <button
                        onClick={() => setShowChat(!showChat)}
                        style={{
                          width: "100%",
                          padding: 14,
                          background: C.ocean,
                          color: "#fff",
                          border: "none",
                          borderRadius: 12,
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 700,
                          fontFamily: "inherit",
                        }}
                      >
                        💬{" "}
                        {showChat
                          ? "Đóng hộp chat"
                          : "Xem tin nhắn từ người mua"}
                      </button>
                    </div>
                  )
                ) : (
                  <button
                    onClick={() =>
                      setPage ? setPage("auth") : navigate("/dang-nhap")
                    }
                    style={{
                      width: "100%",
                      padding: 14,
                      background: C.coral,
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "inherit",
                      boxShadow: "0 4px 14px rgba(232, 100, 58, 0.3)",
                    }}
                  >
                    🔐 Đăng nhập để kết nối giao dịch
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Dòng tương tác: Thả tim + Báo cáo vi phạm */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 32,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={handleToggleFavorite}
              disabled={favLoading}
              style={{
                background: isFavorited ? "#FEE2E2" : C.white,
                color: isFavorited ? "#DC2626" : "#4B5563",
                border: "1px solid #E5E7EB",
                padding: "10px 20px",
                borderRadius: 12,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 4px rgba(0,0,0,0.01)",
              }}
            >
              {isFavorited ? "❤️ Đã lưu vào yêu thích" : "🤍 Lưu tin yêu thích"}
            </button>
            {user && user.id !== product.sellerId && (
              <button
                onClick={() => setShowReportModal(true)}
                style={{
                  background: C.white,
                  color: "#9CA3AF",
                  border: "1px solid #E5E7EB",
                  padding: "10px 16px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.01)",
                }}
              >
                🚩 Báo cáo tin vi phạm
              </button>
            )}
            {product.viewCount > 0 && (
              <span
                style={{
                  fontSize: 13,
                  color: C.muted,
                  marginLeft: "auto",
                  fontWeight: 600,
                }}
              >
                👁️ Đã có {product.viewCount} lượt xem tin đăng này
              </span>
            )}
          </div>

          {/* Modal Báo cáo nâng cấp sang trọng */}
          {showReportModal && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.45)", // Backdrop tối sâu hơn dạng kính mờ
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                zIndex: 10000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
              }}
              onClick={() => setShowReportModal(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  padding: "28px",
                  width: "100%",
                  maxWidth: 440,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 16px",
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#991B1B",
                  }}
                >
                  🚩 Báo cáo vi phạm tin đăng
                </h3>
                {reportSent ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "24px 0",
                      color: "#059669",
                      fontWeight: 700,
                      fontSize: 16,
                    }}
                  >
                    ✅ Gửi báo cáo thành công! Ban quản trị sẽ rà soát ngay.
                  </div>
                ) : (
                  <>
                    <p
                      style={{
                        fontSize: 13,
                        color: C.muted,
                        marginBottom: 16,
                        lineHeight: 1.5,
                      }}
                    >
                      Hãy chọn một lý do báo cáo chính xác cho tin đăng "
                      <strong>{product.name}</strong>" để giúp duy trì cộng đồng
                      chợ sạch đẹp:
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        marginBottom: 20,
                      }}
                    >
                      {[
                        "Thông tin sai sự thật",
                        "Hàng giả/kém chất lượng",
                        "Giá cả gian lận",
                        "Nội dung không phù hợp",
                        "Người bán lừa đảo",
                      ].map((r) => (
                        <label
                          key={r}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 12px",
                            cursor: "pointer",
                            fontSize: 14,
                            borderRadius: 8,
                            transition: "background 0.2s",
                            color: C.text,
                            background:
                              reportReason === r ? "#F8FAFC" : "transparent",
                          }}
                          onMouseEnter={(e) => {
                            if (reportReason !== r)
                              e.currentTarget.style.background = "#F8FAFC";
                          }}
                          onMouseLeave={(e) => {
                            if (reportReason !== r)
                              e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <input
                            type="radio"
                            name="reason"
                            value={r}
                            checked={reportReason === r}
                            onChange={() => setReportReason(r)}
                            style={{ cursor: "pointer" }}
                          />
                          {r}
                        </label>
                      ))}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => setShowReportModal(false)}
                        style={{
                          background: "#F1F5F9",
                          border: "none",
                          padding: "10px 20px",
                          borderRadius: 10,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#475569",
                          fontFamily: "inherit",
                        }}
                      >
                        Huỷ bỏ
                      </button>
                      <button
                        onClick={handleReport}
                        disabled={!reportReason || reportLoading}
                        style={{
                          background: reportReason ? "#EF4444" : "#F1F5F9",
                          color: reportReason ? "#fff" : "#9CA3AF",
                          border: "none",
                          padding: "10px 20px",
                          borderRadius: 10,
                          cursor: reportReason ? "pointer" : "default",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "inherit",
                          transition: "all 0.2s",
                        }}
                      >
                        {reportLoading ? "Đang gửi..." : "Xác nhận gửi"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Phần danh sách đánh giá */}
          <div id="reviews-section" style={{ marginTop: 12 }}>
            <ReviewList
              sellerId={product.sellerId}
              user={user}
              productId={product.id}
              scrollToReviewId={product.scrollToReviewId || null}
            />
          </div>
        </>
      )}

      {/* Responsive CSS dành cho Trang Chi Tiết Sản Phẩm */}
      <style>{`
        @media (max-width: 820px) {
          .product-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
