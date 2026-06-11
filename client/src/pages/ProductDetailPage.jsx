import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { fmt } from "../utils/format";
import { MapMini } from "../components/MapMini";
import { CountdownBadge } from "../components/ProductCard";
import { ReviewList } from "../components/ReviewList";
import { useSEO } from "../hooks/useSEO";
import { ogImage } from "../utils/cloudinary";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { VerifiedBadge } from "../components/VerifiedBadge";
import styles from "./ProductDetailPage.module.css";

const CATEGORY_MAP = {
  Fish: "🐟 Cá tươi câu",
  Shrimp: "🦐 Tôm sống",
  Squid: "🦑 Mực, Bạch tuộc",
  Crab: "🦀 Cua, Ghẹ",
  Shellfish: "🐚 Nghêu, Sò, Ốc",
  Others: "✨ Loại khác",
};

/* ═══════════════════════════════════════════
   Enhanced Image Gallery with Thumbnail Strip
   (Inspired by umai.fish product gallery)
   ═══════════════════════════════════════════ */
function ProductGallery({ product }) {
  const [idx, setIdx] = useState(0);
  const images = product.images || [];
  const n = images.length || product.imgCount || 1;
  const bgs = ["#0B4F6C", "#1A7FA0", "#0097A7", "#2D7D46", "#8B5E3C"];

  return (
    <div className={styles.gallery}>
      {/* Main Image */}
      <div className={styles.mainImage}>
        {images[idx] ? (
          <img src={images[idx].url} alt={`${product.name} — ảnh ${idx + 1}`} />
        ) : (
          <div
            style={{
              background: `linear-gradient(135deg, ${bgs[idx % bgs.length]}, ${bgs[(idx + 1) % bgs.length]})`,
              height: "100%",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 96 }}>🐟</span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
              Ảnh {idx + 1}/{n}
            </span>
          </div>
        )}

        <div className={styles.imgCounter}>
          📸 {idx + 1}/{n}
        </div>

        {n > 1 && (
          <>
            <button
              className={`${styles.navBtn} ${styles.navPrev}`}
              onClick={(e) => {
                e.stopPropagation();
                setIdx((idx - 1 + n) % n);
              }}
            >
              ‹
            </button>
            <button
              className={`${styles.navBtn} ${styles.navNext}`}
              onClick={(e) => {
                e.stopPropagation();
                setIdx((idx + 1) % n);
              }}
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip (umai.fish style) */}
      {n > 1 && (
        <div className={styles.thumbStrip}>
          {Array.from({ length: n }).map((_, i) => (
            <div
              key={i}
              className={`${styles.thumb} ${i === idx ? styles.thumbActive : ""}`}
              onClick={() => setIdx(i)}
            >
              {images[i] ? (
                <img src={images[i].url} alt={`thumb ${i + 1}`} />
              ) : (
                <div className={styles.thumbPlaceholder}>🐟</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main ProductDetailPage Component
   ═══════════════════════════════════════════ */
export function ProductDetailPage({ product: initialProduct }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(!initialProduct?.images);
  const [isFollowing, setIsFollowing] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [showPriceHistory, setShowPriceHistory] = useState(false);

  useSEO({
    title: product
      ? `${product.name} — ${product.sellerName}`
      : "Chi tiết sản phẩm",
    description: product
      ? `${product.type === "Fresh" ? "🌊 Hải sản tươi" : "🔥 Hải sản khô"} — ${product.name}. Còn ${product.remainingWeight}kg. Giá ${parseFloat(product.price || 0).toLocaleString("vi-VN")}đ/kg.`
      : undefined,
    image: product ? ogImage(product.coverImg) : undefined,
    url: product
      ? `${window.location.origin}/san-pham/${product.id}`
      : undefined,
    product: product || undefined,
  });

  const {
    id: productId,
    sellerId: initialSellerId,
    scrollToReviewId: initialScrollId,
  } = initialProduct || {};

  useEffect(() => {
    if (!productId) return;

    api(`/products/${productId}`)
      .then((data) =>
        setProduct({
          ...data,
          description: data.description || data.desc,
          scrollToReviewId: initialScrollId || null,
        }),
      )
      .catch(() => {})
      .finally(() => setLoading(false));

    api(`/products/${productId}/price-history`)
      .then((history) => setPriceHistory(history || []))
      .catch(() => {});

    if (user && initialSellerId) {
      api(`/follows/${initialSellerId}/check`)
        .then((res) => setIsFollowing(res.isFollowing))
        .catch(() => {});
    }
    if (user && productId) {
      api(`/favorites/ids`)
        .then((ids) => setIsFavorited(ids.includes(productId)))
        .catch(() => {});
    }
  }, [productId, initialSellerId, initialScrollId, user]);

  const handleOpenGlobalChat = () => {
    window.dispatchEvent(
      new CustomEvent("open-global-chat", {
        detail: {
          productId: product.id,
          productName: product.name,
          otherUserId: product.sellerId,
          otherUserName: product.sellerName,
          productSellerId: product.sellerId,
        },
      }),
    );
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setReportLoading(true);
    try {
      await api(`/reports/${product.id}`, {
        method: "POST",
        body: JSON.stringify({ reason: reportReason }),
      });
      setReportSent(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSent(false);
        setReportReason("");
      }, 2000);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setReportLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate("/dang-nhap");
      return;
    }
    setFavLoading(true);
    try {
      const res = await api(`/favorites/${product.id}`, { method: "POST" });
      setIsFavorited(res.favorited);
    } catch {
      /* silent */
    } finally {
      setFavLoading(false);
    }
  };

  const handleToggleFollow = () => {
    if (!user) {
      toast.warn("Vui lòng đăng nhập để theo dõi!");
      return;
    }
    if (user.userId === product.sellerId) {
      toast.warn("Bạn không thể tự theo dõi chính mình!");
      return;
    }
    setTogglingFollow(true);
    api(`/follows/${product.sellerId}/toggle`, { method: "POST" })
      .then((res) => {
        setIsFollowing(res.isFollowing);
        toast.success(res.message);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setTogglingFollow(false));
  };

  if (!product) return null;

  const pct = Math.round((product.remainingWeight / product.totalWeight) * 100);
  const isOwnProduct = user?.userId === product?.sellerId;
  const stockColor = pct > 50 ? "#10b981" : pct > 20 ? "#f59e0b" : "#ef4444";

  const paragraphs = product.description
    ? product.description.split(/\n\s*\n/).filter(Boolean)
    : [];
  const images = product.images || [];
  const next7Days = Array.from({ length: 8 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateStr: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
    };
  });

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* ── Breadcrumb Navigation ── */}
        <nav className={styles.breadcrumb}>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            🏠 Trang chủ
          </a>
          <span>›</span>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            {product.type === "Fresh" ? "🌊 Hải sản tươi" : "🔥 Hải sản khô"}
          </a>
          <span>›</span>
          <span className={styles.breadcrumbCurrent}>{product.name}</span>
        </nav>

        {loading ? (
          <div className={styles.loadingShimmer}>
            Đang tải thông tin chi tiết hải sản...
          </div>
        ) : (
          <>
            {/* ══════ MAIN GRID ══════ */}
            <div className={styles.grid}>
              {/* ── GALLERY AREA ── */}
              <div className={styles.galleryArea}>
                <ProductGallery product={product} />
              </div>

              {/* ── DESCRIPTION & MAP AREA ── */}
              <div className={styles.descArea}>
                {/* Description Section */}
                <div className={styles.descSection}>
                  <div className={styles.sectionTitle}>
                    <div className={styles.sectionTitleAccent} />
                    Thông tin chi tiết từ ngư dân
                  </div>

                  <p className={styles.descText}>
                    {product.description ||
                      "Ngư dân chưa thêm thông tin mô tả chi tiết cho sản phẩm này."}
                  </p>

                  {/* Info Table (umai.fish inspired structured data) */}
                  <table className={styles.infoTable}>
                    <tbody>
                      <tr>
                        <th>Phân loại</th>
                        <td>
                          {CATEGORY_MAP[product.category] ||
                            "✨ Phân loại khác"}
                        </td>
                      </tr>
                      <tr>
                        <th>Loại hình</th>
                        <td>
                          {product.type === "Fresh"
                            ? "🌊 Hải sản tươi sống"
                            : "🔥 Hải sản khô / chế biến"}
                        </td>
                      </tr>
                      {product.salesType && (
                        <tr>
                          <th>Kiểu bán</th>
                          <td>
                            {product.salesType === "Wholesale"
                              ? "📦 Bán sỉ buôn lô"
                              : "🛒 Bán lẻ"}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <th>Khối lượng</th>
                        <td>
                          <strong>{product.totalWeight} kg</strong> (còn{" "}
                          {product.remainingWeight} kg)
                        </td>
                      </tr>
                      {product.origin && (
                        <tr>
                          <th>Xuất xứ</th>
                          <td>📍 {product.origin}</td>
                        </tr>
                      )}
                      {product.catchTime && (
                        <tr>
                          <th>Thời gian bắt</th>
                          <td>
                            ⏰{" "}
                            {new Date(product.catchTime).toLocaleString(
                              "vi-VN",
                            )}
                          </td>
                        </tr>
                      )}
                      {product.expiryDate && (
                        <tr>
                          <th>Hạn sử dụng</th>
                          <td>📅 {product.expiryDate}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Map Section */}
                {product.type === "Fresh" && product.lat && (
                  <div className={styles.mapSection}>
                    <MapMini
                      lat={product.lat}
                      lng={product.lng}
                      catchLat={product.catchLat}
                      catchLng={product.catchLng}
                      productName={product.name}
                    />
                  </div>
                )}
              </div>

              {/* ── INFO & SIDEBAR AREA ── */}
              <div className={styles.infoArea}>
                {/* Main Info Card */}
                <div className={styles.infoCard}>
                  {/* Badges */}
                  <div className={styles.badges}>
                    <span
                      className={`${styles.badge} ${product.type === "Fresh" ? styles.badgeFresh : styles.badgeDried}`}
                    >
                      {product.type === "Fresh"
                        ? "🌊 Hải sản Tươi"
                        : "🔥 Hải sản Khô"}
                    </span>
                    <span className={`${styles.badge} ${styles.badgeCategory}`}>
                      {CATEGORY_MAP[product.category] || "✨ Phân loại khác"}
                    </span>
                    {product.salesType === "Wholesale" && (
                      <span
                        className={`${styles.badge} ${styles.badgeWholesale}`}
                      >
                        Bán sỉ
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className={styles.productTitle}>{product.name}</h1>

                  {/* Price Block */}
                  <div className={styles.priceBlock}>
                    <span className={styles.price}>{fmt(product.price)}</span>
                    <span className={styles.priceUnit}>/kg</span>
                    <span className={styles.priceTax}></span>
                  </div>

                  {/* Price History Accordion */}
                  {priceHistory.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <button
                        className={styles.priceHistoryBtn}
                        onClick={() => setShowPriceHistory(!showPriceHistory)}
                      >
                        📈{" "}
                        {showPriceHistory
                          ? "Ẩn lịch sử đổi giá ▲"
                          : "Xem lịch sử đổi giá ▼"}
                      </button>
                      {showPriceHistory && (
                        <div className={styles.priceHistoryPanel}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#94a3b8",
                              textTransform: "uppercase",
                            }}
                          >
                            Biến động giá trị mẻ hàng
                          </div>
                          {priceHistory.map((h, i) => (
                            <div key={i} className={styles.priceHistoryItem}>
                              <div>
                                <span
                                  style={{
                                    textDecoration: "line-through",
                                    color: "#94a3b8",
                                  }}
                                >
                                  {fmt(h.oldPrice)}
                                </span>{" "}
                                ➔{" "}
                                <strong style={{ color: C.coral }}>
                                  {fmt(h.newPrice)}
                                </strong>
                              </div>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                                {new Date(h.changedAt).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stock Meter */}
                  <div className={styles.stockSection}>
                    <div className={styles.stockHeader}>
                      <span>
                        🐟 Còn lại <strong>{product.remainingWeight} kg</strong>
                      </span>
                      <span style={{ color: stockColor, fontWeight: 700 }}>
                        {pct}%
                      </span>
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
                  </div>

                  {/* Countdown for fresh */}
                  {product.type === "Fresh" && product.catchTime && (
                    <div style={{ marginBottom: 14 }}>
                      <CountdownBadge catchTime={product.catchTime} />
                    </div>
                  )}

                  <hr className={styles.divider} />

                  {/* ── Seller Card ── */}
                  <div className={styles.sectionLabel}>🚢 Ngư dân đăng bán</div>
                  <div
                    className={styles.sellerCard}
                    onClick={() => navigate(`/nguoi-ban/${product.sellerId}`)}
                  >
                    <div className={styles.sellerAvatar}>
                      {(product.sellerName || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.sellerInfo}>
                      <div className={styles.sellerName}>
                        {product.sellerName}
                        {product.sellerIsVerified === 1 && <VerifiedBadge />}
                        {product.sellerIsPremium === 1 && (
                          <span
                            title="Thành viên Premium uy tín"
                            style={{ fontSize: 14, cursor: "help" }}
                          >
                            👑
                          </span>
                        )}
                      </div>
                      <div className={styles.sellerCta}>
                        Xem gian hàng ngư dân →
                      </div>
                    </div>
                    <span className={styles.sellerArrow}>›</span>
                  </div>

                  {/* Fisherman Badges */}
                  {product.sellerBadges && product.sellerBadges.length > 0 && (
                    <div className={styles.fishBadges}>
                      {product.sellerBadges.map((badge, idx) => (
                        <span key={idx} className={styles.fishBadge}>
                          🎖️ {badge}
                        </span>
                      ))}
                    </div>
                  )}

                  <hr className={styles.divider} />

                  {/* ── CTA Buttons ── */}
                  <div className={styles.ctaGroup}>
                    <button
                      className={styles.ctaPrimary}
                      onClick={() => {
                        if (!user) {
                          navigate("/dang-nhap");
                          return;
                        }
                        handleOpenGlobalChat();
                      }}
                    >
                      💬 Nhắn tin với ngư dân
                    </button>

                    <button
                      className={styles.ctaSecondary}
                      onClick={handleToggleFavorite}
                      disabled={favLoading}
                      style={{
                        border: `1.5px solid ${isFavorited ? "#DC2626" : "#e2e8f0"}`,
                        background: isFavorited ? "#FEE2E2" : "#fff",
                        color: isFavorited ? "#DC2626" : "#64748b",
                      }}
                    >
                      {isFavorited ? "❤️ Đã lưu yêu thích" : "🤍 Lưu yêu thích"}
                    </button>

                    {!isOwnProduct && (
                      <button
                        className={styles.ctaSecondary}
                        onClick={handleToggleFollow}
                        disabled={togglingFollow}
                        style={{
                          border: `1.5px solid ${isFollowing ? "#0b4f6c" : "#e2e8f0"}`,
                          background: isFollowing ? "#f0f9ff" : "#fff",
                          color: isFollowing ? "#0b4f6c" : "#64748b",
                        }}
                      >
                        {isFollowing
                          ? "✅ Đang theo dõi"
                          : "+ Theo dõi ngư dân"}
                      </button>
                    )}

                    <button
                      className={styles.reportLink}
                      onClick={() => setShowReportModal(true)}
                    >
                      🚩 Báo cáo sản phẩm
                    </button>
                  </div>
                </div>

                {/* highlights list */}
                <ul className={styles.highlightsList}>
                  <div className={styles.highlightsHeader}>
                    📌 Điểm nổi bật của mẻ hàng
                  </div>
                  <li className={styles.highlightsLi}>
                    🐟 100% tự nhiên từ vùng biển sạch
                  </li>
                  <li className={styles.highlightsLi}>
                    ⏱️ Xử lý cấp đông đá tại tàu lập tức
                  </li>
                  <li className={styles.highlightsLi}>
                    📦 Hút chân không, đóng thùng xốp sạch sẽ
                  </li>
                  <li className={styles.highlightsLi}>
                    🚀 Giao nhanh xe đông lạnh bảo đảm độ tươi tuyệt đối
                  </li>
                </ul>
              </div>
            </div>

            {/* ── Alternating detail sections ── */}
            <div className={styles.detailsSection}>
              {images.slice(1).map((img, i) => (
                <div
                  key={i}
                  className={`${styles.detailRow} ${i % 2 === 0 ? styles.rowNormal : styles.rowReverse}`}
                >
                  <div className={styles.detailImage}>
                    <img src={img.url} alt={`Mô tả chi tiết ${i + 1}`} />
                  </div>
                  <div className={styles.detailContent}>
                    <h3 className={styles.detailRowTitle}>
                      {i === 0
                        ? "⚓ Nguồn gốc và quy trình đánh bắt"
                        : i === 1
                          ? "❄️ Quy trình bảo quan & đóng gói"
                          : "🍽️ Hướng dẫn chế biến & thưởng thức"}
                    </h3>
                    <p className={styles.detailRowText}>
                      {paragraphs[i + 1] ||
                        "Sản phẩm được đánh bắt có trách nhiệm tại các ngư trường bản địa Việt Nam, xử lý cấp đông lạnh lập tức ngay trên tàu để đảm bảo giữ nguyên vị ngọt tự nhiên khi giao tới tay khách hàng."}
                    </p>
                  </div>
                </div>
              ))}

              {/* If there are no extra images, show at least 2 default blocks to mimic Umai.fish layout */}
              {images.length <= 1 && (
                <>
                  <div className={`${styles.detailRow} ${styles.rowNormal}`}>
                    <div className={styles.detailImage}>
                      <img src="/03.png" alt="Quy trình đánh bắt" />
                    </div>
                    <div className={styles.detailContent}>
                      <h3 className={styles.detailRowTitle}>
                        ⚓ Quy trình đánh bắt tự nhiên
                      </h3>
                      <p className={styles.detailRowText}>
                        Hải sản được đánh bắt tự nhiên tại các vùng vịnh nước
                        sâu Việt Nam. Chúng tôi cam kết khai thác bền vững, bảo
                        vệ hệ sinh thái và nguồn lợi thủy hải sản địa phương.
                      </p>
                    </div>
                  </div>
                  <div className={`${styles.detailRow} ${styles.rowReverse}`}>
                    <div className={styles.detailImage}>
                      <img src="/04.png" alt="Bảo quản và đóng gói" />
                    </div>
                    <div className={styles.detailContent}>
                      <h3 className={styles.detailRowTitle}>
                        ❄️ Bảo quản đông đá ngay tại tàu
                      </h3>
                      <p className={styles.detailRowText}>
                        Sau khi kéo lưới, hải sản được phân loại và ủ đá lạnh
                        hoặc cấp đông sâu ngay trong khoang tàu cá. Quy trình
                        đóng gói hút chân không kỹ lưỡng giúp ngăn ngừa vi khuẩn
                        và giữ chất lượng đạt chuẩn tươi sống.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Producer introduction section ── */}
            <div className={styles.producerCard}>
              <div className={styles.producerHeader}>
                <div className={styles.sectionTitleAccent} />
                <h2>Giới thiệu ngư dân</h2>
              </div>

              <div className={styles.producerBody}>
                <div className={styles.producerLeft}>
                  <div className={styles.producerAvatarLarge}>
                    {(product.sellerName || "?").charAt(0).toUpperCase()}
                  </div>
                  <h3>Ngư dân {product.sellerName}</h3>
                  <p>📍 Vùng biển: {product.origin || "Bản địa Việt Nam"}</p>
                  {product.sellerBadges && product.sellerBadges.length > 0 && (
                    <div className={styles.producerBadges}>
                      {product.sellerBadges.map((badge, idx) => (
                        <span key={idx} className={styles.producerBadge}>
                          🎖️ {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.producerRight}>
                  <h4 className={styles.producerQuote}>
                    "Khát vọng mang hải sản tươi sạch từ biển cả đến bàn ăn mọi
                    nhà"
                  </h4>
                  <p className={styles.producerBio}>
                    Là đối tác liên kết lâu năm của Haisan.vn, chúng tôi cam kết
                    đánh bắt có trách nhiệm, bảo vệ nguồn lợi thủy sản địa
                    phương. Các mẻ lưới được phân loại và xử lý cấp đông sâu
                    hoặc đóng đá lạnh ngay tại tàu cá cập cảng để giữ trọn vị
                    ngon tinh khiết nhất.
                  </p>
                  <div className={styles.producerStats}>
                    <div>
                      <strong>5.0 ★</strong>
                      <span>Đánh giá tin cậy</span>
                    </div>
                    <div>
                      <strong>100%</strong>
                      <span>Tươi ngon tự nhiên</span>
                    </div>
                    <div>
                      <strong>Đạt chuẩn</strong>
                      <span>An toàn vệ sinh</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Seasonal catch section ── */}
            <div className={styles.seasonalCard}>
              <div className={styles.producerHeader}>
                <div className={styles.sectionTitleAccent} />
                <h2>Mùa vụ đánh bắt của ngư thuyền</h2>
              </div>
              <div className={styles.seasonalGrid}>
                <div className={`${styles.seasonBox} ${styles.spring}`}>
                  <div className={styles.seasonTitle}>
                    🌸 Mùa xuân (Tháng 3 - 5)
                  </div>
                  <p>Cá trích, cá bóp, tôm thẻ, cá hồng, mực cơm</p>
                </div>
                <div className={`${styles.seasonBox} ${styles.summer}`}>
                  <div className={styles.seasonTitle}>
                    ☀️ Mùa hạ (Tháng 6 - 8)
                  </div>
                  <p>Tôm hùm, cá thu, ghẹ xanh, bạch tuộc, mực ống</p>
                </div>
                <div className={`${styles.seasonBox} ${styles.autumn}`}>
                  <div className={styles.seasonTitle}>
                    🍂 Mùa thu (Tháng 9 - 11)
                  </div>
                  <p>Cua gạch, cá cơm khô, sò điệp, mực lá, tôm sú</p>
                </div>
                <div className={`${styles.seasonBox} ${styles.winter}`}>
                  <div className={styles.seasonTitle}>
                    ❄️ Mùa đông (Tháng 12 - 2)
                  </div>
                  <p>
                    Cá ngừ đại dương, cá mú, cua huỳnh đế, bạch tuộc mắt tre
                  </p>
                </div>
              </div>
            </div>

            {/* ── Shipment schedule section ── */}
            <div className={styles.scheduleCard}>
              <div className={styles.producerHeader}>
                <div className={styles.sectionTitleAccent} />
                <h2>Lịch trình & Giao hàng dự kiến</h2>
              </div>
              <p className={styles.scheduleDesc}>
                Lịch trình đi biển và chuẩn bị đơn hàng của ngư thuyền trong
                tuần này. Giao hàng nhanh từ 24h - 48h sau khi thuyền cập cảng.
              </p>
              <div className={styles.tableWrapper}>
                <table className={styles.scheduleTable}>
                  <thead>
                    <tr>
                      <th>Ngư thuyền / Hộ đánh bắt</th>
                      {next7Days.map((d, i) => (
                        <th key={i}>{d.dateStr}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.fishermanName}>
                        🚢 Ngư thuyền {product.sellerName}
                      </td>
                      {next7Days.map((d, i) => (
                        <td key={i} className={styles.statusCell}>
                          <span style={{ color: "#208f67" }}>✅</span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Quality commitment banner ── */}
            <div className={styles.commitmentBanner}>
              🛡️ CAM KẾT CHẤT LƯỢNG: GIÁ HIỂN THỊ LÀ GIÁ TRỌN GÓI ĐÃ BAO GỒM VAT
              & MIỄN PHÍ VẬN CHUYỂN TOÀN QUỐC!
            </div>

            {/* ── Reviews ── */}
            {product?.sellerId && (
              <ReviewList
                sellerId={product.sellerId}
                productId={product.id}
                user={user}
                scrollToReviewId={product.scrollToReviewId}
              />
            )}

            {/* ── Report Modal ── */}
            {showReportModal && (
              <div
                className={styles.modalOverlay}
                onClick={() => setShowReportModal(false)}
              >
                <div
                  className={styles.modalCard}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#0f172a",
                      marginBottom: 8,
                    }}
                  >
                    🚩 Báo cáo sản phẩm
                  </h3>
                  {reportSent ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "24px 0",
                        color: "#10b981",
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      ✅ Đã gửi báo cáo. Xin cảm ơn!
                    </div>
                  ) : (
                    <>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#64748b",
                          margin: "0 0 16px",
                        }}
                      >
                        Vui lòng mô tả lý do bạn muốn báo cáo sản phẩm này.
                      </p>
                      <textarea
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder="Mô tả lý do báo cáo..."
                        style={{
                          width: "100%",
                          minHeight: 110,
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: "1.5px solid #e2e8f0",
                          fontFamily: "inherit",
                          fontSize: 14,
                          resize: "vertical",
                          marginBottom: 16,
                          boxSizing: "border-box",
                          transition: "border-color 0.2s",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "#0b4f6c")
                        }
                        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                      />
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => setShowReportModal(false)}
                          style={{
                            flex: 1,
                            padding: "11px 0",
                            borderRadius: 10,
                            border: "1.5px solid #e2e8f0",
                            background: "#fff",
                            color: "#64748b",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            fontSize: 14,
                            transition: "all 0.2s",
                          }}
                        >
                          Huỷ
                        </button>
                        <button
                          onClick={handleReport}
                          disabled={reportLoading || !reportReason.trim()}
                          style={{
                            flex: 1,
                            padding: "11px 0",
                            borderRadius: 10,
                            border: "none",
                            background:
                              "linear-gradient(135deg, #ef4444, #dc2626)",
                            color: "#fff",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            fontSize: 14,
                            opacity: reportLoading ? 0.7 : 1,
                            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
                          }}
                        >
                          {reportLoading ? "Đang gửi…" : "Gửi báo cáo"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
