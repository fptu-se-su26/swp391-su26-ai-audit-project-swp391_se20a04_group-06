/**
 * HomePage.jsx
 * PERF FIX:
 *  1. useMemo cho filteredProducts & sortedProducts — không tính lại khi carousel tick
 *  2. useCallback cho handleFavoriteChange — stable reference, React.memo có tác dụng
 *  3. Truyền product.id thay vì inline closure vào onClick để tránh tạo function mới
 *  4. CSS stagger: mỗi card nhận --card-i để animation xuất hiện lần lượt
 */
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { ProductCard, ProductSkeleton } from "../components/ProductCard";
import { MapExplore } from "../components/MapExplore";
import { useSEO } from "../hooks/useSEO";
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";
import {
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GridIcon,
  MapIcon,
  MapPinIcon,
  FilterIcon,
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

export function HomePage({ user }) {
  const navigate = useNavigate();
  const vtNavigate = useViewTransitionNavigate();
  const [search, setSearch] = useState("");
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
  const [bgIndex, setBgIndex] = useState(0);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const timerRef = useRef(null);
  const searchRef = useRef(search);
  searchRef.current = search;

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

  // ── PERF FIX 1: useMemo — không tính lại khi bgIndex hay state khác thay đổi ──

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
    [products, filter, priceMin, priceMax, minWeight],
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
    [filteredProducts, sort],
  );

  // ── GPS ────────────────────────────────────────────────

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
    } else {
      setGps({ status: "denied", lat: null, lng: null });
    }
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

  // ── Fetch ──────────────────────────────────────────────

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
      /* silent */
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, page, tab, gps.lat, gps.lng]);

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
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved && !loading) {
      window.scrollTo({ top: parseInt(saved), behavior: "instant" });
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

  // ── PERF FIX 2: stable callback — React.memo trên ProductCard sẽ có tác dụng ──
  const handleFavoriteChange = useCallback((id, fav) => {
    setFavoriteIds((prev) =>
      fav ? [...prev, id] : prev.filter((x) => x !== id),
    );
  }, []);

  // ── GPS button label ───────────────────────────────────

  const gpsLabel =
    {
      ok: "Đã nhận GPS",
      loading: "Đang tìm vị trí…",
      denied: "Bật GPS xem gần bạn",
      idle: "Bật GPS xem gần bạn",
    }[gps.status] ?? "Bật GPS";

  // ── Render ─────────────────────────────────────────────

  return (
    <div className={styles.page}>
      {/* ══ HERO ══ */}
      <section className={styles.hero} aria-label="Banner">
        {/* Sliding track */}
        <div className={styles.heroTrackWrapper}>
          <div
            className={styles.heroTrack}
            style={{
              width: `${HERO_BGS.length * 100}%`,
              transform: `translateX(-${bgIndex * (100 / HERO_BGS.length)}%)`,
            }}
          >
            {HERO_BGS.map((bg) => (
              <div
                key={bg}
                className={styles.heroSlide}
                style={{
                  width: `${100 / HERO_BGS.length}%`,
                  backgroundImage: `url(${bg})`,
                }}
              />
            ))}
          </div>
        </div>

        <div className={styles.heroOverlay} />

        {/* Arrows */}
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

        {/* Dots */}
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

        {/* Content */}
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
            <div className={styles.heroActions}>
              <button
                onClick={handleGps}
                className={`${styles.heroGpsBtn} ${gps.status === "ok" ? styles.gpsOk : ""}`}
                aria-busy={gps.status === "loading"}
              >
                <MapPinIcon size={15} />
                {gpsLabel}
              </button>
              {!user && (
                <button
                  className={styles.heroRegisterBtn}
                  onClick={() => vtNavigate("/dang-nhap")}
                >
                  <PlusIcon size={14} />
                  Đăng bán ngay
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══ MAIN CONTENT ══ */}
      <div className={styles.content}>
        {/* ── Search ── */}
        <div className={styles.searchWrap}>
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

        {/* ── Tab + Filter row ── */}
        <div className={styles.filterRow}>
          <div
            className={styles.tabGroup}
            role="tablist"
            style={{ "--tab-offset": tab === "fresh" ? "0" : "1" }}
          >
            <div className={styles.tabIndicator} aria-hidden="true" />
            {[
              { k: "fresh", l: "🌊 Hải sản tươi" },
              { k: "dried", l: "🔥 Hải sản khô" },
            ].map(({ k, l }) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                className={`${styles.tab} ${k === "fresh" ? styles.tabFresh : styles.tabDried} ${tab === k ? styles.active : ""}`}
                onClick={() => {
                  setTab(k);
                  setProducts([]);
                }}
              >
                {l}
              </button>
            ))}
          </div>

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

        {/* ── Advanced filters ── */}
        <button
          className={`${styles.advancedToggle} ${hasAdvancedFilter ? styles.hasFilter : ""}`}
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <SlidersIcon size={13} />
          Bộ lọc nâng cao
          {hasAdvancedFilter && (
            <span className={styles.filterDot} aria-hidden="true" />
          )}
          {showAdvanced ? (
            <ChevronLeftIcon
              size={10}
              strokeWidth={2.5}
              style={{ transform: "rotate(90deg)" }}
            />
          ) : (
            <ChevronRightIcon
              size={10}
              strokeWidth={2.5}
              style={{ transform: "rotate(90deg)" }}
            />
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

        {/* ── Sort + View toggle ── */}
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

        {/* ── Info / error banners ── */}
        {tab === "fresh" && (
          <div className={styles.infoBanner} role="note">
            <InfoIcon size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Chỉ hiển thị hải sản tươi trong phạm vi <strong>20km</strong> từ
              vị trí của bạn. Bài đăng tự ẩn sau <strong>24 giờ</strong> để đảm
              bảo độ tươi.
            </span>
          </div>
        )}

        {error && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircleIcon size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* ── Products ── */}
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
            {/* PERF FIX 3: Stagger index qua CSS custom property — không tạo inline style object mới */}
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
  );
}
