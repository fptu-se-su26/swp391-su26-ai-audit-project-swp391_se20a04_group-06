import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { api } from "../services/api";
import { ProductCard, ProductSkeleton } from "../components/ProductCard";
import { MapExplore } from "../components/MapExplore";
import { useSEO } from "../hooks/useSEO";
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

const PAGE_SIZE = 20;
const SCROLL_KEY = "productlistpage_scroll_y";

const CATEGORY_CHIPS = [
  { id: "All", label: "🏷️ Tất cả loài", emoji: "🏷️" },
  { id: "Fish", label: "🐟 Cá tươi sạch", emoji: "🐟" },
  { id: "Shrimp", label: "🦐 Tôm biển", emoji: "🦐" },
  { id: "Squid", label: "🦑 Mực, Bạch tuộc", emoji: "🦑" },
  { id: "Crab", label: "🦀 Cua, Ghẹ", emoji: "🦀" },
  { id: "Shellfish", label: "🐚 Nghêu, Sò, Ốc", emoji: "🐚" },
  { id: "Others", label: "✨ Loại khác", emoji: "✨" },
];

export function ProductListPage() {
  const { user } = useAuth();
  const vtNavigate = useViewTransitionNavigate();
  const location = useLocation();

  // Parse parameters from query URL to act as single source of truth
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const searchParam = queryParams.get("search") || "";
  const categoryParam = queryParams.get("category") || "All";
  const tabParam = queryParams.get("tab") || "fresh";

  const [tab, setTab] = useState(tabParam);
  const [category, setCategory] = useState(categoryParam);
  const [gps, setGps] = useState({ status: "idle", lat: null, lng: null });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sort, setSort] = useState("newest");
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Sync state if query URL parameters change
  useEffect(() => {
    setTab(tabParam);
    setCategory(categoryParam);
  }, [tabParam, categoryParam]);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const stateRef = useRef({
    page,
    hasMore,
    loadingMore,
    loading,
    tab,
    category,
    gps,
    search: searchParam,
  });

  useEffect(() => {
    stateRef.current = {
      page,
      hasMore,
      loadingMore,
      loading,
      tab,
      category,
      gps,
      search: searchParam,
    };
  }, [page, hasMore, loadingMore, loading, tab, category, gps, searchParam]);

  useSEO({
    title: "Chợ Hải Sản Bản Địa Trực Tuyến | HảiSản.vn",
    description: "鮮魚通販. Chợ hải sản trực tuyến HảiSản.vn - Mua hải sản tươi sống trực tiếp từ các ngư thuyền cập cảng Việt Nam.",
  });

  const sortedProducts = useMemo(
    () =>
      [...products].sort((a, b) => {
        if (sort === "price_asc")
          return parseFloat(a.price) - parseFloat(b.price);
        if (sort === "price_desc")
          return parseFloat(b.price) - parseFloat(a.price);
        if (sort === "rating")
          return (
            parseFloat(b.sellerRating || 0) - parseFloat(a.sellerRating || 0)
          );
        if (sort === "views") return (b.viewCount || 0) - (a.viewCount || 0);
        const bTime = b.bumpedAt ? new Date(b.bumpedAt) : new Date(b.createdAt);
        const aTime = a.bumpedAt ? new Date(a.bumpedAt) : new Date(a.createdAt);
        return bTime - aTime;
      }),
    [products, sort],
  );

  /* ─── GPS (silent background detection) ─── */
  const handleGps = useCallback(() => {
    setGps((g) => ({ ...g, status: "loading" }));
    if (!navigator.geolocation) {
      setGps({ status: "denied", lat: null, lng: null });
      return;
    }
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
  }, []);

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
  }, [handleGps]);

  useEffect(() => {
    if (!user) return;
    api("/favorites/ids")
      .then((ids) => setFavoriteIds(ids))
      .catch(() => { });
  }, [user]);

  const buildParams = useCallback(
    (pageNum, currentSearch) => {
      const params = new URLSearchParams({
        type: tab === "fresh" ? "Fresh" : "Dried",
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      if (currentSearch) params.set("search", currentSearch);
      if (category && category !== "All") params.set("category", category);
      if (tab === "fresh" && gps.lat) {
        params.set("lat", String(gps.lat));
        params.set("lng", String(gps.lng));
      }
      return params;
    },
    [tab, category, gps.lat, gps.lng],
  );

  const fetchPage1 = useCallback(
    async (currentSearch) => {
      setLoading(true);
      setError("");
      setPage(1);
      setHasMore(true);
      try {
        const data = await api(`/products?${buildParams(1, currentSearch)}`);
        const items = data.data || [];
        setProducts(items);
        setHasMore(items.length === PAGE_SIZE);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [buildParams],
  );

  useEffect(() => {
    const t = setTimeout(() => fetchPage1(searchParam), searchParam ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchPage1, searchParam]);

  const fetchNextPage = useCallback(async () => {
    const {
      loadingMore: lm,
      hasMore: hm,
      loading: ld,
      tab: t,
      category: cat,
      gps: g,
      search: s,
      page: p,
    } = stateRef.current;
    if (lm || !hm || ld) return;

    setLoadingMore(true);
    const nextPage = p + 1;
    const params = new URLSearchParams({
      type: t === "fresh" ? "Fresh" : "Dried",
      page: String(nextPage),
      limit: String(PAGE_SIZE),
    });
    if (s) params.set("search", s);
    if (cat && cat !== "All") params.set("category", cat);
    if (t === "fresh" && g.lat) {
      params.set("lat", String(g.lat));
      params.set("lng", String(g.lng));
    }

    try {
      const data = await api(`/products?${params}`);
      const items = data.data || [];
      setProducts((prev) => [...prev, ...items]);
      setPage(nextPage);
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      /* silent */
    } finally {
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    observerRef.current?.disconnect();
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
    if (loading) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      window.scrollTo({ top: parseInt(saved, 10), behavior: "instant" });
      sessionStorage.removeItem(SCROLL_KEY);
    }
  }, [loading]);

  const handleProductClick = useCallback(
    (productId) => {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      vtNavigate(`/san-pham/${productId}`);
    },
    [vtNavigate],
  );

  const handleFavoriteChange = useCallback((id, fav) => {
    setFavoriteIds((prev) =>
      fav ? [...prev, id] : prev.filter((x) => x !== id),
    );
  }, []);

  const handleTabClick = (k) => {
    if (tab !== k) {
      const params = new URLSearchParams(location.search);
      params.set("tab", k);
      params.set("category", "All"); // Reset category on tab change
      vtNavigate(`/san-pham?${params.toString()}`);
    }
  };

  const handleCategorySelect = (catId) => {
    if (category !== catId) {
      const params = new URLSearchParams(location.search);
      params.set("category", catId);
      vtNavigate(`/san-pham?${params.toString()}`);
    }
  };

  const handleClearSearch = () => {
    const params = new URLSearchParams(location.search);
    params.delete("search");
    vtNavigate(`/san-pham?${params.toString()}`);
  };

  return (
    <div className="page-wrap-lg fade-up" style={{ padding: "0 16px", margin: "0 auto", maxWidth: "1200px" }}>
      {/* Hero section */}
      <div style={{
        textAlign: "center",
        padding: "50px 20px 30px",
        background: "linear-gradient(135deg, #166f52 0%, #208f67 50%, #1a9c6d 100%)",
        borderRadius: "var(--radius-xl)",
        color: "#fff",
        margin: "30px 0 0",
        boxShadow: "0 8px 30px rgba(32, 143, 103, 0.25)"
      }}>
        <span style={{
          textTransform: "uppercase",
          letterSpacing: "2px",
          fontSize: "12px",
          fontWeight: "700",
          color: "#ECD223",
          background: "rgba(255,255,255,0.1)",
          padding: "6px 14px",
          borderRadius: "99px",
          display: "inline-block",
          marginBottom: "16px"
        }}>
          🐟 Chợ hải sản trực tuyến
        </span>
        <h1 style={{ fontSize: "2.3rem", fontWeight: "800", lineHeight: "1.2", margin: 0, color: "#fff" }}>
          Hải Sản Tươi Sống Ngư Dân Bản Địa
        </h1>
        <p style={{ maxWidth: "600px", margin: "10px auto 0", color: "rgba(255,255,255,0.8)", fontSize: "15px" }}>
          Mua hải sản trực tiếp từ tàu cá cập cảng. Cam kết độ tươi ngon 100%, bảo quản lạnh tự nhiên không dùng hóa chất.
        </p>
      </div>

      {/* ═══ PRODUCTS SECTION ON TEAL BACKGROUND ═══ */}
      <div className="products-filter-section">
        {/* Section title */}
        <div style={{ textAlign: "center" }}>
          <h2>Chợ Hải Sản Bản Địa Trực Tuyến</h2>
          {searchParam && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "10px" }}>
              <span style={{ fontSize: "13px", color: "#fff", background: "rgba(255,255,255,0.15)", padding: "5px 14px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "6px", backdropFilter: "blur(4px)" }}>
                Từ khóa: <strong>"{searchParam}"</strong>
                <button onClick={handleClearSearch} style={{ border: "none", background: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontWeight: "bold", padding: "0 2px", fontSize: "16px" }}>×</button>
              </span>
            </div>
          )}
        </div>

        {/* Filter controls row */}
        <div className="filter-controls-row">
          {/* Left: Tab selectors styled as a single segmented pill container */}
          <div className="filter-tab-pill-container">
            <button
              onClick={() => handleTabClick("fresh")}
              className={tab === "fresh" ? "active" : ""}
            >
              🌊 Tươi sống
            </button>
            <button
              onClick={() => handleTabClick("dried")}
              className={tab === "dried" ? "active" : ""}
            >
              🔥 Đồ khô / Một nắng
            </button>
          </div>

          {/* Right: Sort & View Toggle aligned compactly */}
          <div className="sort-view-wrapper">
            <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.7)" }}>Sắp xếp:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest" style={{ color: "#333" }}>Mới nhất / Đã đẩy</option>
              <option value="price_asc" style={{ color: "#333" }}>Giá tăng dần</option>
              <option value="price_desc" style={{ color: "#333" }}>Giá giảm dần</option>
              <option value="rating" style={{ color: "#333" }}>Đánh giá ngư dân</option>
              <option value="views" style={{ color: "#333" }}>Nhiều lượt xem</option>
            </select>

            {tab === "fresh" && (
              <div className="view-mode-toggle">
                <button
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "active" : ""}
                >
                  Lưới
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={viewMode === "map" ? "active" : ""}
                >
                  Bản đồ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category chips horizontally scrollable on mobile, keeping it extremely neat */}
        <div className="category-chips-container hide-scrollbar">
          {CATEGORY_CHIPS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`category-chip-button ${category === cat.id ? "active" : ""}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Info banner (umai.fish style) */}


        {/* Error display */}
        {error && (
          <div className="errorBanner" role="alert" style={{ margin: "0 5px 20px 5px" }}>
            {error}
          </div>
        )}

        {/* Products listing */}
        {loading ? (
          <div className="product-grid" style={{ padding: "0 5px" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.7)" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
            <h3 style={{ color: "#fff", fontWeight: "800", fontSize: "18px", marginBottom: "6px" }}>Không tìm thấy kết quả phù hợp</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>Hãy thử thay đổi từ khoá hoặc bộ lọc của bạn</p>
          </div>
        ) : viewMode === "map" && tab === "fresh" ? (
          <div style={{ padding: "0 5px" }}>
            <MapExplore
              products={sortedProducts}
              userLocation={gps.status === "ok" ? { lat: gps.lat, lng: gps.lng } : null}
              onProductClick={(prod) => {
                sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
                vtNavigate(`/san-pham/${prod.id}`);
              }}
            />
          </div>
        ) : (
          <>
            <div className="product-grid" style={{ padding: "0 5px" }}>
              {sortedProducts.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  user={user}
                  cardIndex={i}
                  onClick={handleProductClick}
                  favoriteIds={favoriteIds}
                  onFavoriteChange={handleFavoriteChange}
                />
              ))}
            </div>

            <div ref={sentinelRef} style={{ height: 1, marginTop: 32 }} />

            {loadingMore && (
              <div className="product-grid" style={{ padding: "20px 5px 0 5px" }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            )}

            {!hasMore && products.length > PAGE_SIZE && (
              <div style={{ textAlign: "center", marginTop: "30px", color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: "600" }}>
                Đã hiển thị toàn bộ {sortedProducts.length} sản phẩm
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
