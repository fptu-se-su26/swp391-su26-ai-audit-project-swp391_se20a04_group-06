import { memo } from "react";
import {
  Anchor,
  Bookmark,
  CalendarDays,
  Clock3,
  Crown,
  MapPin,
  MessageSquare,
  PackageOpen,
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
  getMarketplaceStatus,
  getProductId,
  getProductImage,
} from "../utils/product";

function ProductCard({
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
  const marketplaceStatus = getMarketplaceStatus(product);
  const canReserve = marketplaceStatus.key === "available";
  const productImage = getProductImage(product);
  const batchId =
    product.batchId?.id || product.batchId?._id || product.batchId || "";
  const batchTitle = product.batchTitle || product.batchId?.title || "";

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
      data-tour="product-card"
      onClick={() => navigate(`/product/${productId}`)}
      onKeyDown={(event) => event.key === "Enter" && navigate(`/product/${productId}`)}
      role="link"
      tabIndex={0}
    >
      <div className="market-product-card__media">
        <img
          aria-hidden="true"
          alt=""
          className="market-product-card__media-backdrop"
          decoding="async"
          loading="lazy"
          src={productImage}
        />
        <img
          alt={product.name}
          className="market-product-card__media-image"
          decoding="async"
          loading="lazy"
          src={productImage}
        />
        <span className={`status-chip status-chip--${marketplaceStatus.key}`}>
          {marketplaceStatus.label}
        </span>
        <button
          aria-label={isFavorite ? "Bỏ lưu sản phẩm" : "Lưu sản phẩm"}
          className={`save-button ${isFavorite ? "is-saved" : ""}`}
          data-tour="product-favorite-button"
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
          <div className="product-fact product-fact--origin">
            <Anchor size={15} />
            <dt>Nguồn gốc</dt>
            <dd title={product.origin || "Chưa cập nhật"}>{product.origin || "Chưa cập nhật"}</dd>
          </div>
        </dl>

        {batchId && batchTitle && (
          <button
            className="market-product-card__batch-link"
            data-tour="product-batch-link"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/landing-batches/${batchId}`);
            }}
            type="button"
          >
            <PackageOpen size={15} />
            <span>Thuộc vựa: <strong>{batchTitle}</strong></span>
            <small>Xem cả vựa</small>
          </button>
        )}

        <button className="seller-identity" data-tour="product-seller-info" onClick={openSeller} type="button">
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
          <button className="button button--primary" data-tour="product-chat-button" onClick={(event) => openChat(event)} type="button">
            <MessageSquare size={16} /> Nhắn người bán
          </button>
          <button
            className="button button--secondary"
            data-tour="product-reserve-button"
            disabled={!canReserve}
            onClick={(event) => openChat(event, true)}
            type="button"
          >
            Giữ chỗ
          </button>
        </div>
      </div>
    </article>
  );
}

export default memo(ProductCard);
