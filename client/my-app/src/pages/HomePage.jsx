/**
 * HomePage.jsx - Full-width Carousel with Ultra-Smooth Sliding Transition (Amazon Style)
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { ProductCard, ProductSkeleton } from "../components/ProductCard";
import { MapExplore } from "../components/MapExplore";
import { useSEO } from "../hooks/useSEO";

const PAGE_SIZE = 20;
const SCROLL_KEY = "homepage_scroll_y";

// Mảng chứa các ảnh nền xoay vòng lưu trong thư mục public/
const HERO_BGS = ["/hero-ocean.jpg", "/hero-ocean2.jpg", "/hero-ocean3.jpg"];

export function HomePage({ user }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [tab, setTab] = useState("fresh");
  const [gps, setGps] = useState({ status: "idle", lat: null, lng: null });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minWeight, setMinWeight] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [sort, setSort] = useState("newest");
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // State quản lý chỉ số ảnh nền hiện tại của Carousel
  const [bgIndex, setBgIndex] = useState(0);

  // State quản lý hiệu ứng hover 2 nút chuyển ảnh
  const [hoverLeft, setHoverLeft] = useState(false);
  const [hoverRight, setHoverRight] = useState(false);

  // Hover states cho các nút lọc danh mục
  const [hoveredFilter, setHoveredFilter] = useState(null);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const timerRef = useRef(null); // Ref lưu trữ bộ đếm giờ (Interval)

  const searchRef = useRef(search);
  searchRef.current = search;

  useSEO({
    title: "Chợ Hải Sản Online — Tươi từ Ngư Dân",
    description:
      "Mua bán hải sản tươi &amp; khô trực tiếp từ ngư dân đánh bắt. Giao hàng tươi nhanh trong 20km — Giao đồ khô toàn quốc.",
  });

  // Hàm khởi động/khởi động lại bộ đếm giờ tự chuyển ảnh (Resets Autoplay)
  const resetAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % HERO_BGS.length);
    }, 4000); // 4 giây tự đổi ảnh
  }, []);

  // Chạy lần đầu khi load trang
  useEffect(() => {
    resetAutoplay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetAutoplay]);

  // Hàm xử lý khi ấn nút Lùi ảnh (Left Arrow)
  const handlePrev = (e) => {
    e.stopPropagation();
    setBgIndex((prev) => (prev - 1 + HERO_BGS.length) % HERO_BGS.length);
    resetAutoplay(); // Reset lại thời gian đợi sau khi nhấn thủ công
  };

  // Hàm xử lý khi ấn nút Tiến ảnh (Right Arrow)
  const handleNext = (e) => {
    e.stopPropagation();
    setBgIndex((prev) => (prev + 1) % HERO_BGS.length);
    resetAutoplay(); // Reset lại thời gian đợi sau khi nhấn thủ công
  };

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

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sort === "price_asc") return parseFloat(a.price) - parseFloat(b.price);
    if (sort === "price_desc") return parseFloat(b.price) - parseFloat(a.price);
    if (sort === "rating")
      return parseFloat(b.sellerRating || 0) - parseFloat(a.sellerRating || 0);
    if (sort === "views") return (b.viewCount || 0) - (a.viewCount || 0);
    const bTime = b.bumpedAt ? new Date(b.bumpedAt) : new Date(b.createdAt);
    const aTime = a.bumpedAt ? new Date(a.bumpedAt) : new Date(a.createdAt);
    return bTime - aTime;
  });

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
      handleGps();
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    api("/favorites/ids")
      .then((ids) => setFavoriteIds(ids))
      .catch(() => {});
  }, [user]);

  const fetchPage1 = useCallback(
    async (currentSearch) => {
      setLoading(true);
      setError("");
      setPage(1);
      setHasMore(true);

      const params = new URLSearchParams({
        type: tab === "fresh" ? "Fresh" : "Dried",
        page: "1",
        limit: String(PAGE_SIZE),
      });
      if (currentSearch) params.set("search", currentSearch);
      if (tab === "fresh" && gps.lat) {
        params.set("lat", gps.lat);
        params.set("lng", gps.lng);
      }

      try {
        const data = await api(`/products?${params}`);
        const items = data.data || [];
        setProducts(items);
        setHasMore(items.length === PAGE_SIZE);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [tab, gps.lat, gps.lng],
  );

  useEffect(() => {
    const t = setTimeout(() => fetchPage1(search), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [tab, search, gps.lat, gps.lng, fetchPage1]);

  const fetchNextPage = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);

    const nextPage = page + 1;
    const params = new URLSearchParams({
      type: tab === "fresh" ? "Fresh" : "Dried",
      page: String(nextPage),
      limit: String(PAGE_SIZE),
    });
    if (searchRef.current) params.set("search", searchRef.current);
    if (tab === "fresh" && gps.lat) {
      params.set("lat", gps.lat);
      params.set("lng", gps.lng);
    }

    try {
      const data = await api(`/products?${params}`);
      const items = data.data || [];
      setProducts((prev) => [...prev, ...items]);
      setPage(nextPage);
      setHasMore(items.length === PAGE_SIZE);
    } catch {
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, page, tab, gps.lat, gps.lng]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px" },
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [fetchNextPage]);

  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved && !loading) {
      window.scrollTo({ top: parseInt(saved), behavior: "instant" });
      sessionStorage.removeItem(SCROLL_KEY);
    }
  }, [loading]);

  const handleProductClick = (product) => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    navigate(`/san-pham/${product.id}`);
  };

  // Kiểu CSS chung cho nút mũi tên định dạng kính mờ (Glassmorphism Arrow Button)
  const arrowStyle = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 3,
    background: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    color: "#fff",
    borderRadius: "50%",
    width: 46,
    height: 46,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: "bold",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    userSelect: "none",
  };

  return (
    <div style={{ width: "100%", background: C.bg, minHeight: "100vh" }}>
      {/* ─── PHẦN 1: HERO CAROUSEL FULL-WIDTH (Amazon Style Sliding Track) ─── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 480, // Chiều cao tràn viền hùng vĩ
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(11, 79, 108, 0.08)",
          marginBottom: 32,
        }}
      >
        {/* VIEWPORT KHUNG TRƯỢT NGANG */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            zIndex: 0,
          }}
        >
          {/* TRACK CHỨA CÁC SLIDES LIÊN TỤC */}
          <div
            style={{
              display: "flex",
              width: `${HERO_BGS.length * 100}%`,
              height: "100%",
              // Dịch chuyển ngang mượt mà bằng TranslateX
              transform: `translateX(-${bgIndex * (100 / HERO_BGS.length)}%)`,
              // Hiệu ứng lướt ngang Cubic-Bezier cao cấp giống Amazon
              transition: "transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          >
            {HERO_BGS.map((bg) => (
              <div
                key={bg}
                style={{
                  width: `${100 / HERO_BGS.length}%`,
                  height: "100%",
                  background: `url(${bg}) center/cover no-repeat`,
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Lớp phủ dải màu Gradient (Dark Overlay) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(11, 79, 108, 0.45) 0%, rgba(0, 0, 0, 0.25) 100%)",
            zIndex: 1,
          }}
        />

        {/* NÚT MŨI TÊN TRÁI (Prev Button) */}
        <button
          onClick={handlePrev}
          onMouseEnter={() => setHoverLeft(true)}
          onMouseLeave={() => setHoverLeft(false)}
          style={{
            ...arrowStyle,
            left: 24,
            background: hoverLeft
              ? "rgba(255, 255, 255, 0.3)"
              : "rgba(255, 255, 255, 0.15)",
            transform: hoverLeft
              ? "translateY(-50%) scale(1.08)"
              : "translateY(-50%) scale(1)",
          }}
          aria-label="Ảnh trước"
        >
          ⟨
        </button>

        {/* NÚT MŨI TÊN PHẢI (Next Button) */}
        <button
          onClick={handleNext}
          onMouseEnter={() => setHoverRight(true)}
          onMouseLeave={() => setHoverRight(false)}
          style={{
            ...arrowStyle,
            right: 24,
            background: hoverRight
              ? "rgba(255, 255, 255, 0.3)"
              : "rgba(255, 255, 255, 0.15)",
            transform: hoverRight
              ? "translateY(-50%) scale(1.08)"
              : "translateY(-50%) scale(1)",
          }}
          aria-label="Ảnh tiếp theo"
        >
          ⟩
        </button>

        {/* Nội dung kính mờ Glassmorphic căn lề chuẩn theo lưới 1200px */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              padding: 32,
              borderRadius: 20,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
              maxWidth: 550,
            }}
          >
            <h1
              style={{
                fontSize: 34,
                fontWeight: 800,
                margin: "0 0 12px",
                letterSpacing: "-0.5px",
                color: "#fff",
              }}
            >
              Chợ Hải Sản Online 🐟
            </h1>
            <p
              style={{
                opacity: 0.9,
                margin: "0 0 28px",
                fontSize: 15,
                lineHeight: 1.6,
                color: "#fff",
              }}
            >
              Mua bán hải sản tươi &amp; khô trực tiếp từ ngư dân đánh bắt. Giao
              hàng tươi nhanh trong 20km — Giao đồ khô toàn quốc.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={handleGps}
                style={{
                  background:
                    gps.status === "ok"
                      ? "rgba(45, 125, 70, 0.85)"
                      : "rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  padding: "12px 22px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  transition: "all 0.25s ease",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    gps.status === "ok"
                      ? "rgba(45, 125, 70, 1)"
                      : "rgba(255, 255, 255, 0.25)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    gps.status === "ok"
                      ? "rgba(45, 125, 70, 0.85)"
                      : "rgba(255, 255, 255, 0.15)")
                }
              >
                {gps.status === "ok"
                  ? "✅ Đã nhận diện GPS"
                  : gps.status === "loading"
                    ? "📡 Đang tìm vị trí..."
                    : "📍 Bật GPS xem sản phẩm gần bạn"}
              </button>
              {!user && (
                <button
                  onClick={() => navigate("/dang-nhap")}
                  style={{
                    background: C.coral,
                    color: "#fff",
                    border: "none",
                    padding: "12px 22px",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    boxShadow: "0 6px 20px rgba(232, 100, 58, 0.4)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-1.5px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "none")
                  }
                >
                  + Đăng bán ngay
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── PHẦN 2: NỘI DUNG CHÍNH (Căn lề 1200px) ─── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 24 }}>
          <span
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 18,
              opacity: 0.7,
            }}
          >
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Tìm cá thu, tôm hùm, mực khô..."
            style={{
              width: "100%",
              padding: "16px 16px 16px 48px",
              border: `1.5px solid ${isSearchFocused ? C.ocean : C.border}`,
              borderRadius: 14,
              fontSize: 15,
              outline: "none",
              background: C.white,
              boxSizing: "border-box",
              fontFamily: "inherit",
              transition: "all 0.25s ease",
              boxShadow: isSearchFocused
                ? `0 0 0 4px rgba(11, 79, 108, 0.12), 0 4px 12px rgba(0,0,0,0.05)`
                : "0 2px 8px rgba(0,0,0,0.02)",
            }}
          />
        </div>

        {/* Hàng điều hướng: Tabs + Bộ lọc chính */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* Tabs Hải sản */}
          <div
            style={{
              display: "flex",
              gap: 4,
              background: "#E2E8F0",
              borderRadius: 12,
              padding: 4,
              width: "fit-content",
            }}
          >
            {[
              ["fresh", "🌊 Hải sản tươi"],
              ["dried", "🔥 Hải sản khô"],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => {
                  setTab(k);
                  setProducts([]);
                }}
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                  background: tab === k ? C.white : "transparent",
                  color:
                    tab === k ? (k === "fresh" ? C.coral : "#B45309") : C.muted,
                  boxShadow: tab === k ? "0 4px 10px rgba(0,0,0,0.06)" : "none",
                  fontFamily: "inherit",
                  transition: "all 0.2s ease",
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Smart Filters */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { id: "all", label: "Tất cả" },
              { id: "recent", label: "🐟 Mới đánh bắt (< 6h)" },
              { id: "topRated", label: "⭐ Người bán uy tín" },
              { id: "wholesale", label: "📦 Bán buôn" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                onMouseEnter={() => setHoveredFilter(f.id)}
                onMouseLeave={() => setHoveredFilter(null)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 24,
                  border: `1.5px solid ${filter === f.id ? C.ocean : "transparent"}`,
                  background:
                    filter === f.id
                      ? C.oceanP
                      : hoveredFilter === f.id
                        ? "#EDF2F7"
                        : C.white,
                  color: filter === f.id ? C.ocean : C.text,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            style={{
              background: hasAdvancedFilter ? C.ocean : C.white,
              color: hasAdvancedFilter ? "#fff" : C.text,
              border: `1px solid ${hasAdvancedFilter ? C.ocean : C.border}`,
              padding: "8px 18px",
              borderRadius: 12,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            }}
          >
            🎛️ Bộ lọc nâng cao{" "}
            {hasAdvancedFilter && (
              <span
                style={{
                  background: C.coral,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                }}
              ></span>
            )}{" "}
            {showAdvanced ? "▲" : "▼"}
          </button>

          {showAdvanced && (
            <div
              style={{
                marginTop: 12,
                padding: "20px 24px",
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                display: "flex",
                gap: 20,
                flexWrap: "wrap",
                alignItems: "flex-end",
                boxShadow: "0 10px 25px rgba(0,0,0,0.04)",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.muted,
                    marginBottom: 8,
                  }}
                >
                  💰 Khoảng giá (VNĐ/kg)
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="number"
                    placeholder="Từ"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    style={{
                      width: 120,
                      padding: "9px 12px",
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
                      width: 120,
                      padding: "9px 12px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.muted,
                    marginBottom: 8,
                  }}
                >
                  ⚖️ Sẵn có tối thiểu (kg)
                </div>
                <input
                  type="number"
                  placeholder="VD: 5"
                  value={minWeight}
                  onChange={(e) => setMinWeight(e.target.value)}
                  style={{
                    width: 140,
                    padding: "9px 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
              </div>
              {hasAdvancedFilter && (
                <button
                  onClick={() => {
                    setPriceMin("");
                    setPriceMax("");
                    setMinWeight("");
                  }}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: "#FEE2E2",
                    color: "#991B1B",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                >
                  ✕ Xoá tất cả bộ lọc
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sort + View Toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>
              Sắp xếp theo:
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "8px 14px",
                fontSize: 13,
                background: "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
                color: "#374151",
                outline: "none",
                boxShadow: "0 2px 4px rgba(0,0,0,0.01)",
              }}
            >
              <option value="newest">🕐 Đăng mới nhất / Tin được đẩy</option>
              <option value="price_asc">💰 Giá tăng dần</option>
              <option value="price_desc">💰 Giá giảm dần</option>
              <option value="rating">⭐ Đánh giá người bán</option>
              <option value="views">👁 Nhiều lượt xem nhất</option>
            </select>
          </div>

          {tab === "fresh" && (
            <div style={{ display: "flex" }}>
              <div
                style={{
                  display: "flex",
                  background: "#E2E8F0",
                  borderRadius: 10,
                  padding: 3,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setViewMode("grid")}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12,
                    background: viewMode === "grid" ? C.white : "transparent",
                    color: viewMode === "grid" ? C.ocean : C.muted,
                    boxShadow:
                      viewMode === "grid"
                        ? "0 2px 6px rgba(0,0,0,0.05)"
                        : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  📱 Dạng Lưới
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12,
                    background: viewMode === "map" ? C.white : "transparent",
                    color: viewMode === "map" ? C.ocean : C.muted,
                    boxShadow:
                      viewMode === "map"
                        ? "0 2px 6px rgba(0,0,0,0.05)"
                        : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  🗺️ Bản Đồ
                </button>
              </div>
            </div>
          )}
        </div>

        {tab === "fresh" && (
          <div
            style={{
              background: C.oceanP,
              border: `1px solid ${C.oceanL}40`,
              borderRadius: 12,
              padding: "12px 18px",
              marginBottom: 24,
              fontSize: 13,
              color: C.ocean,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>ℹ️</span>
            <span>
              Chỉ hiển thị hải sản tươi sống trong phạm vi bán kính{" "}
              <strong>20km</strong> từ vị trí định vị của bạn. Bài đăng tự động
              ẩn sau <strong>24 giờ</strong> để đảm bảo độ tươi mới.
            </span>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#FEE2E2",
              color: "#991B1B",
              borderRadius: 12,
              padding: "12px 18px",
              marginBottom: 24,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Product Grid / Map */}
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
              gap: 24,
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              color: C.muted,
              background: C.white,
              borderRadius: 20,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>
              Không tìm thấy kết quả phù hợp
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
              Hãy thử thay đổi từ khóa hoặc bộ lọc của bạn
            </div>
          </div>
        ) : viewMode === "map" && tab === "fresh" ? (
          <MapExplore
            products={sortedProducts}
            userLocation={
              gps.status === "ok" ? { lat: gps.lat, lng: gps.lng } : null
            }
            onProductClick={(prod) => {
              sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
              navigate(`/san-pham/${prod.id}`);
            }}
          />
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                gap: 24,
              }}
            >
              {sortedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  user={user}
                  onClick={() => handleProductClick(p)}
                  favoriteIds={favoriteIds}
                  onFavoriteChange={(id, fav) => {
                    setFavoriteIds((prev) =>
                      fav ? [...prev, id] : prev.filter((x) => x !== id),
                    );
                  }}
                />
              ))}
            </div>

            {/* ── Infinite Scroll Sentinel ── */}
            <div ref={sentinelRef} style={{ height: 1, marginTop: 32 }} />

            {/* Loading more indicator */}
            {loadingMore && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                  gap: 24,
                  marginTop: 24,
                }}
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            )}

            {/* End of list indicator */}
            {!hasMore && products.length > PAGE_SIZE && (
              <div
                style={{
                  textAlign: "center",
                  padding: "36px 0 12px",
                  color: C.muted,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                🎉 Đã hiển thị toàn bộ {sortedProducts.length} sản phẩm phù hợp
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
