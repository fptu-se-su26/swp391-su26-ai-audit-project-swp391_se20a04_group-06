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
  ZoomIn,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SellerLocationMap from "../components/SellerLocationMap";
import ReportButton from "../components/ReportButton";
import ReviewSection from "../components/ReviewSection";
import AdBanner from "../components/AdBanner";
import ImageLightboxModal from "../components/ImageLightboxModal";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import useSEO from "../hooks/useSEO";

import { apiFavorites, apiFishermen, apiProducts, apiReports } from "../services/api";

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
import {
  calculateDistanceKm,
  formatCurrency,
  formatDate,
  formatDistance,
  getFreshness,
  getMarketplaceStatus,
  getProductId,
  getProductImage,
  normalizeImageUrl,
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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  const rawImages = Array.isArray(product?.images) && product.images.length > 0
    ? product.images.map((img) => normalizeImageUrl(img)).filter(Boolean)
    : [getProductImage(product)];
  const productImages = rawImages.length > 0 ? rawImages : ["/favicon.png"];
  const currentImage = productImages[activeImageIndex] || productImages[0];

  return (
    <div className="product-detail-page page-container">
      <Link className="back-link" to="/marketplace">
        <ArrowLeft size={17} /> Quay lại chợ hải sản
      </Link>

      <article className="product-detail-card">
        <div className="product-detail-card__media" style={{ display: "flex", flexDirection: "column" }}>
          <div 
            onClick={() => setLightboxOpen(true)}
            style={{ 
              position: "relative", 
              flex: 1, 
              width: "100%", 
              display: "flex", 
              alignItems: "center", 
              justify: "center", 
              cursor: "zoom-in", 
              overflow: "hidden",
              minHeight: "360px",
              background: "#f8fafc"
            }}
            title="Bấm vào ảnh để xem ảnh gốc khổ lớn"
          >
            <img
              src={currentImage}
              alt={product.name}
              style={{
                position: "relative",
                zIndex: 1,
                maxWidth: "100%",
                maxHeight: "380px",
                objectFit: "contain",
                padding: "20px",
                filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.08))",
                transition: "transform 0.2s ease"
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

          {/* Multiple Images Selector Thumbnails */}
          {productImages.length > 1 && (
            <div style={{ display: "flex", gap: "8px", padding: "10px 14px", background: "#f1f5f9", borderTop: "1px solid #e2e8f0", overflowX: "auto" }}>
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(idx);
                  }}
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "8px",
                    border: activeImageIndex === idx ? "2px solid #0284c7" : "1px solid #cbd5e1",
                    overflow: "hidden",
                    padding: "2px",
                    background: "#ffffff",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                >
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-card__content" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          
          {/* Header Badges: Category & Status */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <span style={{ padding: "3px 9px", borderRadius: "10px", background: "#e0f2fe", color: "#0284c7", fontSize: "0.74rem", fontWeight: "700" }}>
              {getCategoryLabel(product.category) || "Hải sản"}
            </span>
            <span className={`status-chip status-chip--${marketplaceStatus.key}`} style={{ fontSize: "0.74rem", fontWeight: "700", padding: "2px 8px" }}>
              {marketplaceStatus.label}
            </span>
          </div>

          {/* Product Title */}
          <h1 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#0f172a", margin: 0, lineHeight: "1.2" }}>
            {product.name}
          </h1>

          {/* Highlight Price & Stock Card Banner */}
          <div style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", borderRadius: "10px", padding: "8px 12px", border: "1px solid #bae6fd", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <small style={{ fontSize: "0.65rem", color: "#0369a1", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>Giá sản phẩm</small>
              <div style={{ fontSize: "1.35rem", fontWeight: "900", color: "#0284c7", lineHeight: "1.1", marginTop: "1px" }}>
                {formatCurrency(product.price)} <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "#475569" }}>/ kg</span>
              </div>
            </div>

            <div style={{ textAlign: "right", background: "#ffffff", padding: "3px 8px", borderRadius: "6px", border: "1px solid #e0f2fe" }}>
              <span style={{ fontSize: "0.64rem", color: "#64748b", fontWeight: "600", display: "block" }}>Còn lại</span>
              <strong style={{ fontSize: "0.82rem", color: "#0f172a", fontWeight: "800" }}>{Number(product.remainingWeight || 0)} kg</strong>
            </div>
          </div>

          {/* Description */}
          <p style={{ fontSize: "0.85rem", color: "#334155", lineHeight: "1.45", margin: 0 }}>
            {product.description || "Người bán chưa cập nhật mô tả chi tiết cho sản phẩm này."}
          </p>

          {/* Specifications Grid (Balanced 4 items: 2x2 grid) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "1px" }}>
            <div style={{ padding: "6px 8px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock3 size={15} color="#0284c7" style={{ flexShrink: 0 }} />
              <div>
                <small style={{ fontSize: "0.62rem", color: "#64748b", fontWeight: "600", display: "block" }}>Độ tươi</small>
                <strong style={{ fontSize: "0.76rem", color: "#0f172a", fontWeight: "700" }}>{getFreshness(product)}</strong>
              </div>
            </div>

            <div style={{ padding: "6px 8px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "6px" }}>
              <CalendarDays size={15} color="#0284c7" style={{ flexShrink: 0 }} />
              <div>
                <small style={{ fontSize: "0.62rem", color: "#64748b", fontWeight: "600", display: "block" }}>Ngày đánh bắt</small>
                <strong style={{ fontSize: "0.76rem", color: "#0f172a", fontWeight: "700" }}>{formatDate(product.catchTime)}</strong>
              </div>
            </div>

            <div style={{ padding: "6px 8px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={15} color="#0284c7" style={{ flexShrink: 0 }} />
              <div>
                <small style={{ fontSize: "0.62rem", color: "#64748b", fontWeight: "600", display: "block" }}>Nguồn gốc</small>
                <strong style={{ fontSize: "0.76rem", color: "#0f172a", fontWeight: "700" }}>{product.origin || "Chưa cập nhật"}</strong>
              </div>
            </div>

            <div style={{ padding: "6px 8px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "6px" }}>
              <Ruler size={15} color="#0284c7" style={{ flexShrink: 0 }} />
              <div>
                <small style={{ fontSize: "0.62rem", color: "#64748b", fontWeight: "600", display: "block" }}>Kích thước</small>
                <strong style={{ fontSize: "0.76rem", color: "#0f172a", fontWeight: "700" }}>{getProductSizeLabel(product.productSize)}</strong>
              </div>
            </div>
          </div>

          {/* Batch Info Link (if present) */}
          {product.batchId && product.batchTitle && (
            <Link className="product-detail-batch-link" to={`/landing-batches/${product.batchId}`} style={{ margin: 0, padding: "6px 10px", borderRadius: "6px", fontSize: "0.78rem" }}>
              <PackageOpen size={15} />
              <span>Thuộc vựa cá <strong>{product.batchTitle}</strong></span>
              <small>Xem cả vựa</small>
            </Link>
          )}

          {/* Seller Card Summary */}
          <section className="seller-summary" style={{ background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "8px 10px", marginTop: "1px" }}>
            <span className="seller-summary__avatar" style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#0284c7", color: "#fff", display: "grid", placeItems: "center", fontWeight: "800", fontSize: "0.8rem" }}>
              {product.sellerAvatar ? (
                <img src={product.sellerAvatar} alt={product.sellerName || ""} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                initials(product.sellerName)
              )}
            </span>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: "0.84rem", color: "#0f172a", display: "block" }}>{product.sellerName || "Ngư dân"}</strong>
              <div style={{ display: "flex", gap: "6px", marginTop: "1px" }}>
                {sellerVerified && <span style={{ fontSize: "0.68rem", color: "#059669", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "2px" }}><ShieldCheck size={11} /> Đã xác minh</span>}
                {sellerPremium && <span style={{ fontSize: "0.7rem", color: "#d97706", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "2px" }}><Crown size={11} /> Premium</span>}
              </div>
            </div>
            <Link to={`/fisherman/${product.sellerId}`} style={{ fontSize: "0.75rem", fontWeight: "700", color: "#0284c7", padding: "4px 8px", borderRadius: "6px", background: "#e0f2fe", textDecoration: "none" }}>Xem hồ sơ</Link>
          </section>

          {/* Action Buttons Bar */}
          <div className="product-detail-actions" style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
            <button className="button button--primary" onClick={() => openChat(false)} type="button" style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", fontWeight: "700", fontSize: "0.84rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", height: "38px" }}>
              <MessageSquare size={16} /> Nhắn người bán
            </button>
            <button
              aria-label={isFavorite ? "Bỏ lưu" : "Lưu sản phẩm"}
              className={`button button--icon ${isFavorite ? "is-saved" : ""}`}
              onClick={toggleFavorite}
              type="button"
              style={{ width: "38px", height: "38px", borderRadius: "8px", flexShrink: 0 }}
            >
              <Bookmark size={16} />
            </button>
            <ReportButton
              onSubmit={(reason) =>
                apiReports.createForProduct(getProductId(product), reason)
              }
            />
          </div>
        </div>
      </article>

      <AdBanner targetRole="buyer" className="product-detail-ad" />

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

      {lightboxOpen && (
        <ImageLightboxModal
          images={productImages}
          currentIndex={activeImageIndex}
          onClose={() => setLightboxOpen(false)}
          onSelectIndex={(index) => setActiveImageIndex(index)}
        />
      )}
    </div>
  );
}
