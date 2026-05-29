/**
 * ProductCard.jsx — Premium Optimized Component
 */
import React, { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/theme";
import { fmt } from "../utils/format";
import { useCountdown } from "../hooks/useCountdown";
import { VerifiedBadge } from "./VerifiedBadge";
import { api } from "../services/api";
import { cardImage } from "../utils/cloudinary";
import { HeartIcon, WeightIcon, EyeIcon, MapPinIcon, ClockIcon } from "./icons";
import styles from "./ProductCard.module.css";
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";

// ── Countdown Badge ──
export const CountdownBadge = memo(function CountdownBadge({ catchTime }) {
  const rem = useCountdown(catchTime);
  if (!rem) return null;

  const expired = rem === "Hết hạn";
  const diff = 24 * 3600000 - (Date.now() - new Date(catchTime).getTime());
  const urgent = !expired && diff > 0 && diff < 5 * 3600000;

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

// ── Main Product Card Component ──
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

    const typeBadgeStyle =
      product.type === "Fresh"
        ? { background: "#e0f2fe", color: "#0369a1" }
        : { background: "#fef3c7", color: "#92400e" };
    const typeLabel = product.type === "Fresh" ? "Tươi" : "Khô";

    const pct = Math.round(
      (product.remainingWeight / product.totalWeight) * 100,
    );
    const stockColor = pct > 50 ? "#10b981" : pct > 20 ? "#f59e0b" : "#ef4444";
    const optimizedImg = cardImage(product.coverImg);

    return (
      <div
        className={styles.card}
        onClick={handleClick}
        style={{ "--card-i": Math.min(cardIndex, 15) }}
      >
        <div className={styles.badgeGroup}>
          <span className={styles.badge} style={typeBadgeStyle}>
            {typeLabel}
          </span>
          {product.salesType === "Wholesale" && (
            <span
              className={styles.badge}
              style={{ background: "#f1f5f9", color: "#334155" }}
            >
              Sỉ
            </span>
          )}
        </div>

        <button
          key={currentFav ? `fav-${popKey}` : "unfav"}
          className={`${styles.favBtn} ${currentFav ? styles.favorited : ""}`}
          onClick={toggleFav}
          disabled={favLoading}
          aria-label="Lưu yêu thích"
        >
          <HeartIcon size={14} filled={currentFav} />
        </button>

        <div className={styles.imageWrap}>
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
        </div>

        <div className={styles.body}>
          <h3 className={styles.name}>{product.name}</h3>

          <div className={styles.price}>
            {fmt(product.price)}
            <span className={styles.priceUnit}>/kg</span>
          </div>

          <div className={styles.statsRow}>
            <span className={styles.statItem}>
              <WeightIcon size={13} />
              <strong className={styles.statValue}>
                {product.remainingWeight} kg
              </strong>
            </span>
            {product.viewCount > 0 && (
              <span className={styles.statItem}>
                <EyeIcon size={13} />
                {product.viewCount} lượt xem
              </span>
            )}
          </div>

          <div className={styles.stockBar}>
            <div
              className={styles.stockFill}
              style={{
                width: `${Math.min(100, pct)}%`,
                background: stockColor,
              }}
            />
          </div>

          {product.origin && (
            <div className={styles.origin}>
              <MapPinIcon size={12} />
              <span>{product.origin}</span>
            </div>
          )}

          <hr className={styles.divider} />

          <div className={styles.sellerRow}>
            <button className={styles.sellerLink} onClick={handleSellerClick}>
              <span className={styles.sellerAvatar}>
                {(product.sellerName || "?").charAt(0).toUpperCase()}
              </span>
              <span>{product.sellerName?.split(" ").pop()}</span>
              {product.sellerIsVerified && <VerifiedBadge />}
              {product.sellerIsPremium ? (
                <span
                  title="Thành viên Premium uy tín"
                  style={{
                    fontSize: 12,
                    marginLeft: 2,
                    display: "inline-flex",
                    alignItems: "center",
                    cursor: "help"
                  }}
                >
                  👑
                </span>
              ) : null}
            </button>

            {product.type === "Fresh" && product.catchTime && (
              <CountdownBadge catchTime={product.catchTime} />
            )}
          </div>
        </div>
      </div>
    );
  },
  (p, n) =>
    p.product === n.product &&
    p.user?.id === n.user?.id &&
    p.cardIndex === n.cardIndex &&
    p.favoriteIds?.includes(p.product.id) ===
      n.favoriteIds?.includes(n.product.id),
);

// ── Product Skeleton Component ──
export function ProductSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div
        className="skeleton-shimmer"
        style={{ height: 180, width: "100%" }}
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
            marginBottom: 12,
          }}
        />
        <div
          className="skeleton-shimmer"
          style={{ width: "55%", height: 10, borderRadius: 4, marginBottom: 8 }}
        />
        <div
          className="skeleton-shimmer"
          style={{
            width: "100%",
            height: 3,
            borderRadius: 99,
            marginBottom: 16,
          }}
        />
        <div className={styles.skeletonRow}>
          <div
            className="skeleton-shimmer"
            style={{ width: 64, height: 12, borderRadius: 4 }}
          />
          <div
            className="skeleton-shimmer"
            style={{ width: 80, height: 14, borderRadius: 4 }}
          />
        </div>
      </div>
    </div>
  );
}
