import { useEffect, useMemo, useState } from "react";
import { MapPin, MessageSquare, ShieldCheck, Ship, Anchor, ArrowRight, Search, LocateFixed, RefreshCw, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import heroSeafoodMarket from "../assets/hero-seafood-market.png";
import ProductGrid from "../components/ProductGrid";
import LandingBatchCard from "../components/LandingBatchCard";
import { useAuth } from "../context/AuthContext";
import { apiFavorites, apiFishermen, apiProducts, apiLandingBatches } from "../services/api";
import { useConfirm } from "../context/ConfirmContext";
import useSEO from "../hooks/useSEO";

import { getOptimizedImageUrl } from "../utils/image";
import { formatCurrency, getProductId, getProductImage } from "../utils/product";

const categories = [
  { id: "All", label: "Tất cả" },
  { id: "fish", label: "Cá tươi" },
  { id: "shrimp", label: "Tôm các loại" },
  { id: "crab", label: "Cua - Ghẹ" },
  { id: "squid", label: "Mực - Bạch tuộc" },
  { id: "shellfish", label: "Ngaêu - Sò - Ốc" },
  { id: "other", label: "Hải sản khác" },
];

function initials(name) {
  if (!name) return "ND";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Home() {
  useSEO("Trang chủ & Chợ hải sản", "Hệ thống kết nối trực tiếp Người mua & Ngư dân bán hải sản tươi sống chất lượng.");
  const { alert } = useConfirm();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [landingBatches, setLandingBatches] = useState([]);
  const [fishermen, setFishermen] = useState([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [favorites, setFavorites] = useState(new Set());
  const [heroBackgroundReady, setHeroBackgroundReady] = useState(false);

  // Marketplace Filters integrated into Home
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("fresh");
  const [viewMode, setViewMode] = useState("products"); // "products" | "batches"
  const [locationMessage, setLocationMessage] = useState("");

  const [viewerLocation, setViewerLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("viewerLocation");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleLocationUpdate = () => {
      try {
        const saved = localStorage.getItem("viewerLocation");
        if (saved) {
          setViewerLocation(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Error reading updated location:", e);
      }
    };
    window.addEventListener("locationUpdated", handleLocationUpdate);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const loc = { latitude: coords.latitude, longitude: coords.longitude };
          setViewerLocation(loc);
          localStorage.setItem("viewerLocation", JSON.stringify(loc));
          window.dispatchEvent(new Event("locationUpdated"));
        },
        (error) => {
          console.warn("Auto geolocation failed in Home:", error);
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    }

    return () => window.removeEventListener("locationUpdated", handleLocationUpdate);
  }, []);

  useEffect(() => {
    let mounted = true;
    const image = new window.Image();

    image.onload = () => {
      if (mounted) setHeroBackgroundReady(true);
    };
    image.onerror = () => {
      if (mounted) setHeroBackgroundReady(false);
    };
    image.src = heroSeafoodMarket;

    return () => {
      mounted = false;
      image.onload = null;
      image.onerror = null;
    };
  }, []);

  useEffect(() => {
    Promise.allSettled([
      apiProducts.getAll(),
      apiLandingBatches.getMarketplace({ limit: 50 }),
      apiFishermen.getAll({ limit: 6 }),
    ]).then(([productResult, batchResult, fishermanResult]) => {
      if (productResult.status === "fulfilled") {
        const data = productResult.value;
        setProducts(Array.isArray(data) ? data : data?.data || data?.products || []);
      }
      if (batchResult.status === "fulfilled") {
        const data = batchResult.value;
        setLandingBatches(Array.isArray(data) ? data : data?.data || []);
      }
      if (fishermanResult.status === "fulfilled") {
        const data = fishermanResult.value;
        setFishermen(Array.isArray(data) ? data : data?.data || data?.fishermen || []);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      return;
    }
    apiFavorites.getIds()
      .then((ids) => setFavorites(new Set((ids || []).map(String))))
      .catch(() => setFavorites(new Set()));
  }, [user]);

  const activeProducts = useMemo(() => {
    return products.filter(
      (product) => (product.status || "Active").toLowerCase() === "active"
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...activeProducts];

    if (search.trim()) {
      const query = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.sellerName?.toLowerCase().includes(query) ||
          p.originLocationName?.toLowerCase().includes(query)
      );
    }

    if (category !== "All") {
      list = list.filter((p) => (p.category || "").toLowerCase() === category.toLowerCase());
    }

    if (sort === "price_asc") {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === "price_desc") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sort === "fresh") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [activeProducts, search, category, sort]);

  const bannerProducts = useMemo(() => activeProducts.slice(0, 6), [activeProducts]);
  const featuredProduct = bannerProducts[slideIndex % Math.max(bannerProducts.length, 1)];

  useEffect(() => {
    setSlideIndex((current) =>
      bannerProducts.length ? current % bannerProducts.length : 0,
    );
  }, [bannerProducts.length]);

  useEffect(() => {
    if (bannerProducts.length < 2) return undefined;

    const autoplayTimer = window.setTimeout(() => {
      setSlideIndex((current) => (current + 1) % bannerProducts.length);
    }, 4_800);

    return () => window.clearTimeout(autoplayTimer);
  }, [bannerProducts.length, slideIndex]);

  const changeSlide = (direction) => {
    if (bannerProducts.length < 2) return;
    setSlideIndex(
      (current) =>
        (current + direction + bannerProducts.length) % bannerProducts.length,
    );
  };

  const toggleFavorite = async (productId) => {
    try {
      const result = await apiFavorites.toggle(productId);
      setFavorites((current) => {
        const next = new Set(current);
        if (result.favorited) next.add(String(productId));
        else next.delete(String(productId));
        return next;
      });
    } catch (error) {
      await alert({
        title: "Lỗi yêu thích",
        message: error.message,
        variant: "danger"
      });
    }
  };

  const updateLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Trình duyệt của bạn không hỗ trợ định vị.");
      return;
    }

    setLocationMessage("Đang lấy vị trí hiện tại...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc = { latitude: coords.latitude, longitude: coords.longitude };
        setViewerLocation(loc);
        localStorage.setItem("viewerLocation", JSON.stringify(loc));
        window.dispatchEvent(new Event("locationUpdated"));
        setLocationMessage("Đã cập nhật vị trí của bạn.");
      },
      (error) => {
        setLocationMessage(`Không thể vị trí: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="home-page ocean-background page-container">
      {/* Hero Banner Section */}
      <section
        className={`market-hero hero-on-image ${heroBackgroundReady ? "has-background" : "is-fallback"}`}
        data-tour="home-hero"
        style={heroBackgroundReady ? { backgroundImage: `url(${heroSeafoodMarket})` } : undefined}
      >
        <div className="market-hero__overlay" />
        <div className="market-hero__content">
          <span className="eyebrow">SÀN HẢI SẢN TRỰC TIẾP</span>
          <h1>Hải sản tươi sống ngay tại tàu & vựa biển.</h1>
          <p>
            Xem ngay mẻ hàng mới nhất, kiểm tra độ tươi và nhắn tin mua hàng trực tiếp từ ngư dân Việt Nam.
          </p>
          <div className="market-hero__actions">
            <a href="#market-catalog" className="button button--primary">
              <ShoppingBag size={18} /> Khám phá sản phẩm ngay
            </a>
            <Link className="button button--secondary" to="/chat">
              <MessageSquare size={17} /> Tin nhắn người bán
            </Link>
          </div>
          {featuredProduct && (
            <button
              className="market-hero__featured cta-view-now"
              data-tour="home-featured-product"
              key={`featured-${getProductId(featuredProduct)}`}
              onClick={() => navigate(`/product/${getProductId(featuredProduct)}`)}
              type="button"
            >
              <img
                alt=""
                decoding="async"
                src={getOptimizedImageUrl(getProductImage(featuredProduct), 160, 160)}
              />
              <span>
                <small>MỚI CẬP BẾN</small>
                <strong>{featuredProduct.name}</strong>
                <em>{formatCurrency(featuredProduct.price)} / kg · {featuredProduct.sellerName}</em>
              </span>
            </button>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="home-section section-shell" style={{ marginTop: "2rem" }}>
        <header className="section-heading" style={{ marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>Sản Phẩm Nổi Bật</h2>
          </div>
        </header>

        {activeProducts.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon"><Ship size={32} /></div>
            <h3>Chưa có sản phẩm nào</h3>
            <p>Vui lòng quay lại sau khi ngư dân cập bến mẻ cá mới.</p>
          </div>
        ) : (
          <ProductGrid
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            products={activeProducts}
            viewerLocation={viewerLocation}
          />
        )}
      </section>

      <div className="section-divider" />

      {/* Featured Fishermen Section */}
      <section className="home-section section-shell" data-tour="home-featured-sellers">
        <header className="section-heading">
          <div><h2>Ngư dân uy tín tại các cảng biển</h2></div>
        </header>

        {fishermen.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon"><Anchor size={32} /></div>
            <h3>Chưa có hồ sơ ngư dân</h3>
            <p>Theo dõi ngư dân uy tín để nhận thông báo khi có mẻ mới.</p>
          </div>
        ) : (
          <div className="home-seller-grid">
            {fishermen.slice(0, 6).map((seller) => (
              <Link className="home-seller-card" key={seller.id || seller._id} to={`/fisherman/${seller.id || seller._id}`}>
                <span className="home-seller-avatar">
                  {seller.avatar || seller.avatarUrl ? (
                    <img src={seller.avatar || seller.avatarUrl} alt={seller.name || ""} />
                  ) : (
                    initials(seller.name)
                  )}
                </span>
                <div>
                  <h3>{seller.name} {seller.isVerified && <ShieldCheck size={15} />}</h3>
                  <p><MapPin size={13} /> {seller.locationName || "Việt Nam"}</p>
                  <small>{seller.followersCount || 0} người theo dõi · {Number(seller.ratingAvg || 0).toFixed(1)} ★</small>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


