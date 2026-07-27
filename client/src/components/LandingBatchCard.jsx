import {
  Anchor,
  Clock3,
  MapPin,
  MessageSquare,
  PackageOpen,
  Scale,
  ShieldCheck,
  Ship,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  formatLandingDateTime,
  getLandingBatchId,
  getLandingBatchImage,
  getLandingBatchStatus,
  landingBatchCategoryLabels,
} from "../utils/landingBatch";
import { formatCurrency, getProductId } from "../utils/product";

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

export default function LandingBatchCard({ batch }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const id = getLandingBatchId(batch);
  const image = getLandingBatchImage(batch);
  const status = getLandingBatchStatus(batch.status);
  const topProduct = batch.topProducts?.[0];

  const openBatch = () => navigate(`/landing-batches/${id}`);

  const openChat = (event) => {
    event.stopPropagation();
    if (!topProduct) return;
    if (!user) {
      navigate("/login", {
        state: { message: "Bạn cần đăng nhập để nhắn với người bán." },
      });
      return;
    }
    navigate("/chat", {
      state: {
        startChatWith: batch.sellerId,
        sellerName: batch.sellerName,
        productId: getProductId(topProduct),
        productName: topProduct.name,
        productPrice: topProduct.price,
        initialMessage: `Tôi muốn hỏi thêm về vựa cá "${batch.title}".`,
      },
    });
  };

  return (
    <article
      className="landing-batch-card"
      data-tour="landing-batch-card"
      onClick={openBatch}
      onKeyDown={(event) => event.key === "Enter" && openBatch()}
      role="link"
      tabIndex={0}
    >
      <div className="landing-batch-card__media">
        {image ? (
          <img alt={batch.title} loading="lazy" src={image} />
        ) : (
          <span className="landing-batch-card__media-empty">
            <Ship size={34} />
          </span>
        )}
        <span className={`batch-status batch-status--${status.key}`}>
          {status.label}
        </span>
      </div>

      <div className="landing-batch-card__body">
        <div className="landing-batch-card__seller">
          <span>
            {batch.sellerAvatar ? (
              <img src={batch.sellerAvatar} alt={batch.sellerName || ""} />
            ) : (
              initials(batch.sellerName)
            )}
          </span>
          <strong>
            {batch.sellerName || "Ngư dân"}
            {batch.sellerIsVerified && <ShieldCheck size={14} />}
          </strong>
        </div>
        <h3>{batch.title}</h3>
        {batch.freshnessLabel && (
          <span className="landing-batch-card__freshness">
            {batch.freshnessLabel}
          </span>
        )}
        <p className="landing-batch-card__landing-time">
          <Clock3 size={14} /> Cập bến {formatLandingDateTime(batch.landingTime || batch.createdAt)}
        </p>

        <dl className="landing-batch-card__facts">
          <div>
            <MapPin size={15} />
            <dt>Khu vực</dt>
            <dd>{batch.catchArea || batch.origin || "Chưa cập nhật"}</dd>
          </div>
          <div>
            <PackageOpen size={15} />
            <dt>Hải sản</dt>
            <dd>{Number(batch.productCount || 0)} loại</dd>
          </div>
          <div>
            <Scale size={15} />
            <dt>Còn lại</dt>
            <dd>
              {Number(batch.remainingWeight || 0)} / {Number(batch.totalWeight || 0)} kg
            </dd>
          </div>
          <div>
            <Anchor size={15} />
            <dt>Khoảng giá</dt>
            <dd>
              {batch.priceRange?.min != null
                ? `${formatCurrency(batch.priceRange.min)}${
                    batch.priceRange.max !== batch.priceRange.min
                      ? ` – ${formatCurrency(batch.priceRange.max)}`
                      : ""
                  }`
                : "Chưa có sản phẩm"}
            </dd>
          </div>
        </dl>

        {batch.categories?.length > 0 && (
          <div className="landing-batch-card__categories">
            {batch.categories.slice(0, 5).map((category) => (
              <span key={category}>
                {landingBatchCategoryLabels[category] || category}
              </span>
            ))}
          </div>
        )}

        <div className="landing-batch-card__actions">
          <button
            className="button button--primary"
            data-tour="landing-batch-view-button"
            onClick={(event) => {
              event.stopPropagation();
              openBatch();
            }}
            type="button"
          >
            <PackageOpen size={16} /> Xem vựa cá
          </button>
          <button
            className="button button--secondary"
            data-tour="landing-batch-chat-button"
            disabled={!topProduct}
            onClick={openChat}
            title={topProduct ? "Nhắn người bán" : "Vựa chưa có sản phẩm để mở cuộc trò chuyện"}
            type="button"
          >
            <MessageSquare size={16} /> Nhắn người bán
          </button>
        </div>
      </div>
    </article>
  );
}
