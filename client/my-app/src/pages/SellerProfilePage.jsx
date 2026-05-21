import React, { useState, useEffect } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { fmt } from "../utils/format";
import { ProductCard } from "../components/ProductCard";
import { ReviewList } from "../components/ReviewList";

export function SellerProfilePage({
  seller,
  setPage,
  setSelectedProduct,
  user,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("products"); // 'products' | 'reviews'
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    if (!seller?.id) {
      setPage("home");
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
      style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 80px" }}
    >
      {/* Back */}
      <button
        onClick={() => setPage("home")}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: C.ocean,
          fontSize: 14,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 20,
          padding: 0,
          fontFamily: "inherit",
        }}
      >
        ← Quay lại
      </button>

      {/* Header card */}
      <div
        style={{
          background: C.white,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
          marginBottom: 24,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        {/* Banner */}
        <div
          style={{
            height: 100,
            background: `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: -28,
              left: 28,
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: C.coral,
              border: "3px solid #fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
            }}
          >
            🧑‍🌾
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: "40px 28px 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h1
                style={{
                  margin: "0 0 6px",
                  fontSize: 22,
                  fontWeight: 800,
                  color: C.dark,
                }}
              >
                {sellerName}
              </h1>
              {sellerRating !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#F59E0B", fontSize: 16 }}>
                    {"★".repeat(Math.round(sellerRating))}
                    {"☆".repeat(5 - Math.round(sellerRating))}
                  </span>
                  <span
                    style={{ fontSize: 14, fontWeight: 700, color: C.dark }}
                  >
                    {sellerRating.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 13, color: C.muted }}>
                    ({ratingCount} đánh giá)
                  </span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { label: "Bài đăng", value: products.length, emoji: "📦" },
                { label: "Hải sản tươi", value: freshCount, emoji: "🌊" },
                { label: "Hải sản khô", value: driedCount, emoji: "🔥" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    textAlign: "center",
                    padding: "10px 16px",
                    background: C.bg,
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: 20 }}>{s.emoji}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
          marginBottom: 20,
        }}
      >
        {[
          ["products", "📦 Sản phẩm"],
          ["reviews", "⭐ Đánh giá"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "inherit",
              background: tab === k ? C.ocean : "transparent",
              color: tab === k ? "#fff" : C.muted,
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <>
          {/* Type filter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[
              { id: "all", label: "Tất cả" },
              { id: "fresh", label: "🌊 Tươi" },
              { id: "dried", label: "🔥 Khô" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: `1px solid ${typeFilter === f.id ? C.ocean : C.border}`,
                  background: typeFilter === f.id ? C.ocean : C.white,
                  color: typeFilter === f.id ? "#fff" : C.text,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
              Đang tải...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
              <div style={{ fontSize: 48 }}>📭</div>
              <div style={{ marginTop: 12, fontWeight: 600 }}>
                Chưa có sản phẩm nào
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))",
                gap: 16,
              }}
            >
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onClick={(prod) => {
                    setSelectedProduct(prod);
                    setPage("detail");
                  }}
                />
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
