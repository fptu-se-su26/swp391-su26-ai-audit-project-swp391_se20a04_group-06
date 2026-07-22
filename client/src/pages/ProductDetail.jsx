import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Clock3,
  Crown,
  MapPin,
  MessageSquare,
  PackageOpen,
  Ruler,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SellerLocationMap from "../components/SellerLocationMap";
import ReportButton from "../components/ReportButton";
import ReviewSection from "../components/ReviewSection";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import useSEO from "../hooks/useSEO";

import { apiFavorites, apiFishermen, apiProducts, apiReports } from "../services/api";
import {
  calculateDistanceKm,
  formatCurrency,
  formatDate,
  formatDistance,
  getFreshness,
  getMarketplaceStatus,
  getProductId,
  getProductImage,
} from "../utils/product";
import { getCategoryLabel, getProductSizeLabel } from "../utils/labelMaps";

export default function ProductDetail() {
  const { alert } = useConfirm();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);

  useSEO(
    product ? `${product.name} - ${formatCurrency(product.price)}/kg` : "Chi tiết sản phẩm",
    product ? product.description : "Chi tiết mẻ hải sản ngon từ người bán."
  );

  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerLocation, setViewerLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("viewerLocation");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    let active = true;
    async function loadProduct() {
      try {
        const nextProduct = await apiProducts.getById(id);
        if (!active) return;
        setProduct(nextProduct);
        if (nextProduct?.sellerId) {
          try {
            const nextSeller = await apiFishermen.getProfile(nextProduct.sellerId);
            if (active) setSeller(nextSeller);
          } catch (error) {
            console.error("Failed to load seller profile:", error);
          }
        }
      } catch (error) {
        console.error("Failed to load product detail:", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProduct();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      return;
    }
    apiFavorites
      .getIds()
      .then((ids) => setFavorites(new Set((ids || []).map(String))))
      .catch(() => setFavorites(new Set()));
  }, [user]);

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
          console.warn("Geolocation warning in ProductDetail:", error);
        }
      );
    }

    return () => window.removeEventListener("locationUpdated", handleLocationUpdate);
  }, []);

  const requireLogin = () => {
    if (user) return true;
    navigate("/login", {
      state: { message: "Bạn cần đăng nhập để lưu sản phẩm hoặc nhắn cho người bán." },
    });
    return false;
  };

  const openChat = (reserve = false) => {
    if (!requireLogin()) return;
    navigate("/chat", {
      state: {
        startChatWith: product.sellerId,
        sellerName: product.sellerName,
        productId: getProductId(product),
        productName: product.name,
        productPrice: product.price,
        initialMessage: reserve
          ? `Tôi muốn giữ chỗ mẻ ${product.name}. Người bán xác nhận giúp tôi nhé.`
          : "",
      },
    });
  };

  const toggleFavorite = async () => {
    if (!requireLogin()) return;
    const productId = getProductId(product);
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


  const calculateDistance = () => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      const loc = { latitude: coords.latitude, longitude: coords.longitude };
      setViewerLocation(loc);
      localStorage.setItem("viewerLocation", JSON.stringify(loc));
    });
  };

  if (loading) return <div className="page-state">Đang tải chi tiết mẻ hàng...</div>;
  if (!product) {
    return (
      <div className="page-state">
        <p>Mẻ hàng không tồn tại hoặc đã được gỡ.</p>
        <Link to="/marketplace">Quay lại chợ hải sản</Link>
      </div>
    );
  }

  const isFavorite = favorites.has(getProductId(product));
  const sellerVerified = Boolean(product.sellerIsVerified || seller?.isVerified);
  const sellerPremium = Boolean(product.sellerIsPremium || seller?.isPremium);
  const distanceKm = calculateDistanceKm(viewerLocation, product);
  const marketplaceStatus = getMarketplaceStatus(product);
  const canReserve = marketplaceStatus.key === "available";

  return (
    <div className="product-detail-page page-container">
      <Link className="back-link" to="/marketplace">
        <ArrowLeft size={17} /> Quay lại chợ hải sản
      </Link>

      <article className="product-detail-card">
        <div className="product-detail-card__media">
          <img
            aria-hidden="true"
            alt=""
            className="product-detail-card__media-backdrop"
            src={getProductImage(product)}
            style={{
              position: "absolute",
              inset: "-5%",
              width: "110%",
              height: "110%",
              objectFit: "cover",
              opacity: 0.35,
              filter: "blur(15px) saturate(0.8) brightness(0.6)",
            }}
          />
          <img
            src={getProductImage(product)}
            alt={product.name}
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: "16px",
            }}
          />
          <div className="product-detail-card__badges" style={{ zIndex: 2 }}>
            <span>{product.type === "Fresh" ? "Hải sản tươi" : "Hải sản khô"}</span>
            {product.productSize && product.productSize !== "Chưa cập nhật" && (
              <span className="seafood-size-badge" style={{ fontSize: "12px", padding: "5px 10px", textTransform: "none" }}>
                Size: {getProductSizeLabel(product.productSize)}
              </span>
            )}
            <span className={`status-chip status-chip--${marketplaceStatus.key}`}>
              {marketplaceStatus.label}
            </span>
          </div>
        </div>

        <div className="product-detail-card__content">
          <span className="seafood-type-badge" style={{ marginBottom: "12px", textTransform: "none" }}>
            {getCategoryLabel(product.category) || "Hải sản"}
          </span>
          <h1>{product.name}</h1>
          <p className="product-detail-card__price">
            {formatCurrency(product.price)} <small>/ kg</small>
          </p>
          <p className="product-detail-card__description">
            {product.description || "Người bán chưa cập nhật mô tả chi tiết."}
          </p>

          <dl className="product-detail-facts">
            <div><Clock3 /><dt>Độ tươi</dt><dd>{getFreshness(product)}</dd></div>
            <div><CalendarDays /><dt>Ngày đánh bắt</dt><dd>{formatDate(product.catchTime)}</dd></div>
            <div><MapPin /><dt>Nguồn gốc</dt><dd>{product.origin || "Chưa cập nhật"}</dd></div>
            <div><Scale /><dt>Còn lại</dt><dd>{Number(product.remainingWeight || 0)} kg</dd></div>
            <div><Ruler /><dt>Kích thước</dt><dd>{getProductSizeLabel(product.productSize)}</dd></div>
          </dl>

          {product.batchId && product.batchTitle && (
            <Link className="product-detail-batch-link" to={`/landing-batches/${product.batchId}`}>
              <PackageOpen size={17} />
              <span>Thuộc vựa cá <strong>{product.batchTitle}</strong></span>
              <small>Xem cả vựa</small>
            </Link>
          )}

          <section className="seller-summary">
            <span className="seller-summary__avatar">
              {(product.sellerName || "ND").slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{product.sellerName || "Ngư dân"}</strong>
              <p>
                {sellerVerified && <span><ShieldCheck size={14} /> Đã xác minh</span>}
                {sellerPremium && <span><Crown size={14} /> Premium</span>}
              </p>
            </div>
            <Link to={`/fisherman/${product.sellerId}`}>Xem hồ sơ</Link>
          </section>

          <div className="product-detail-actions">
            <button className="button button--primary" onClick={() => openChat(false)} type="button">
              <MessageSquare size={17} /> Nhắn người bán
            </button>
            <button
              aria-label={isFavorite ? "Bỏ lưu" : "Lưu sản phẩm"}
              className={`button button--icon ${isFavorite ? "is-saved" : ""}`}
              onClick={toggleFavorite}
              type="button"
            >
              <Bookmark size={18} />
            </button>
            <ReportButton
              onSubmit={(reason) =>
                apiReports.createForProduct(getProductId(product), reason)
              }
            />
          </div>
        </div>
      </article>

      <section className="location-panel">
        <div className="location-panel__heading">
          <div>
            <span className="eyebrow">SELLER LOCATION</span>
            <h2>Vị trí người bán</h2>
          </div>
          <button className="button button--secondary" onClick={calculateDistance} type="button">
            <MapPin size={16} />
            {viewerLocation ? formatDistance(distanceKm, (product.lat != null && product.lng != null) || (product.location?.coordinates?.[0] != null && product.location?.coordinates?.[1] != null)) : "Tính khoảng cách"}
          </button>
        </div>
        <SellerLocationMap lat={product.lat} lng={product.lng} sellerName={product.sellerName} />
      </section>

      <ReviewSection
        allowReview
        productId={getProductId(product)}
        sellerId={product.sellerId}
      />
    </div>
  );
}
