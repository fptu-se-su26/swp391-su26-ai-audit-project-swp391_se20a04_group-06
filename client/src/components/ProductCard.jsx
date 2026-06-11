import { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { fmt } from "../utils/format";
import { useCountdown } from "../hooks/useCountdown";
import { VerifiedBadge } from "./VerifiedBadge";
import { api } from "../services/api";
import { cardImage } from "../utils/cloudinary";
import { HeartIcon, WeightIcon, EyeIcon, ClockIcon } from "./icons";
import styles from "./ProductCard.module.css";

export const CountdownBadge = memo(function CountdownBadge({ catchTime }) {
  const rem = useCountdown(catchTime);
  if (!rem) return null;

  const expired = rem === "Hết hạn";

  // 🌟 KHẮC PHỤC: Phân tích trực tiếp từ chuỗi 'rem' để giữ tính thuần khiết cho render
  // Tách lấy số giờ từ định dạng chuỗi "Xh Ym" (ví dụ "4h 30m" -> lấy ra số 4)
  const hoursRemaining =
    rem && !expired ? parseInt(rem.split("h")[0], 10) : 999;
  const urgent = !expired && hoursRemaining < 5;

  const colorStyle = expired
    ? { background: "#fee2e2", color: "#991b1b" }
    : urgent
      ? { background: "#fecaca", color: "#dc2626" }
      : { background: "#fffbeb", color: "#b45309" };

  return (
    <span className={styles.countdownBadge} style={colorStyle}>
      <ClockIcon size={12} />
      {rem}
    </span>
  );
});

export const ProductCard = memo(
  function ProductCard({
    product,
    onClick,
    onSellerClick,
    favoriteIds,
    onFavoriteChange,
    user,
    cardIndex = 0,
  }) {
    const navigate = useNavigate();

    const handleClick = useCallback(() => {
      if (onClick) onClick(product.id);
      else navigate(`/san-pham/${product.id}`);
    }, [onClick, product.id, navigate]);

    const handleSellerClick = useCallback(
      (e) => {
        e.stopPropagation();
        if (onSellerClick) onSellerClick(e);
        else navigate(`/nguoi-ban/${product.sellerId}`);
      },
      [onSellerClick, product.sellerId, navigate],
    );

    const isFav = favoriteIds?.includes(product.id) ?? false;
    const [favLoading, setFavLoading] = useState(false);
    const [localFav, setLocalFav] = useState(null);
    const [popKey, setPopKey] = useState(0);
    const currentFav = localFav !== null ? localFav : isFav;

    const toggleFav = useCallback(
      async (e) => {
        e.stopPropagation();
        if (!user) {
          navigate("/dang-nhap");
          return;
        }
        setFavLoading(true);
        try {
          const res = await api(`/favorites/${product.id}`, { method: "POST" });
          setLocalFav(res.favorited);
          if (res.favorited) setPopKey((k) => k + 1);
          onFavoriteChange?.(product.id, res.favorited);
        } catch {
          /* silent */
        } finally {
          setFavLoading(false);
        }
      },
      [user, product.id, onFavoriteChange, navigate],
    );

    const handleCtaClick = useCallback(
      (e) => {
        e.stopPropagation();
        handleClick();
      },
      [handleClick],
    );

    const typeBadgeStyle =
      product.type === "Fresh"
        ? { background: "rgba(14, 165, 233, 0.2)", color: "#7dd3fc" }
        : { background: "rgba(251, 191, 36, 0.2)", color: "#fcd34d" };
    const typeLabel = product.type === "Fresh" ? "Tươi" : "Khô";

    const pct = Math.round(
      (product.remainingWeight / product.totalWeight) * 100,
    );
    const stockColor = pct > 50 ? "#10b981" : pct > 20 ? "#f59e0b" : "#ef4444";
    const optimizedImg = cardImage(product.coverImg);

    /* Build short description */
    const shortDesc = product.description
      ? product.description.slice(0, 120) +
        (product.description.length > 120 ? "…" : "")
      : `Hải sản tươi sống ${product.remainingWeight}kg, đánh bắt tự nhiên từ vùng biển ${product.origin || "Việt Nam"}.`;

    return (
      <div
        className={styles.card}
        onClick={handleClick}
        style={{ "--card-i": Math.min(cardIndex, 15) }}
      >
        {/* ── Image Section ── */}
        <div className={styles.imageWrap}>
          {/* Badges */}
          <div className={styles.badgeGroup}>
            <span className={styles.badge} style={typeBadgeStyle}>
              {typeLabel}
            </span>
            {product.salesType === "Wholesale" && (
              <span
                className={styles.badge}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#e2e8f0",
                }}
              >
                Sỉ
              </span>
            )}
          </div>

          {/* Fav button */}
          <button
            key={currentFav ? `fav-${popKey}` : "unfav"}
            className={`${styles.favBtn} ${currentFav ? styles.favorited : ""}`}
            onClick={toggleFav}
            disabled={favLoading}
            aria-label="Lưu yêu thích"
          >
            <HeartIcon size={14} filled={currentFav} />
          </button>

          {/* Product Image */}
          {optimizedImg ? (
            <img
              src={optimizedImg}
              alt={product.name}
              loading="lazy"
              className={styles.image}
            />
          ) : (
            <div className={styles.imagePlaceholder}>🐟</div>
          )}
          <div className={styles.imageOverlay} />

          {/* Seller Avatar Overlay */}
          <div className={styles.sellerOverlay}>
            <button
              className={styles.sellerAvatarCircle}
              onClick={handleSellerClick}
            >
              {(product.sellerName || "?").charAt(0).toUpperCase()}
            </button>
            <button
              className={styles.sellerOverlayName}
              onClick={handleSellerClick}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              {product.sellerName}
              {product.sellerIsVerified && <VerifiedBadge />}
              {product.sellerIsPremium ? (
                <span title="Premium" style={{ fontSize: 11 }}>
                  👑
                </span>
              ) : null}
            </button>
          </div>
        </div>
        {/* ── Body ── */}
        <div className={styles.body}>
          {/* Hàng 1: Tên sản phẩm & Đơn giá gộp chung dòng */}
          <div className={styles.titlePriceRow}>
            <h3 className={styles.name}>{product.name}</h3>
            <div className={styles.price}>
              {fmt(product.price)}
              <span className={styles.priceUnit}>/kg</span>
            </div>
          </div>

          {/* Hàng 2: Mô tả ngắn gọn (Giới hạn hiển thị 1 dòng) */}
          <div className={styles.descSnippet}>{shortDesc}</div>

          {/* Hàng 3: Gộp Thông số kho hàng & Bộ đếm thời gian tươi */}
          <div className={styles.metaRow}>
            <div className={styles.statsRow}>
              <span className={styles.statItem}>
                <WeightIcon size={12} />
                <strong className={styles.statValue}>
                  {product.remainingWeight} kg
                </strong>
              </span>
              {product.viewCount > 0 && (
                <span className={styles.statItem}>
                  <EyeIcon size={12} />
                  {product.viewCount}
                </span>
              )}
            </div>

            {product.type === "Fresh" && product.catchTime && (
              <CountdownBadge catchTime={product.catchTime} />
            )}
          </div>

          {/* Thanh hiển thị phần trăm tồn kho */}
          <div className={styles.stockBar}>
            <div
              className={styles.stockFill}
              style={{
                transform: `scaleX(${Math.min(100, pct) / 100})`,
                background: stockColor,
              }}
            />
          </div>

          {/* Nút hành động */}
          <button className={styles.ctaBtn} onClick={handleCtaClick}>
            🛒 Xem chi tiết
            <span className={styles.ctaArrow}>➔</span>
          </button>
        </div>
      </div>
    );
  },
  (p, n) => {
    const pUserId = p.user?.id || p.user?.userId;
    const nUserId = n.user?.id || n.user?.userId;
    return (
      p.product === n.product &&
      pUserId === nUserId &&
      p.cardIndex === n.cardIndex &&
      p.favoriteIds?.includes(p.product.id) ===
        n.favoriteIds?.includes(n.product.id)
    );
  },
);

export function ProductSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div
        className="skeleton-shimmer"
        style={{ height: 220, width: "100%", borderRadius: 10 }}
      />
      <div className={styles.skeletonBody}>
        <div
          className="skeleton-shimmer"
          style={{
            width: "75%",
            height: 14,
            borderRadius: 4,
            marginBottom: 10,
          }}
        />
        <div
          className="skeleton-shimmer"
          style={{
            width: "45%",
            height: 18,
            borderRadius: 4,
            marginBottom: 10,
          }}
        />
        <div
          className="skeleton-shimmer"
          style={{
            width: "100%",
            height: 10,
            borderRadius: 4,
            marginBottom: 8,
          }}
        />
        <div
          className="skeleton-shimmer"
          style={{
            width: "100%",
            height: 3,
            borderRadius: 99,
            marginBottom: 12,
          }}
        />
        <div
          className="skeleton-shimmer"
          style={{ width: "100%", height: 34, borderRadius: 8 }}
        />
      </div>
    </div>
  );
}
