import React, { useState, useEffect } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { ProductCard, ProductSkeleton } from "../components/ProductCard";
import { MapExplore } from "../components/MapExplore";
export function HomePage({
  setPage,
  setSelectedProduct,
  user,
  setSelectedSeller,
}) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("fresh");
  const [gps, setGps] = useState({ status: "idle", lat: null, lng: null });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minWeight, setMinWeight] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const filteredProducts = products.filter((p) => {
    if (filter === "recent") {
      if (!p.catchTime) return false;
      const diff = Date.now() - new Date(p.catchTime).getTime();
      if (diff >= 6 * 3600000) return false;
    }
    if (
      filter === "topRated" &&
      !(p.sellerRating && parseFloat(p.sellerRating) >= 4.0)
    )
      return false;
    if (filter === "wholesale" && p.salesType !== "Wholesale") return false;
    if (priceMin !== "" && parseFloat(p.price) < parseFloat(priceMin))
      return false;
    if (priceMax !== "" && parseFloat(p.price) > parseFloat(priceMax))
      return false;
    if (
      minWeight !== "" &&
      parseFloat(p.remainingWeight) < parseFloat(minWeight)
    )
      return false;
    return true;
  });
  const hasAdvancedFilter =
    priceMin !== "" || priceMax !== "" || minWeight !== "";

  const handleGps = () => {
    setGps((g) => ({ ...g, status: "loading" }));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          localStorage.setItem("seafood_lat", pos.coords.latitude);
          localStorage.setItem("seafood_lng", pos.coords.longitude);
          setGps({
            status: "ok",
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => setGps({ status: "denied", lat: null, lng: null }),
      );
    } else setGps({ status: "denied", lat: null, lng: null });
  };

  useEffect(() => {
    const savedLat = localStorage.getItem("seafood_lat");
    const savedLng = localStorage.getItem("seafood_lng");
    if (savedLat && savedLng) {
      setGps({
        status: "ok",
        lat: parseFloat(savedLat),
        lng: parseFloat(savedLng),
      });
    } else {
      handleGps(); // Auto request on first visit
    }
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      type: tab === "fresh" ? "Fresh" : "Dried",
      limit: "50",
    });
    if (search) params.set("search", search);
    if (tab === "fresh" && gps.lat) {
      params.set("lat", gps.lat);
      params.set("lng", gps.lng);
    }

    api(`/products?${params}`)
      .then((data) => {
        if (active) setProducts(data.data || []);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tab, search, gps.lat, gps.lng]);

  return (
    <div
      style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 80px" }}
    >
      {/* Hero */}
      <div
        style={{
          background: "url(/hero-ocean.png) center/cover no-repeat",
          borderRadius: 16,
          padding: "48px 36px",
          marginBottom: 24,
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              margin: "0 0 12px",
              textShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            Chợ Hải Sản Online 🐟
          </h1>
          <p
            style={{
              opacity: 0.95,
              margin: "0 0 24px",
              maxWidth: 480,
              fontSize: 15,
              lineHeight: 1.5,
              textShadow: "0 1px 5px rgba(0,0,0,0.3)",
            }}
          >
            Mua bán hải sản tươi &amp; khô trực tiếp từ ngư dân. Tươi trong 20km
            — Khô giao toàn quốc.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={handleGps}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                color: "#fff",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                padding: "12px 20px",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "inherit",
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)")
              }
            >
              {gps.status === "ok"
                ? "✅ Đã bật định vị (GPS)"
                : gps.status === "loading"
                  ? "📡 Đang tìm vị trí..."
                  : "📍 Bật GPS xem hải sản tươi gần bạn"}
            </button>
            {!user && (
              <button
                onClick={() => setPage("auth")}
                style={{
                  background: C.coral,
                  color: "#fff",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  boxShadow: "0 4px 15px rgba(232, 100, 58, 0.3)",
                }}
              >
                + Đăng bán ngay
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 16,
          }}
        >
          🔍
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm cá thu, tôm hùm, mực khô..."
          style={{
            width: "100%",
            padding: "12px 14px 12px 44px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 10,
            fontSize: 14,
            outline: "none",
            background: C.white,
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
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
          marginBottom: 16,
        }}
      >
        {[
          ["fresh", `🌊 Hải sản tươi`],
          ["dried", "🔥 Hải sản khô"],
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
              background:
                tab === k
                  ? k === "fresh"
                    ? "#FDE8E0"
                    : "#FEF5E4"
                  : "transparent",
              color:
                tab === k ? (k === "fresh" ? C.coral : "#8A5C00") : C.muted,
              fontFamily: "inherit",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Smart Filters */}
      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}
      >
        {[
          { id: "all", label: "Tất cả" },
          { id: "recent", label: "🐟 Mới đánh bắt (< 6h)" },
          { id: "topRated", label: "⭐ Người bán uy tín" },
          { id: "wholesale", label: "📦 Bán buôn" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: `1px solid ${filter === f.id ? C.ocean : C.border}`,
              background: filter === f.id ? C.ocean : C.white,
              color: filter === f.id ? "#fff" : C.text,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          style={{
            background: hasAdvancedFilter ? C.ocean : C.white,
            color: hasAdvancedFilter ? "#fff" : C.muted,
            border: `1px solid ${hasAdvancedFilter ? C.ocean : C.border}`,
            padding: "6px 14px",
            borderRadius: 20,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          🎛️ Lọc nâng cao {hasAdvancedFilter ? "•" : ""}{" "}
          {showAdvanced ? "▲" : "▼"}
        </button>

        {showAdvanced && (
          <div
            style={{
              marginTop: 10,
              padding: "16px 18px",
              background: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            {/* Giá */}
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.muted,
                  marginBottom: 6,
                }}
              >
                💰 Giá (VNĐ/kg)
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="number"
                  placeholder="Từ"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  style={{
                    width: 100,
                    padding: "7px 10px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
                <span style={{ color: C.muted, fontSize: 13 }}>—</span>
                <input
                  type="number"
                  placeholder="Đến"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  style={{
                    width: 100,
                    padding: "7px 10px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Còn hàng tối thiểu */}
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.muted,
                  marginBottom: 6,
                }}
              >
                ⚖️ Còn hàng tối thiểu (kg)
              </div>
              <input
                type="number"
                placeholder="VD: 5"
                value={minWeight}
                onChange={(e) => setMinWeight(e.target.value)}
                style={{
                  width: 120,
                  padding: "7px 10px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            </div>

            {/* Reset */}
            {hasAdvancedFilter && (
              <button
                onClick={() => {
                  setPriceMin("");
                  setPriceMax("");
                  setMinWeight("");
                }}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#FEE2E2",
                  color: "#991B1B",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ✕ Xoá bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* View Toggle (Grid/Map) - Chỉ hiển thị khi chọn Hải sản tươi */}
      {tab === "fresh" && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              background: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: "8px 16px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
                background: viewMode === "grid" ? C.oceanP : "transparent",
                color: viewMode === "grid" ? C.ocean : C.muted,
              }}
            >
              📱 Dạng Lưới
            </button>
            <button
              onClick={() => setViewMode("map")}
              style={{
                padding: "8px 16px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
                borderLeft: `1px solid ${C.border}`,
                background: viewMode === "map" ? C.oceanP : "transparent",
                color: viewMode === "map" ? C.ocean : C.muted,
              }}
            >
              🗺️ Bản Đồ
            </button>
          </div>
        </div>
      )}

      {tab === "fresh" && (
        <div
          style={{
            background: C.oceanP,
            border: `1px solid ${C.oceanL}`,
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: C.ocean,
          }}
        >
          ℹ️ Chỉ hiển thị bài trong vòng <strong>20km</strong>. Bài tự động ẩn
          sau <strong>24 giờ</strong>.
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#FEE2E2",
            color: "#991B1B",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))",
            gap: 16,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: C.muted,
          }}
        >
          <div style={{ fontSize: 52 }}>🔍</div>
          <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600 }}>
            Không tìm thấy kết quả phù hợp
          </div>
        </div>
      ) : viewMode === "map" && tab === "fresh" ? (
        <MapExplore
          products={filteredProducts}
          userLocation={
            gps.status === "ok" ? { lat: gps.lat, lng: gps.lng } : null
          }
          onProductClick={(prod) => {
            setSelectedProduct(prod);
            setPage("detail");
          }}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))",
            gap: 16,
          }}
        >
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onClick={(prod) => {
                setSelectedProduct(prod);
                setPage("detail");
              }}
              onSellerClick={
                setSelectedSeller
                  ? (prod) => {
                      setSelectedSeller({
                        id: prod.sellerId,
                        name: prod.sellerName,
                      });
                      setPage("seller");
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
