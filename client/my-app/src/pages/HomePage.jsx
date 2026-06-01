<<<<<<< Updated upstream
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
=======
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  ClockIcon,
  PackageIcon,
  StarIcon,
} from "../components/icons";
import styles from "./HomePage.module.css";

const PAGE_SIZE = 20;
const SCROLL_KEY = "homepage_scroll_y";
const HERO_BGS = ["/hero-ocean.jpg", "/hero-ocean2.jpg", "/hero-ocean3.jpg"];

const CATEGORY_CHIPS = [
  { id: "All",      label: "🏷️ Tất cả loài" },
  { id: "Fish",     label: "🐟 Cá tươi sạch" },
  { id: "Shrimp",   label: "🦐 Tôm biển" },
  { id: "Squid",    label: "🦑 Mực, Bạch tuộc" },
  { id: "Crab",     label: "🦀 Cua, Ghẹ" },
  { id: "Shellfish",label: "🐚 Nghêu, Sò, Ốc" },
  { id: "Others",   label: "✨ Loại khác" },
];

export function HomePage() {
  const { user } = useAuth();
  const vtNavigate = useViewTransitionNavigate();

  const [search, setSearch]           = useState("");
  const [tab, setTab]                 = useState("fresh");
  const [category, setCategory]       = useState("All");
  const [gps, setGps]                 = useState({ status: "idle", lat: null, lng: null });
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState("");
  const [filter, setFilter]           = useState("all");
  const [priceMin, setPriceMin]       = useState("");
  const [priceMax, setPriceMax]       = useState("");
  const [minWeight, setMinWeight]     = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewMode, setViewMode]       = useState("grid");
  const [sort, setSort]               = useState("newest");
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const [bgIndex, setBgIndex]         = useState(0);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const timerRef    = useRef(null);

  const stateRef = useRef({ page, hasMore, loadingMore, loading, tab, category, gps, search });
  useEffect(() => {
    stateRef.current = { page, hasMore, loadingMore, loading, tab, category, gps, search };
  }, [page, hasMore, loadingMore, loading, tab, category, gps, search]);

  useSEO({
    title: "Chợ Hải Sản Online — Tươi từ Ngư Dân",
    description: "Mua bán hải sản tươi & khô trực tiếp từ ngư dân đánh bắt.",
  });

  const resetAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % HERO_BGS.length);
    }, 4500);
  }, []);

  useEffect(() => {
    resetAutoplay();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetAutoplay]);

  const handlePrev = (e) => { e.stopPropagation(); setBgIndex((p) => (p - 1 + HERO_BGS.length) % HERO_BGS.length); resetAutoplay(); };
  const handleNext = (e) => { e.stopPropagation(); setBgIndex((p) => (p + 1) % HERO_BGS.length); resetAutoplay(); };

  const filteredProducts = useMemo(() =>
    products.filter((p) => {
      if (filter === "recent") {
        if (!p.catchTime) return false;
        if (Date.now() - new Date(p.catchTime).getTime() >= 6 * 3600000) return false;
      }
      if (filter === "topRated" && !(p.sellerRating && parseFloat(p.sellerRating) >= 4.0)) return false;
      if (filter === "wholesale" && p.salesType !== "Wholesale") return false;
      if (priceMin !== "" && parseFloat(p.price) < parseFloat(priceMin)) return false;
      if (priceMax !== "" && parseFloat(p.price) > parseFloat(priceMax)) return false;
      if (minWeight !== "" && parseFloat(p.remainingWeight) < parseFloat(minWeight)) return false;
      return true;
    }),
    [products, filter, priceMin, priceMax, minWeight],
  );

  const hasAdvancedFilter = priceMin !== "" || priceMax !== "" || minWeight !== "";

  const sortedProducts = useMemo(() =>
    [...filteredProducts].sort((a, b) => {
      if (sort === "price_asc")  return parseFloat(a.price) - parseFloat(b.price);
      if (sort === "price_desc") return parseFloat(b.price) - parseFloat(a.price);
      if (sort === "rating")     return parseFloat(b.sellerRating || 0) - parseFloat(a.sellerRating || 0);
      if (sort === "views")      return (b.viewCount || 0) - (a.viewCount || 0);
      const bTime = b.bumpedAt ? new Date(b.bumpedAt) : new Date(b.createdAt);
      const aTime = a.bumpedAt ? new Date(a.bumpedAt) : new Date(a.createdAt);
      return bTime - aTime;
    }),
    [filteredProducts, sort],
  );

  const handleGps = useCallback(() => {
    setGps((g) => ({ ...g, status: "loading" }));
    if (!navigator.geolocation) { setGps({ status: "denied", lat: null, lng: null }); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        localStorage.setItem("seafood_lat", pos.coords.latitude);
        localStorage.setItem("seafood_lng", pos.coords.longitude);
        setGps({ status: "ok", lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setGps({ status: "denied", lat: null, lng: null }),
    );
  }, []);
>>>>>>> Stashed changes

  useEffect(() => {
    const savedLat = localStorage.getItem("seafood_lat");
    const savedLng = localStorage.getItem("seafood_lng");
    if (savedLat && savedLng) {
<<<<<<< Updated upstream
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
=======
      setGps({ status: "ok", lat: parseFloat(savedLat), lng: parseFloat(savedLng) });
    } else { handleGps(); }
  }, [handleGps]);

  useEffect(() => {
    if (!user) return;
    api("/favorites/ids").then((ids) => setFavoriteIds(ids)).catch(() => {});
  }, [user]);

  const buildParams = useCallback((pageNum, currentSearch) => {
    const params = new URLSearchParams({
      type: tab === "fresh" ? "Fresh" : "Dried",
      page: String(pageNum),
      limit: String(PAGE_SIZE),
    });
    if (currentSearch) params.set("search", currentSearch);
    if (category && category !== "All") params.set("category", category);
    if (tab === "fresh" && gps.lat) { params.set("lat", String(gps.lat)); params.set("lng", String(gps.lng)); }
    return params;
  }, [tab, category, gps.lat, gps.lng]);

  const fetchPage1 = useCallback(async (currentSearch) => {
    setLoading(true); setError(""); setPage(1); setHasMore(true);
    try {
      const data = await api(`/products?${buildParams(1, currentSearch)}`);
      const items = data.data || [];
      setProducts(items);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [buildParams]);

  useEffect(() => {
    const t = setTimeout(() => fetchPage1(search), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchPage1, search]);

  const fetchNextPage = useCallback(async () => {
    const { loadingMore: lm, hasMore: hm, loading: ld, tab: t, category: cat, gps: g, search: s, page: p } = stateRef.current;
    if (lm || !hm || ld) return;
    setLoadingMore(true);
    const nextPage = p + 1;
    const params = new URLSearchParams({ type: t === "fresh" ? "Fresh" : "Dried", page: String(nextPage), limit: String(PAGE_SIZE) });
    if (s) params.set("search", s);
    if (cat && cat !== "All") params.set("category", cat);
    if (t === "fresh" && g.lat) { params.set("lat", String(g.lat)); params.set("lng", String(g.lng)); }
    try {
      const data = await api(`/products?${params}`);
      const items = data.data || [];
      setProducts((prev) => [...prev, ...items]);
      setPage(nextPage);
      setHasMore(items.length === PAGE_SIZE);
    } catch { /* silent */ }
    finally { setLoadingMore(false); }
  }, []);

  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) fetchNextPage(); },
      { rootMargin: "200px" },
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [fetchNextPage]);

  useEffect(() => {
    if (loading) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) { window.scrollTo({ top: parseInt(saved, 10), behavior: "instant" }); sessionStorage.removeItem(SCROLL_KEY); }
  }, [loading]);

  const handleProductClick = useCallback((productId) => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    vtNavigate(`/san-pham/${productId}`);
  }, [vtNavigate]);

  const handleFavoriteChange = useCallback((id, fav) => {
    setFavoriteIds((prev) => fav ? [...prev, id] : prev.filter((x) => x !== id));
  }, []);

  const gpsLabel = { ok: "Đã nhận GPS", loading: "Đang tìm vị trí…", denied: "Bật GPS xem gần bạn", idle: "Bật GPS xem gần bạn" }[gps.status] ?? "Bật GPS";

  return (
    <div className={styles.page}>

      {/* ── HERO ── */}
      <section className={styles.hero} aria-label="Banner">
        <div className={styles.heroTrackWrapper}>
          <div
            className={styles.heroTrack}
>>>>>>> Stashed changes
            style={{
              fontSize: 32,
              fontWeight: 800,
              margin: "0 0 12px",
              textShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
<<<<<<< Updated upstream
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
=======
            {HERO_BGS.map((bg) => (
              <div key={bg} className={styles.heroSlide} style={{ width: `${100 / HERO_BGS.length}%`, backgroundImage: `url(${bg})` }} />
            ))}
          </div>
        </div>

        <div className={styles.heroOverlay} />

        <button className={`${styles.heroArrow} ${styles.prev}`} onClick={handlePrev} aria-label="Ảnh trước">
          <ChevronLeftIcon size={22} />
        </button>
        <button className={`${styles.heroArrow} ${styles.next}`} onClick={handleNext} aria-label="Ảnh tiếp theo">
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
              onClick={(e) => { e.stopPropagation(); setBgIndex(i); resetAutoplay(); }}
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
              Tươi Từ Ngư Dân,<br />
              <span className={styles.heroAccent}>Đến Bàn Của Bạn</span>
            </h1>
            <p className={styles.heroLead}>
              Mua bán hải sản tươi &amp; khô trực tiếp từ ngư dân. Giao tươi trong 20km · Khô giao toàn quốc.
            </p>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}><SearchIcon size={16} /></span>
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

      {/* ── CONTENT ── */}
      <div className={styles.content}>
        <div className={styles.layoutWrapper}>

          {/* Sidebar */}
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
                    onClick={() => { setTab(k); setProducts([]); }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className={styles.mainLayoutBody}>

            {/* Category chips — dùng CSS module, không inline style */}
            <div className={styles.categoryRow}>
              {CATEGORY_CHIPS.map((cat) => (
                <button
                  key={cat.id}
                  className={`${styles.categoryChip} ${category === cat.id ? styles.categoryChipActive : ""}`}
                  onClick={() => { setCategory(cat.id); setProducts([]); }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className={styles.filterRow}>
              <div className={styles.chipGroup}>
                {[
                  { id: "all",       label: "Tất cả",             icon: null },
                  { id: "recent",    label: "Mới đánh bắt < 6h",  icon: <ClockIcon size={12} /> },
                  { id: "topRated",  label: "Người bán uy tín",    icon: <StarIcon size={12} /> },
                  { id: "wholesale", label: "Bán buôn",            icon: <PackageIcon size={12} /> },
                ].map((f) => (
                  <button
                    key={f.id}
                    className={`${styles.chip} ${filter === f.id ? styles.activeChip : ""}`}
                    onClick={() => setFilter(f.id)}
                    aria-pressed={filter === f.id}
                  >
                    {f.icon}{f.label}
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
              {hasAdvancedFilter && <span className={styles.filterDot} aria-hidden="true" />}
            </button>

            {showAdvanced && (
              <div className={styles.advancedPanel}>
                <div className={styles.filterGroup}>
                  <label>Khoảng giá (VNĐ/kg)</label>
                  <div className={styles.filterInputRow}>
                    <input type="number" placeholder="Từ"  value={priceMin} onChange={(e) => setPriceMin(e.target.value)}  className={styles.filterInput} />
                    <span className={styles.filterSep}>—</span>
                    <input type="number" placeholder="Đến" value={priceMax} onChange={(e) => setPriceMax(e.target.value)}  className={styles.filterInput} />
                  </div>
                </div>
                <div className={styles.filterGroup}>
                  <label>Sẵn có tối thiểu (kg)</label>
                  <input type="number" placeholder="VD: 5" value={minWeight} onChange={(e) => setMinWeight(e.target.value)} className={styles.filterInput} style={{ width: 130 }} />
                </div>
                {hasAdvancedFilter && (
                  <button className={styles.clearBtn} onClick={() => { setPriceMin(""); setPriceMax(""); setMinWeight(""); }}>
                    <XIcon size={12} />Xoá bộ lọc
                  </button>
                )}
              </div>
            )}

            <div className={styles.sortRow}>
              <div className={styles.sortLeft}>
                <span className={styles.sortLabel}>Sắp xếp:</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className={styles.sortSelect}>
                  <option value="newest">Mới nhất / Đã đẩy</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                  <option value="rating">Đánh giá người bán</option>
                  <option value="views">Nhiều lượt xem</option>
                </select>
              </div>
              {tab === "fresh" && (
                <div className={styles.viewToggle} role="group" aria-label="Chế độ xem">
                  {[
                    { k: "grid", icon: <GridIcon size={13} />, l: "Lưới" },
                    { k: "map",  icon: <MapIcon  size={13} />, l: "Bản đồ" },
                  ].map(({ k, icon, l }) => (
                    <button key={k} className={`${styles.viewBtn} ${viewMode === k ? styles.active : ""}`} onClick={() => setViewMode(k)} aria-pressed={viewMode === k}>
                      {icon}{l}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {tab === "fresh" && (
              <div className={styles.infoBanner} role="note">
                <InfoIcon size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Chỉ hiển thị hải sản tươi trong phạm vi <strong>20km</strong> từ vị trí của bạn. Bài đăng tự ẩn sau <strong>24 giờ</strong> để đảm bảo độ tươi.</span>
              </div>
            )}

            {error && (
              <div className={styles.errorBanner} role="alert">
                <AlertCircleIcon size={14} style={{ flexShrink: 0 }} />{error}
              </div>
            )}

            {loading ? (
              <div className={styles.grid}>
                {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon} aria-hidden="true">🔍</div>
                <div className={styles.emptyTitle}>Không tìm thấy kết quả phù hợp</div>
                <div className={styles.emptyBody}>Hãy thử thay đổi từ khoá hoặc bộ lọc của bạn</div>
              </div>
            ) : viewMode === "map" && tab === "fresh" ? (
              <MapExplore
                products={sortedProducts}
                userLocation={gps.status === "ok" ? { lat: gps.lat, lng: gps.lng } : null}
                onProductClick={(prod) => { sessionStorage.setItem(SCROLL_KEY, String(window.scrollY)); vtNavigate(`/san-pham/${prod.id}`); }}
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
                    {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
                  </div>
                )}
                {!hasMore && products.length > PAGE_SIZE && (
                  <div className={styles.endLabel}>
                    <CheckCircleIcon size={14} />
                    Đã hiển thị toàn bộ {sortedProducts.length} sản phẩm
                  </div>
                )}
              </>
>>>>>>> Stashed changes
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