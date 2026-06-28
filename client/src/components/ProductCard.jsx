import {
  Anchor,
  Bookmark,
  CalendarDays,
  Clock3,
  Crown,
  MapPin,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  calculateDistanceKm,
  formatCurrency,
  formatDate,
  formatDistance,
  getFreshness,
  getProductId,
  getProductImage,
} from "../utils/product";

export default function ProductCard({
  product,
  isFavorite = false,
  onToggleFavorite,
  onOpenSeller,
  viewerLocation,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const productId = getProductId(product);
  const distanceKm = calculateDistanceKm(viewerLocation, product);
  const sellerVerified = Boolean(product.sellerIsVerified || product.isVerified);
  const sellerPremium = Boolean(product.sellerIsPremium || product.isPremium);
  const isActive = (product.status || "Active") === "Active";

  const requireLogin = () => {
    if (user) return true;
    navigate("/login", {
      state: { message: "Bạn cần đăng nhập để lưu sản phẩm hoặc nhắn cho người bán." },
    });
    return false;
  };

  const openChat = (event, reserve = false) => {
    event.stopPropagation();
    if (!requireLogin()) return;
    navigate("/chat", {
      state: {
        startChatWith: product.sellerId,
        sellerName: product.sellerName,
        productId,
        productName: product.name,
        productPrice: product.price,
        initialMessage: reserve
          ? `Tôi muốn giữ chỗ mẻ ${product.name}. Người bán xác nhận giúp tôi nhé.`
          : "",
      },
    });
  };

  const toggleFavorite = (event) => {
    event.stopPropagation();
    if (!requireLogin()) return;
    onToggleFavorite?.(productId);
  };

  const openSeller = (event) => {
    event.stopPropagation();
    if (onOpenSeller) onOpenSeller(product.sellerId);
    else navigate(`/fisherman/${product.sellerId}`);
  };

  return (
    <article
      className="market-product-card"
      onClick={() => navigate(`/product/${productId}`)}
      onKeyDown={(event) => event.key === "Enter" && navigate(`/product/${productId}`)}
      role="link"
      tabIndex={0}
    >
      <div className="market-product-card__media">
        <img src={getProductImage(product)} alt={product.name} loading="lazy" />
        <span className={`status-chip ${isActive ? "status-chip--active" : "status-chip--inactive"}`}>
          {isActive ? "Đang bán" : "Ngừng bán"}
        </span>
        <button
          aria-label={isFavorite ? "Bỏ lưu sản phẩm" : "Lưu sản phẩm"}
          className={`save-button ${isFavorite ? "is-saved" : ""}`}
          onClick={toggleFavorite}
          type="button"
        >
          <Bookmark size={18} />
        </button>
      </div>

      <div className="market-product-card__body">
        <div className="market-product-card__eyebrow">
          <span>{product.category || "Hải sản"}</span>
          <span>{product.type === "Fresh" ? "Tươi sống" : "Đồ khô"}</span>
        </div>

        <h3>{product.name}</h3>
        <p className="market-product-card__price">
          {formatCurrency(product.price)} <small>/ kg</small>
        </p>

        <dl className="product-facts">
          <div>
            <MapPin size={15} />
            <dt>Khoảng cách</dt>
            <dd>{formatDistance(distanceKm)}</dd>
          </div>
          <div>
            <Clock3 size={15} />
            <dt>Độ tươi</dt>
            <dd>{getFreshness(product)}</dd>
          </div>
          <div>
            <CalendarDays size={15} />
            <dt>Đánh bắt</dt>
            <dd>{formatDate(product.catchTime)}</dd>
          </div>
          <div>
            <Anchor size={15} />
            <dt>Nguồn gốc</dt>
            <dd>{product.origin || "Chưa cập nhật"}</dd>
          </div>
        </dl>

        <button className="seller-identity" onClick={openSeller} type="button">
          <span className="seller-identity__avatar">
            {(product.sellerName || "ND").slice(0, 2).toUpperCase()}
          </span>
          <span>
            <strong>{product.sellerName || "Ngư dân"}</strong>
            <small>
              {sellerVerified && <><ShieldCheck size={13} /> Đã xác minh</>}
              {sellerPremium && <><Crown size={13} /> Premium</>}
              {!sellerVerified && !sellerPremium && "Người bán trên chợ"}
            </small>
          </span>
        </button>

        <div className="market-product-card__actions">
          <button className="button button--primary" onClick={(event) => openChat(event)} type="button">
            <MessageSquare size={16} /> Nhắn người bán
          </button>
          <button className="button button--secondary" onClick={(event) => openChat(event, true)} type="button">
            Giữ chỗ
          </button>
        </div>
      </div>
    </article>
  );
}
