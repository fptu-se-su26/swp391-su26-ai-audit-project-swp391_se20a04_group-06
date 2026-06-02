import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { ProductCard, ProductSkeleton } from "../components/ProductCard";
import { MapExplore } from "../components/MapExplore";
import { useSEO } from "../hooks/useSEO";
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";
import { useAuth } from "../context/AuthContext";
import {
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GridIcon,
  MapIcon,
  MapPinIcon,
  SlidersIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  XIcon,
  PlusIcon,
  ClockIcon,
  PackageIcon,
  StarIcon,
} from "../components/icons";
import styles from "./HomePage.module.css";

const PAGE_SIZE = 20;
const SCROLL_KEY = "homepage_scroll_y";
const HERO_BGS = ["/hero-ocean.jpg", "/hero-ocean2.jpg", "/hero-ocean3.jpg"];

const CATEGORY_CHIPS = [
  { id: "All", label: "🏷️ Tất cả loài" },
  { id: "Fish", label: "🐟 Cá tươi sạch" },
  { id: "Shrimp", label: "🦐 Tôm biển" },
  { id: "Squid", label: "🦑 Mực, Bạch tuộc" },
  { id: "Crab", label: "🦀 Cua, Ghẹ" },
  { id: "Shellfish", label: "🐚 Nghêu, Sò, Ốc" },
  { id: "Others", label: "✨ Loại khác" },
];

function HeroSlider({ search, setSearch, gps, handleGps, gpsLabel }) {
  const [bgIndex, setBgIndex] = useState(0);
  const timerRef = useRef(null);

  const resetAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % HERO_BGS.length);
    }, 4500);
  }, []);

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetAutoplay]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setBgIndex((prev) => (prev - 1 + HERO_BGS.length) % HERO_BGS.length);
    resetAutoplay();
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setBgIndex((prev) => (prev + 1) % HERO_BGS.length);
    resetAutoplay();
  };

  return (
    <section className={styles.hero} aria-label="Banner">
      <div className={styles.heroTrackWrapper}>
        <div className={styles.heroTrack}>
          {HERO_BGS.map((bg, idx) => (
            <div
              key={bg}
              className={`${styles.heroSlide} ${idx === bgIndex ? styles.activeSlide : ""}`}
              style={{
                backgroundImage: `url(${bg})`,
              }}
            />
          ))}
        </div>
      </div>

      <div className={styles.heroOverlay} />

      <button
        className={`${styles.heroArrow} ${styles.prev}`}
        onClick={handlePrev}
        aria-label="Ảnh trước"
      >
        <ChevronLeftIcon size={22} />
      </button>
      <button
        className={`${styles.heroArrow} ${styles.next}`}
        onClick={handleNext}
        aria-label="Ảnh tiếp theo"
      >
        <ChevronRightIcon size={22} />
      </button>

      <div className={styles.heroDots} role="tablist" aria-label="Slides">
        {HERO_BGS.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === bgIndex}
            aria-label={`Slide ${i + 1}`}
            className={`${styles.heroDot} ${i === bgIndex ? styles.activeDot : ""}`}
            style={{ width: i === bgIndex ? 22 : 7 }}
            onClick={(e) => {
              e.stopPropagation();
              setBgIndex(i);
              resetAutoplay();
            }}
          />
        ))}
      </div>

      <div className={styles.heroContent}>
        <div className={styles.heroCard}>
          <p className={styles.heroEyebrow}>
            <span aria-hidden="true">🐠</span>
            Chợ Hải Sản Online
          </p>
          <h1 className={styles.heroH1}>
            Tươi Từ Ngư Dân,
            <br />
            <span className={styles.heroAccent}>Đến Bàn Của Bạn</span>
          </h1>
          <p className={styles.heroLead}>
            Mua bán hải sản tươi &amp; khô trực tiếp từ ngư dân. Giao tươi
            trong 20km · Khô giao toàn quốc.
          </p>

          <div
            className={styles.searchWrap}
            style={{ margin: "16px 0 24px 0" }}
          >
            <span className={styles.searchIcon}>
              <SearchIcon size={16} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm cá thu, tôm hùm, mực khô..."
              className={styles.searchInput}
              aria-label="Tìm kiếm sản phẩm"
            />
          </div>

          <div className={styles.heroActions}>
            <button
              onClick={handleGps}
              className={`${styles.heroGpsBtn} ${gps.status === "ok" ? styles.gpsOk : ""}`}
              aria-busy={gps.status === "loading"}
            >
              <MapPinIcon size={15} />
              {gpsLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const { user } = useAuth();
  const vtNavigate = useViewTransitionNavigate();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("fresh");
  const [category, setCategory] = useState("All");
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
    search,
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
      search,
    };
  }, [page, hasMore, loadingMore, loading, tab, category, gps, search]);

  useSEO({
    title: "Chợ Hải Sản Online — Tươi từ Ngư Dân",
    description: "Mua bán hải sản tươi & khô trực tiếp từ ngư dân đánh bắt.",
  });

  const filteredProducts = useMemo(
    () =>
      products.filter((p) => {
        if (filter === "recent") {
          if (!p.catchTime) return false;
          if (Date.now() - new Date(p.catchTime).getTime() >= 6 * 3600000)
            return false;
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
      }),
    [products, filter, priceMin, priceMax, minWeight]
  );

  const hasAdvancedFilter =
    priceMin !== "" || priceMax !== "" || minWeight !== "";

  const sortedProducts = useMemo(
    () =>
      [...filteredProducts].sort((a, b) => {
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
    [filteredProducts, sort]
  );

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
      () => setGps({ status: "denied", lat: null, lng: null })
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
    [tab, category, gps.lat, gps.lng]
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
    [buildParams]
  );

  useEffect(() => {
    const t = setTimeout(() => fetchPage1(search), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchPage1, search]);

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
      { rootMargin: "200px" }
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
    [vtNavigate]
  );

  const handleFavoriteChange = useCallback((id, fav) => {
    setFavoriteIds((prev) =>
      fav ? [...prev, id] : prev.filter((x) => x !== id)
    );
  }, []);

  const gpsLabel =
    {
      ok: "Đã nhận GPS",
      loading: "Đang tìm vị trí…",
      denied: "Bật GPS xem gần bạn",
      idle: "Bật GPS xem gần bạn",
    }[gps.status] ?? "Bật GPS";

  return (
    <div className={styles.page}>
      <HeroSlider
        search={search}
        setSearch={setSearch}
        gps={gps}
        handleGps={handleGps}
        gpsLabel={gpsLabel}
      />

      <div className={styles.content}>
        <div className={styles.layoutWrapper}>
          <aside className={styles.leftSidebar}>
            <div className={styles.sidebarSticky}>
              <h3 className={styles.sidebarTitle}>Nguồn hải sản</h3>
              <div className={styles.verticalTabGroup} role="tablist">
                {[
                  { k: "fresh", l: "🌊 Hải sản tươi" },
                  { k: "dried", l: "🔥 Hải sản khô" },
                ].map(({ k, l }) => (
                  <button
                    key={k}
                    role="tab"
                    aria-selected={tab === k}
                    className={`${styles.verticalTab} ${tab === k ? styles.verticalActive : ""}`}
                    onClick={() => {
                      setTab(k);
                      setProducts([]);
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className={styles.mainLayoutBody}>
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 10,
                marginBottom: 20,
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {CATEGORY_CHIPS.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategory(cat.id);
                      setProducts([]);
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 20,
                      border: `1.5px solid ${isSelected ? C.ocean : C.border}`,
                      background: isSelected ? C.ocean : C.white,
                      color: isSelected ? C.white : C.text,
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: 13,
                      whiteSpace: "nowrap",
                      transition: "all 0.2s ease",
                      boxShadow: isSelected
                        ? "0 4px 10px rgba(11, 79, 108, 0.2)"
                        : "none",
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className={styles.filterRow}>
              <div className={styles.chipGroup}>
                {[
                  { id: "all", label: "Tất cả", icon: null },
                  {
                    id: "recent",
                    label: "Mới đánh bắt < 6h",
                    icon: <ClockIcon size={12} />,
                  },
                  {
                    id: "topRated",
                    label: "Người bán uy tín",
                    icon: <StarIcon size={12} />,
                  },
                  {
                    id: "wholesale",
                    label: "Bán buôn",
                    icon: <PackageIcon size={12} />,
                  },
                ].map((f) => (
                  <button
                    key={f.id}
                    className={`${styles.chip} ${filter === f.id ? styles.activeChip : ""}`}
                    onClick={() => setFilter(f.id)}
                    aria-pressed={filter === f.id}
                  >
                    {f.icon}
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              className={`${styles.advancedToggle} ${hasAdvancedFilter ? styles.hasFilter : ""}`}
              onClick={() => setShowAdvanced((v) => !v)}
            >
              <SlidersIcon size={13} />
              Bộ lọc nâng cao
              {hasAdvancedFilter && (
                <span className={styles.filterDot} aria-hidden="true" />
              )}
            </button>

            {showAdvanced && (
              <div className={styles.advancedPanel}>
                <div className={styles.filterGroup}>
                  <label>Khoảng giá (VNĐ/kg)</label>
                  <div className={styles.filterInputRow}>
                    <input
                      type="number"
                      placeholder="Từ"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className={styles.filterInput}
                    />
                    <span className={styles.filterSep}>—</span>
                    <input
                      type="number"
                      placeholder="Đến"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className={styles.filterInput}
                    />
                  </div>
                </div>
                <div className={styles.filterGroup}>
                  <label>Sẵn có tối thiểu (kg)</label>
                  <input
                    type="number"
                    placeholder="VD: 5"
                    value={minWeight}
                    onChange={(e) => setMinWeight(e.target.value)}
                    className={styles.filterInput}
                    style={{ width: 130 }}
                  />
                </div>
                {hasAdvancedFilter && (
                  <button
                    className={styles.clearBtn}
                    onClick={() => {
                      setPriceMin("");
                      setPriceMax("");
                      setMinWeight("");
                    }}
                  >
                    <XIcon size={12} />
                    Xoá bộ lọc
                  </button>
                )}
              </div>
            )}

            <div className={styles.sortRow}>
              <div className={styles.sortLeft}>
                <span className={styles.sortLabel}>Sắp xếp:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className={styles.sortSelect}
                >
                  <option value="newest">Mới nhất / Đã đẩy</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                  <option value="rating">Đánh giá người bán</option>
                  <option value="views">Nhiều lượt xem</option>
                </select>
              </div>

              {tab === "fresh" && (
                <div
                  className={styles.viewToggle}
                  role="group"
                  aria-label="Chế độ xem"
                >
                  {[
                    { k: "grid", icon: <GridIcon size={13} />, l: "Lưới" },
                    { k: "map", icon: <MapIcon size={13} />, l: "Bản đồ" },
                  ].map(({ k, icon, l }) => (
                    <button
                      key={k}
                      className={`${styles.viewBtn} ${viewMode === k ? styles.active : ""}`}
                      onClick={() => setViewMode(k)}
                      aria-pressed={viewMode === k}
                    >
                      {icon}
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {tab === "fresh" && (
              <div className={styles.infoBanner} role="note">
                <InfoIcon size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  Chỉ hiển thị hải sản tươi trong phạm vi <strong>20km</strong>{" "}
                  từ vị trí của bạn. Bài đăng tự ẩn sau <strong>24 giờ</strong>{" "}
                  để đảm bảo độ tươi.
                </span>
              </div>
            )}

            {error && (
              <div className={styles.errorBanner} role="alert">
                <AlertCircleIcon size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {loading ? (
              <div className={styles.grid}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon} aria-hidden="true">
                  🔍
                </div>
                <div className={styles.emptyTitle}>
                  Không tìm thấy kết quả phù hợp
                </div>
                <div className={styles.emptyBody}>
                  Hãy thử thay đổi từ khoá hoặc bộ lọc của bạn
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
                  vtNavigate(`/san-pham/${prod.id}`);
                }}
              />
            ) : (
              <>
                <div className={`${styles.grid} product-grid`}>
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
                  <div className={styles.grid} style={{ marginTop: 20 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <ProductSkeleton key={i} />
                    ))}
                  </div>
                )}

                {!hasMore && products.length > PAGE_SIZE && (
                  <div className={styles.endLabel}>
                    <CheckCircleIcon size={14} />
                    Đã hiển thị toàn bộ {sortedProducts.length} sản phẩm
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}