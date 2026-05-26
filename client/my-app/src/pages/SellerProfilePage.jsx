/**
 * SellerProfilePage.jsx — Modernized UI/UX Version
 *
 * Giữ nguyên 100% logic lọc tươi/khô, đếm số lượng mẻ hàng,
 * gọi API lấy danh sách và hiển thị ReviewList.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { fmt } from "../utils/format";
import { ProductCard } from "../components/ProductCard";
import { ReviewList } from "../components/ReviewList";
import { VerifiedBadge } from "../components/VerifiedBadge";

export function SellerProfilePage({ seller, user }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("products"); // 'products' | 'reviews'
  const [typeFilter, setTypeFilter] = useState("all");

  // State hỗ trợ hover bộ lọc
  const [hoveredFilter, setHoveredFilter] = useState(null);

  useEffect(() => {
    if (!seller?.id) {
      navigate("/");
      return;
    }
    api(`/products?sellerId=${seller.id}&limit=100`)
      .then((data) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [seller?.id]);

  const filtered = products.filter((p) => {
    if (typeFilter === "fresh") return p.type === "Fresh";
    if (typeFilter === "dried") return p.type === "Dried";
    return true;
  });

  const sellerName = seller?.name || products[0]?.sellerName || "...";
  const sellerRating = products[0]?.sellerRating
    ? parseFloat(products[0].sellerRating)
    : null;
  const ratingCount = products[0]?.ratingCount || 0;
  const freshCount = products.filter((p) => p.type === "Fresh").length;
  const driedCount = products.filter((p) => p.type === "Dried").length;

  if (!seller?.id) return null;

  return (
    <div
      style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}
    >
      {/* Nút Quay Lại dạng Pill Button mượt mà */}
      <button
        onClick={() => navigate("/")}
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
        ⟨ Quay lại trang chủ
      </button>

      {/* Thẻ Hồ sơ cá nhân (Header Card) mộc nổi 3D */}
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
        {/* Banner chính biển sâu */}
        <div
          style={{
            height: 110,
            background: `linear-gradient(135deg, #0B4F6C 0%, #1A7FA0 100%)`,
            position: "relative",
          }}
        >
          {/* Avatar bo viền mộc nổi và đổ bóng nhẹ */}
          <div
            style={{
              position: "absolute",
              bottom: -28,
              left: 28,
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: C.coral,
              border: "3px solid #fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
              zIndex: 3,
            }}
          >
            🧑‍🌾
          </div>
        </div>

        {/* Khung chi tiết hồ sơ bên dưới banner */}
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
            <div>
              <h1
                style={{
                  margin: "0 0 8px",
                  fontSize: 24,
                  fontWeight: 800,
                  color: C.dark,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {sellerName}
                {seller?.isVerified && <VerifiedBadge size="md" showLabel />}
              </h1>
              {sellerRating !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#F59E0B", fontSize: 16 }}>
                    {"★".repeat(Math.round(sellerRating))}
                    {"☆".repeat(5 - Math.round(sellerRating))}
                  </span>
                  <span
                    style={{ fontSize: 14, fontWeight: 800, color: C.dark }}
                  >
                    {sellerRating.toFixed(1)}
                  </span>
                  <span
                    style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}
                  >
                    ({ratingCount} lượt đánh giá tin cậy)
                  </span>
                </div>
              )}
            </div>

            {/* Các thẻ chỉ số mẻ hàng */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { label: "Mẻ đang đăng", value: products.length, emoji: "📦" },
                { label: "Hải sản tươi", value: freshCount, emoji: "🌊" },
                { label: "Đồ khô đóng gói", value: driedCount, emoji: "🔥" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    textAlign: "center",
                    padding: "10px 18px",
                    background: "#F8FAFC",
                    borderRadius: 12,
                    border: "1px solid #F1F5F9",
                    minWidth: 90,
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 2 }}>{s.emoji}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>
                    {s.value}
                  </div>
                  <div
                    style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu dạng Sliding Switch cao cấp đồng bộ */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#E2E8F0",
          borderRadius: 12,
          padding: 4,
          width: "fit-content",
          marginBottom: 24,
        }}
      >
        {[
          ["products", "📦 Gian hàng hải sản"],
          ["reviews", "⭐ Lượt đánh giá"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "inherit",
              background: tab === k ? C.white : "transparent",
              color: tab === k ? C.ocean : C.muted,
              boxShadow: tab === k ? "0 4px 10px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <>
          {/* Bộ lọc phân loại hải sản tươi/khô mượt mà */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {[
              { id: "all", label: "Tất cả" },
              { id: "fresh", label: "🌊 Hải sản tươi sống" },
              { id: "dried", label: "🔥 Hải sản khô đóng gói" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                onMouseEnter={() => setHoveredFilter(f.id)}
                onMouseLeave={() => setHoveredFilter(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 24,
                  border: `1.5px solid ${typeFilter === f.id ? C.ocean : "transparent"}`,
                  background:
                    typeFilter === f.id
                      ? C.oceanP
                      : hoveredFilter === f.id
                        ? "#EDF2F7"
                        : C.white,
                  color: typeFilter === f.id ? C.ocean : C.text,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s ease",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                gap: 24,
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton-shimmer"
                  style={{ height: 280, borderRadius: 20 }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "64px 20px",
                color: C.muted,
                background: C.white,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>
                Gian hàng hiện chưa bày bán sản phẩm nào
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                Hãy quay lại sau hoặc chuyển sang xem Đánh giá của người bán
                này.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                gap: 24, // Tăng khoảng trống grid gap lên 24px để các card thở mượt mà
              }}
            >
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "reviews" && (
        <ReviewList sellerId={seller.id} user={user} productId={null} />
      )}
    </div>
  );
}
