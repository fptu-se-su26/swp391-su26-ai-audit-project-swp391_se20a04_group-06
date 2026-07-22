import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, MessageSquare, ShieldCheck, Ship, Anchor } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import heroSeafoodMarket from "../assets/hero-seafood-market.png";
import ProductGrid from "../components/ProductGrid";
import { useAuth } from "../context/AuthContext";
import { apiFavorites, apiFishermen, apiProducts } from "../services/api";
import { useConfirm } from "../context/ConfirmContext";
import useSEO from "../hooks/useSEO";

import { getOptimizedImageUrl } from "../utils/image";
import { formatCurrency, getProductId, getProductImage } from "../utils/product";

export default function Home() {
  useSEO("Trang chủ", "Hệ thống kết nối trực tiếp Người mua & Ngư dân bán hải sản tươi sống chất lượng.");
  const { alert } = useConfirm();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);

  const [fishermen, setFishermen] = useState([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [favorites, setFavorites] = useState(new Set());
  const [heroBackgroundReady, setHeroBackgroundReady] = useState(false);
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
      apiProducts.getAll({ limit: 24 }),
      apiFishermen.getAll({ limit: 6 }),
    ]).then(([productResult, fishermanResult]) => {
      if (productResult.status === "fulfilled") {
        const data = productResult.value;
        setProducts(Array.isArray(data) ? data : data?.data || data?.products || []);
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
    const filtered = products.filter(
      (product) => (product.status || "Active").toLowerCase() === "active"
    );

    const mapped = filtered.map((p) => ({
      product: p,
      isFeatured: Boolean(p.featured || p.isFeatured || p.isNew || p.latest),
      time: new Date(p.bumpedAt || p.createdAt || 0).getTime(),
      views: Number(p.viewCount || 0)
    }));

    mapped.sort((left, right) => {
      const featuredDiff = Number(right.isFeatured) - Number(left.isFeatured);
      if (featuredDiff !== 0) return featuredDiff;

      const timeDiff = right.time - left.time;
      if (timeDiff !== 0) return timeDiff;

      return right.views - left.views;
    });

    return mapped.map((item) => item.product);
  }, [products]);
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

  return (
    <div className="home-page ocean-background page-container">
      <section
        className={`market-hero hero-on-image ${heroBackgroundReady ? "has-background" : "is-fallback"}`}
        data-tour="home-hero"
        style={heroBackgroundReady ? { backgroundImage: `url(${heroSeafoodMarket})` } : undefined}
      >
        <div className="market-hero__overlay" />
        {bannerProducts.length > 1 && (
          <>
            <button aria-label="Mẻ hàng trước" className="market-hero__arrow is-left" onClick={() => changeSlide(-1)} type="button">
              <ChevronLeft />
            </button>
            <button aria-label="Mẻ hàng tiếp theo" className="market-hero__arrow is-right" onClick={() => changeSlide(1)} type="button">
              <ChevronRight />
            </button>
          </>
        )}
        <div className="market-hero__content">
          <span className="eyebrow">CHỢ HẢI SẢN TRỰC TIẾP</span>
          <h1>Hải sản theo mẻ theo vị trí từ người bán thật.</h1>
          <p>
            Khám phá nguồn hàng, kiểm tra độ tươi và trò chuyện trực tiếp với ngư dân.
            Mọi trao đổi mua bán diễn ra trực tiếp giữa hai bên qua tin nhắn.
          </p>
          <div className="market-hero__actions">
            <Link className="button button--primary" data-tour="home-explore-button" to="/marketplace">Khám phá chợ hải sản</Link>
            <Link className="button button--secondary" to="/chat"><MessageSquare size={17} /> Tin nhắn</Link>
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
        {bannerProducts.length > 1 && (
          <div className="market-hero__dots" aria-label="Chọn mẻ hàng nổi bật">
            {bannerProducts.map((product, index) => (
              <button
                aria-current={
                  slideIndex % bannerProducts.length === index ? "true" : undefined
                }
                aria-label={`Xem mẻ hàng ${index + 1}: ${product.name}`}
                className={
                  slideIndex % bannerProducts.length === index ? "is-active" : ""
                }
                key={getProductId(product)}
                onClick={() => setSlideIndex(index)}
                type="button"
              />
            ))}
          </div>
        )}
      </section>

      <section className="home-section section-shell" data-tour="home-new-products">
        <header className="section-heading">
          <div><h2>Mẻ hàng mới</h2></div>
          <Link to="/marketplace">Xem tất cả</Link>
        </header>

        {activeProducts.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon"><Ship size={32} /></div>
            <h3>Chưa có mẻ hàng phù hợp</h3>
            <p>Thử thay đổi bộ lọc hoặc xem toàn bộ chợ hải sản.</p>
            <Link className="button button--primary" to="/marketplace">Xem tất cả</Link>
          </div>
        ) : (
          <ProductGrid
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            products={activeProducts.slice(0, 4)}
            viewerLocation={viewerLocation}
          />
        )}
      </section>

      <div className="section-divider" />

      <section className="home-section section-shell" data-tour="home-featured-sellers">
        <header className="section-heading">
          <div><h2>Ngư dân nổi bật</h2></div>
        </header>

        {fishermen.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon"><Anchor size={32} /></div>
            <h3>Chưa có hồ sơ ngư dân</h3>
            <p>Theo dõi ngư dân uy tín để nhận thông báo khi có mẻ mới.</p>
            <Link className="button button--primary" to="/marketplace">Khám phá chợ hải sản</Link>
          </div>
        ) : (
          <div className="home-seller-grid">
            {fishermen.slice(0, 6).map((seller) => (
              <Link className="home-seller-card" key={seller.id || seller._id} to={`/fisherman/${seller.id || seller._id}`}>
                <span>{(seller.name || "ND").slice(0, 2).toUpperCase()}</span>
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

