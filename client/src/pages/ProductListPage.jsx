import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { api } from "../services/api";
import { ProductCard, ProductSkeleton } from "../components/ProductCard";
import { MapExplore } from "../components/MapExplore";
import { useSEO } from "../hooks/useSEO";
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

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
  const vtNavigate = useViewTransitionNavigate(); // chỉ dùng khi chuyển sang trang khác
  const plainNavigate = useNavigate(); // dùng cho tab/category/search — cùng trang
  const location = useLocation();

  // Parse parameters from query URL to act as single source of truth
  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const searchParam = queryParams.get("search") || "";
  const categoryParam = queryParams.get("category") || "All";
  const tabParam = queryParams.get("tab") || "fresh";

  const [searchInput, setSearchInput] = useState(searchParam);
  const [prevSearchParam, setPrevSearchParam] = useState(searchParam);

  if (prevSearchParam !== searchParam) {
    setPrevSearchParam(searchParam);
    setSearchInput(searchParam);
  }

  const [gps, setGps] = useState(() => {
    const savedLat = localStorage.getItem("seafood_lat");
    const savedLng = localStorage.getItem("seafood_lng");
    if (savedLat && savedLng) {
      return {
        status: "ok",
        lat: parseFloat(savedLat),
        lng: parseFloat(savedLng),
      };
    }
    if (!navigator.geolocation) {
      return { status: "denied", lat: null, lng: null };
    }
    return { status: "idle", lat: null, lng: null };
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // tab/category switch — keep grid, just dim
  const [loadingMore, setLoadingMore] = useState(false);

  // Skeleton chỉ hiện lần đầu; các lần sau chỉ dim grid cũ
  const isFirstLoadRef = useRef(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sort, setSort] = useState("newest");
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const stateRef = useRef({
    page,
    hasMore,
    loadingMore,
    loading,
    refreshing: false,
    tab: tabParam,
    category: categoryParam,
    gps,
    search: searchParam,
  });

  useEffect(() => {
    stateRef.current = {
      page,
      hasMore,
      loadingMore,
      loading,
      refreshing,
      tab: tabParam,
      category: categoryParam,
      gps,
      search: searchParam,
    };
  }, [
    page,
    hasMore,
    loadingMore,
    loading,
    refreshing,
    tabParam,
    categoryParam,
    gps,
    searchParam,
  ]);

  useSEO({
    title: "Chợ Hải Sản Bản Địa Trực Tuyến | Haisan.vn",
    description:
      "鮮魚通販. Chợ hải sản trực tuyến Haisan.vn - Mua hải sản tươi sống trực tiếp từ các ngư thuyền cập cảng Việt Nam.",
  });

  const sortedProducts = useMemo(
    () =>
      [...products].sort((a, b) => {
        if (sort === "price_asc")
          return parseFloat(a.price) - parseFloat(b.price);
        if (sort === "price_desc")
          return parseFloat(b.price) - parseFloat(b.price);
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
  useEffect(() => {
    if (gps.status !== "idle") return;
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
  }, [gps.status]);

  useEffect(() => {
    if (!user) return;
    api("/favorites/ids")
      .then((ids) => setFavoriteIds(ids))
      .catch(() => {});
  }, [user]);

  const buildParams = useCallback(
    (pageNum, currentSearch) => {
      const params = new URLSearchParams({
        type: tabParam === "fresh" ? "Fresh" : "Dried",
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      if (currentSearch) params.set("search", currentSearch);
      if (categoryParam && categoryParam !== "All")
        params.set("category", categoryParam);
      if (tabParam === "fresh" && gps.lat) {
        params.set("lat", String(gps.lat));
        params.set("lng", String(gps.lng));
      }
      return params;
    },
    [tabParam, categoryParam, gps.lat, gps.lng],
  );

  // pages/ProductListPage.jsx

  const fetchPage1 = useCallback(
    async (currentSearch, signal) => {
      // Lần đầu tiên: hiện skeleton toàn bộ
      // Các lần sau (đổi tab/category/search): giữ grid cũ, chỉ dim nhẹ
      if (isFirstLoadRef.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      isFirstLoadRef.current = false;

      setError("");
      setPage(1);
      setHasMore(true);
      try {
        const data = await api(`/products?${buildParams(1, currentSearch)}`, {
          signal,
        });
        const items = data.data || [];
        setProducts(items);
        setHasMore(items.length === PAGE_SIZE);
      } catch (e) {
        // Tránh ghi nhận lỗi hiển thị nếu yêu cầu bị hủy bỏ chủ động
        if (e?.name !== "AbortError" && !signal?.aborted) {
          setError(e.message);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [buildParams],
  );

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    // Áp dụng trì hoãn 250ms khi đổi tab/category và 400ms khi gõ tìm kiếm để giảm tải tần suất gọi API
    const delay = searchParam ? 400 : 250;
    const t = setTimeout(() => {
      fetchPage1(searchParam, signal);
    }, delay);

    return () => {
      clearTimeout(t);
      controller.abort(); // Hủy yêu cầu cũ ngay khi dependency (tab, category, search) thay đổi
    };
  }, [fetchPage1, searchParam]);

  const fetchNextPage = useCallback(async () => {
    const {
      loadingMore: lm,
      hasMore: hm,
      loading: ld,
      refreshing: rf,
      tab: t,
      category: cat,
      gps: g,
      search: s,
      page: p,
    } = stateRef.current;
    if (lm || !hm || ld || rf) return;

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

  // ─── Filter handlers: dùng plainNavigate (không View Transition)
  // vtNavigate chỉ cho chuyển sang trang khác (product detail, v.v.)
  const handleTabClick = (k) => {
    if (tabParam !== k) {
      const params = new URLSearchParams(location.search);
      params.set("tab", k);
      params.set("category", "All");
      plainNavigate(`/san-pham?${params.toString()}`);
    }
  };

  const handleCategorySelect = (catId) => {
    if (categoryParam !== catId) {
      const params = new URLSearchParams(location.search);
      params.set("category", catId);
      plainNavigate(`/san-pham?${params.toString()}`);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(location.search);
    if (searchInput.trim()) {
      params.set("search", searchInput.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    plainNavigate(`/san-pham?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    const params = new URLSearchParams(location.search);
    params.delete("search");
    plainNavigate(`/san-pham?${params.toString()}`);
  };

  return (
    <div
      className="page-wrap-lg fade-up"
      style={{ padding: "0 16px", margin: "0 auto", maxWidth: "1200px" }}
    >
      {/* ═══ PRODUCTS SECTION ON TEAL BACKGROUND ═══ */}
      <div className="products-filter-section" style={{ marginTop: "30px" }}>
        {/* ─── Search bar ─── */}
        <div style={{ padding: "24px 5px 0", textAlign: "center" }}>
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: "flex",
              maxWidth: "560px",
              margin: "0 auto",
              backgroundColor: "#fff",
              borderRadius: "30px",
              padding: "4px 6px 4px 16px",
              alignItems: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <span
              style={{ fontSize: "16px", marginRight: "6px", opacity: 0.5 }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Tìm cá, mực, tôm..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "14px",
                color: "#333",
                background: "transparent",
              }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "#999",
                  fontSize: "18px",
                  padding: "0 6px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
            <button
              type="submit"
              style={{
                backgroundColor: "#ECD223",
                color: "#166f52",
                border: "none",
                borderRadius: "20px",
                padding: "8px 20px",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              Tìm kiếm
            </button>
          </form>

          {searchParam && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                marginTop: "10px",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  color: "#fff",
                  background: "rgba(255,255,255,0.15)",
                  padding: "5px 14px",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backdropFilter: "blur(4px)",
                }}
              >
                Từ khóa: <strong>"{searchParam}"</strong>
                <button
                  onClick={handleClearSearch}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.7)",
                    fontWeight: "bold",
                    padding: "0 2px",
                    fontSize: "16px",
                  }}
                >
                  ×
                </button>
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
              className={tabParam === "fresh" ? "active" : ""}
            >
              🌊 Tươi sống
            </button>
            <button
              onClick={() => handleTabClick("dried")}
              className={tabParam === "dried" ? "active" : ""}
            >
              🔥 Đồ khô / Một nắng
            </button>
          </div>

          {/* Right: Sort & View Toggle aligned compactly */}
          <div className="sort-view-wrapper">
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Sắp xếp:
            </span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest" style={{ color: "#333" }}>
                Mới nhất / Đã đẩy
              </option>
              <option value="price_asc" style={{ color: "#333" }}>
                Giá tăng dần
              </option>
              <option value="price_desc" style={{ color: "#333" }}>
                Giá giảm dần
              </option>
              <option value="rating" style={{ color: "#333" }}>
                Đánh giá ngư dân
              </option>
              <option value="views" style={{ color: "#333" }}>
                Nhiều lượt xem
              </option>
            </select>

            {tabParam === "fresh" && (
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

        {/* Category chips horizontally scrollable on mobile */}
        <div className="category-chips-container hide-scrollbar">
          {CATEGORY_CHIPS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`category-chip-button ${categoryParam === cat.id ? "active" : ""}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Error display */}
        {error && (
          <div
            className="errorBanner"
            role="alert"
            style={{ margin: "0 5px 20px 5px" }}
          >
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
        ) : sortedProducts.length === 0 && !refreshing ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
            <h3
              style={{
                color: "#fff",
                fontWeight: "800",
                fontSize: "18px",
                marginBottom: "6px",
              }}
            >
              Không tìm thấy kết quả phù hợp
            </h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
              Hãy thử thay đổi từ khoá hoặc bộ lọc của bạn
            </p>
          </div>
        ) : (
          // Khi refreshing: giữ grid hiện tại, chỉ dim + block interaction
          <div
            style={{
              opacity: refreshing ? 0.45 : 1,
              pointerEvents: refreshing ? "none" : "auto",
              transition: "opacity 0.22s ease",
            }}
          >
            {viewMode === "map" && tabParam === "fresh" ? (
              <div style={{ padding: "0 5px" }}>
                <MapExplore
                  products={sortedProducts}
                  userLocation={
                    gps.status === "ok" ? { lat: gps.lat, lng: gps.lng } : null
                  }
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
                  <div
                    className="product-grid"
                    style={{ padding: "20px 5px 0 5px" }}
                  >
                    {Array.from({ length: 4 }).map((_, i) => (
                      <ProductSkeleton key={i} />
                    ))}
                  </div>
                )}

                {!hasMore && products.length > PAGE_SIZE && (
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: "30px",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    Đã hiển thị toàn bộ {sortedProducts.length} sản phẩm
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
