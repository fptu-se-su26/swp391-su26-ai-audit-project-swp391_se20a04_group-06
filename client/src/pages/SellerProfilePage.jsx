/**
 * SellerProfilePage.jsx — Khắc phục hoàn toàn lỗi lặp render của LazyTab
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { ProductCard } from "../components/ProductCard";
import { ReviewList } from "../components/ReviewList";
import { useAuth } from "../context/AuthContext";
import { useApiFetch } from "../hooks/useApiFetch";
import { FishermanProfileHeader } from "../components/FishermanProfileHeader";
import { FishermanRecipesTab } from "./tabs/FishermanRecipesTab";
import { FishermanPostsTab } from "./tabs/FishermanPostsTab";
import { FishermanBoatLogsTab } from "./tabs/FishermanBoatLogsTab";

function LazyTab({ active, children }) {
  const [hasBeenActive, setHasBeenActive] = useState(active);

  useEffect(() => {
    // Chỉ kích hoạt khi tab thực sự chuyển từ Inactive sang Active
    if (active && !hasBeenActive) {
      // Đẩy tác vụ vào hàng đợi microtask bất đồng bộ để tránh cascading render
      Promise.resolve().then(() => setHasBeenActive(true));
    }
  }, [active, hasBeenActive]);

  if (!hasBeenActive) return null;
  return <div style={{ display: active ? "block" : "none" }}>{children}</div>;
}

export function SellerProfilePage({ seller }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("products");
  const [typeFilter, setTypeFilter] = useState("all");
  const [hoveredFilter, setHoveredFilter] = useState(null);

  // Fetch profile tổng hợp — stats đầy đủ
  const { data: profile, loading: profileLoading } = useApiFetch(
    `/fishermen/${seller.id}/profile`,
    [seller.id],
  );

  useEffect(() => {
    if (!seller?.id) {
      navigate("/");
      return;
    }
    api(`/products?sellerId=${seller.id}&limit=100`)
      .then((data) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [seller?.id, navigate]);

  const filtered = products.filter((p) => {
    if (typeFilter === "fresh") return p.type === "Fresh";
    if (typeFilter === "dried") return p.type === "Dried";
    return true;
  });

  if (!seller?.id) return null;

  return (
    <div
      style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}
    >
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

      {/* Header */}
      <FishermanProfileHeader
        profile={profile}
        isLoading={profileLoading}
        sellerId={seller.id}
      />

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#E2E8F0",
          borderRadius: 12,
          padding: 4,
          width: "fit-content",
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {[
          ["products", `🐟 Gian hàng (${products.length})`],
          [
            "recipes",
            `🍳 Công thức (${profile?.stats?.totalRecipes ?? "..."})`,
          ],
          ["posts", `💬 Cộng đồng (${profile?.stats?.totalPosts ?? "..."})`],
          [
            "boatlogs",
            `⛵ Nhật ký (${profile?.stats?.totalBoatLogs ?? "..."})`,
          ],
          ["reviews", `⭐ Đánh giá (${profile?.stats?.ratingCount ?? "..."})`],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "inherit",
              background: tab === k ? C.white : "transparent",
              color: tab === k ? C.ocean : C.muted,
              boxShadow: tab === k ? "0 4px 10px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.2s",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Tab: Sản phẩm */}
      {tab === "products" && (
        <>
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
            <div className="product-grid">
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
            </div>
          ) : (
            <div className="product-grid">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Công thức */}
      <LazyTab active={tab === "recipes"}>
        <FishermanRecipesTab sellerId={seller.id} />
      </LazyTab>

      {/* Tab: Bài đăng cộng đồng */}
      <LazyTab active={tab === "posts"}>
        <FishermanPostsTab sellerId={seller.id} />
      </LazyTab>

      {/* Tab: Nhật ký cabin */}
      <LazyTab active={tab === "boatlogs"}>
        <FishermanBoatLogsTab sellerId={seller.id} />
      </LazyTab>

      {/* Tab: Đánh giá */}
      {tab === "reviews" && (
        <ReviewList sellerId={seller.id} user={user} productId={null} />
      )}
    </div>
  );
}
