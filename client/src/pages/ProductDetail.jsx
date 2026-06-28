import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Clock3,
  Crown,
  MapPin,
  MessageSquare,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SellerLocationMap from "../components/SellerLocationMap";
import { useAuth } from "../context/AuthContext";
import { apiFishermen, apiProducts } from "../services/api";
import {
  calculateDistanceKm,
  formatCurrency,
  formatDate,
  formatDistance,
  getFreshness,
  getProductId,
  getProductImage,
} from "../utils/product";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerLocation, setViewerLocation] = useState(null);
  const [favorites, setFavorites] = useState(
    () => new Set(JSON.parse(localStorage.getItem("haisan-favorites") || "[]")),
  );

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

  const toggleFavorite = () => {
    if (!requireLogin()) return;
    const productId = getProductId(product);
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      localStorage.setItem("haisan-favorites", JSON.stringify([...next]));
      return next;
    });
  };

  const calculateDistance = () => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      setViewerLocation({ latitude: coords.latitude, longitude: coords.longitude });
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

  return (
    <div className="product-detail-page page-container">
      <Link className="back-link" to="/marketplace">
        <ArrowLeft size={17} /> Quay lại chợ hải sản
      </Link>

      <article className="product-detail-card">
        <div className="product-detail-card__media">
          <img src={getProductImage(product)} alt={product.name} />
          <div className="product-detail-card__badges">
            <span>{product.type === "Fresh" ? "Hải sản tươi" : "Hải sản khô"}</span>
            <span className={product.status === "Active" ? "is-active" : "is-inactive"}>
              {product.status === "Active" ? "Đang bán" : "Ngừng bán"}
            </span>
          </div>
        </div>

        <div className="product-detail-card__content">
          <span className="eyebrow">{product.category || "HẢI SẢN"}</span>
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
          </dl>

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
            <button className="button button--secondary" onClick={() => openChat(true)} type="button">
              Giữ chỗ
            </button>
            <button
              aria-label={isFavorite ? "Bỏ lưu" : "Lưu sản phẩm"}
              className={`button button--icon ${isFavorite ? "is-saved" : ""}`}
              onClick={toggleFavorite}
              type="button"
            >
              <Bookmark size={18} />
            </button>
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
            {viewerLocation ? formatDistance(distanceKm) : "Tính khoảng cách"}
          </button>
        </div>
        <SellerLocationMap lat={product.lat} lng={product.lng} sellerName={product.sellerName} />
      </section>
    </div>
  );
}
