// Import các React Hook dùng quản lý state, memoization tối ưu hóa hiệu suất
import { useState, useCallback, memo } from "react";
// Import hook useNavigate để điều hướng trang trong react-router-dom
import { useNavigate } from "react-router-dom";
// Import hàm định dạng tiền tệ vnd từ file tiện ích format
import { fmt } from "../utils/format";
// Import hook useCountdown để tính thời gian đếm ngược còn lại của cá tươi
import { useCountdown } from "../hooks/useCountdown";
// Import component VerifiedBadge hiển thị huy hiệu xác minh người bán
import { VerifiedBadge } from "./VerifiedBadge";
// Import helper api để thực hiện gửi yêu cầu HTTP
import { api } from "../services/api";
// Import hàm tối ưu ảnh cloudinary
import { cardImage } from "../utils/cloudinary";
// Import các icon SVG hiển thị biểu tượng trái tim, cân nặng, mắt xem, đồng hồ
import { HeartIcon, WeightIcon, EyeIcon, ClockIcon } from "./icons";
// Import CSS module chứa style riêng của thẻ sản phẩm
import styles from "./ProductCard.module.css";

// Định nghĩa và xuất component CountdownBadge hiển thị thời hạn độ tươi ngon, bọc trong React.memo để tránh re-render thừa thãi
export const CountdownBadge = memo(function CountdownBadge({ catchTime }) {
  // Sử dụng hook useCountdown tính toán thời gian đếm ngược còn lại
  const rem = useCountdown(catchTime);
  // Nếu không có thời gian còn lại (hoặc lỗi), không hiển thị gì cả
  if (!rem) return null;

  // Kiểm tra xem đã hết thời hạn cá tươi ngon hay chưa
  const expired = rem === "Hết hạn";

  // Phân tích chuỗi thời gian còn lại: lấy số giờ trước ký tự 'h' để phân loại khẩn cấp (dưới 5 tiếng)
  const hoursRemaining =
    rem && !expired ? parseInt(rem.split("h")[0], 10) : 999;
  // Thiết lập mức khẩn cấp nếu thời gian tươi còn lại dưới 5 tiếng
  const urgent = !expired && hoursRemaining < 5;

  // Xác định kiểu màu sắc tương ứng: Hết hạn thì màu đỏ nhạt, Khẩn cấp thì màu đỏ cam, Bình thường thì màu vàng mật ong
  const colorStyle = expired
    ? { background: "#fee2e2", color: "#991b1b" }
    : urgent
      ? { background: "#fecaca", color: "#dc2626" }
      : { background: "#fffbeb", color: "#b45309" };

  return (
    // Trả về thẻ huy hiệu đếm ngược
    <span className={styles.countdownBadge} style={colorStyle}>
      {/* Icon đồng hồ nhỏ */}
      <ClockIcon size={12} />
      {/* Chuỗi văn bản hiển thị thời gian còn lại */}
      {rem}
    </span>
  );
});

// Định nghĩa và export component ProductCard bọc trong React.memo để ghi nhớ tối ưu hóa render
export const ProductCard = memo(
  function ProductCard({
    product, // Đối tượng sản phẩm
    onClick, // Callback tùy chỉnh khi click vào card
    onSellerClick, // Callback tùy chỉnh khi click vào tên người bán
    favoriteIds, // Danh sách ID các sản phẩm yêu thích của người dùng
    onFavoriteChange, // Callback kích hoạt khi trạng thái yêu thích thay đổi
    user, // Đối tượng người dùng đang đăng nhập
    cardIndex = 0, // Chỉ số của card trong danh sách (dùng cho hiệu ứng animation trễ)
  }) {
    // Khởi tạo điều hướng trang
    const navigate = useNavigate();

    // Định nghĩa callback xử lý click vào card sản phẩm để đi tới trang chi tiết
    const handleClick = useCallback(() => {
      // Nếu có prop onClick truyền từ ngoài thì gọi nó, ngược lại tự điều hướng đi đến trang sản phẩm chi tiết
      if (onClick) onClick(product.id);
      else navigate(`/san-pham/${product.id}`);
    }, [onClick, product.id, navigate]);

    // Định nghĩa callback xử lý click vào người bán
    const handleSellerClick = useCallback(
      (e) => {
        // Ngăn chặn sự kiện click lan ra ngoài thẻ card cha
        e.stopPropagation();
        // Nếu có prop onSellerClick truyền vào thì gọi nó, ngược lại điều hướng đến trang cá nhân của ngư dân bán hàng
        if (onSellerClick) onSellerClick(e);
        else navigate(`/nguoi-ban/${product.sellerId}`);
      },
      [onSellerClick, product.sellerId, navigate],
    );

    // Xác định xem sản phẩm này đã được lưu yêu thích hay chưa dựa vào mảng favoriteIds
    const isFav = favoriteIds?.includes(product.id) ?? false;
    // Khởi tạo state favLoading kiểm soát quá trình gửi yêu cầu yêu thích lên API
    const [favLoading, setFavLoading] = useState(false);
    // Khởi tạo state localFav lưu trạng thái yêu thích cục bộ để cập nhật giao diện lập tức trước khi API hoàn tất
    const [localFav, setLocalFav] = useState(null);
    // Khởi tạo state popKey để tạo key ảo phục vụ hiệu ứng pulse nhảy tim khi click yêu thích
    const [popKey, setPopKey] = useState(0);
    // Trạng thái yêu thích hiện thời: ưu tiên lấy state cục bộ, nếu null thì lấy từ mảng favoriteIds truyền xuống
    const currentFav = localFav !== null ? localFav : isFav;

    // Callback xử lý khi người dùng click nút trái tim yêu thích sản phẩm
    const toggleFav = useCallback(
      async (e) => {
        // Ngăn sự kiện click lan truyền lên card làm kích hoạt xem chi tiết
        e.stopPropagation();
        // Nếu chưa đăng nhập, bắt buộc chuyển hướng người dùng sang trang đăng nhập
        if (!user) {
          navigate("/dang-nhap");
          return;
        }
        // Khóa nút bấm yêu thích bằng cách đặt loading là true
        setFavLoading(true);
        try {
          // Gửi yêu cầu POST lên API để đảo trạng thái lưu sản phẩm yêu thích
          const res = await api(`/favorites/${product.id}`, { method: "POST" });
          // Cập nhật trạng thái yêu thích cục bộ từ kết quả trả về của Backend
          setLocalFav(res.favorited);
          // Tăng key ảo để kích hoạt animation giật tim nếu được yêu thích thành công
          if (res.favorited) setPopKey((k) => k + 1);
          // Gọi callback báo cho component cha biết sự thay đổi trạng thái yêu thích
          onFavoriteChange?.(product.id, res.favorited);
        } catch {
          /* Bỏ qua lỗi im lặng */
        } finally {
          // Mở khóa nút bấm yêu thích
          setFavLoading(false);
        }
      },
      [user, product.id, onFavoriteChange, navigate],
    );

    // Callback xử lý click vào nút CTA 'Xem chi tiết' ở chân card
    const handleCtaClick = useCallback(
      (e) => {
        // Ngăn chặn sự kiện nổi bọt
        e.stopPropagation();
        // Thực thi hàm click xem chi tiết sản phẩm
        handleClick();
      },
      [handleClick],
    );

    // Thiết lập style màu nền và màu chữ cho nhãn phân loại: Tươi (Fresh) hay Khô (Dried)
    const typeBadgeStyle =
      product.type === "Fresh"
        ? { background: "rgba(14, 165, 233, 0.2)", color: "#7dd3fc" }
        : { background: "rgba(251, 191, 36, 0.2)", color: "#fcd34d" };
    // Đặt tên nhãn chữ
    const typeLabel = product.type === "Fresh" ? "Tươi" : "Khô";

    // Tính toán phần trăm trọng lượng còn lại của mẻ hải sản
    const pct = Math.round(
      (product.remainingWeight / product.totalWeight) * 100,
    );
    // Xác định màu sắc thanh phần trăm tồn kho: lớn hơn 50% xanh lá, trên 20% màu cam, dưới 20% màu đỏ
    const stockColor = pct > 50 ? "#10b981" : pct > 20 ? "#f59e0b" : "#ef4444";
    // Lấy URL ảnh sản phẩm đã được tối ưu hóa qua Cloudinary
    const optimizedImg = cardImage(product.coverImg);

    // Xây dựng dòng mô tả ngắn gọn hiển thị tối đa 120 ký tự kèm dấu ba chấm nếu bị cắt bớt
    const shortDesc = product.description
      ? product.description.slice(0, 120) +
        (product.description.length > 120 ? "…" : "")
      : `Hải sản tươi sống ${product.remainingWeight}kg, đánh bắt tự nhiên từ vùng biển ${product.origin || "Việt Nam"}.`;

    return (
      <div
        // Gán class CSS module cho container thẻ card
        className={styles.card}
        // Click vào card để xem chi tiết hải sản
        onClick={handleClick}
        // Truyền biến CSS custom --card-i để thiết lập độ trễ animation tăng dần cho hiệu ứng xuất hiện
        style={{ "--card-i": Math.min(cardIndex, 15) }}
      >
        {/* ── Phần Hình ảnh sản phẩm ── */}
        <div className={styles.imageWrap}>
          {/* Nhóm các nhãn tags hiển thị trên ảnh */}
          <div className={styles.badgeGroup}>
            {/* Nhãn loại hải sản Tươi/Khô */}
            <span className={styles.badge} style={typeBadgeStyle}>
              {typeLabel}
            </span>
            {/* Nhãn hiển thị nếu bán Sỉ */}
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

          {/* Nút bấm Lưu yêu thích (Trái tim) ở góc trên ảnh */}
          <button
            key={currentFav ? `fav-${popKey}` : "unfav"} // Sử dụng key động để reset phần tử DOM và chạy lại animation pulse
            className={`${styles.favBtn} ${currentFav ? styles.favorited : ""}`} // Gán class CSS phù hợp trạng thái yêu thích
            onClick={toggleFav} // Click để bật tắt yêu thích
            disabled={favLoading} // Vô hiệu hóa nút khi đang tải API
            aria-label="Lưu yêu thích" // Thuộc tính accessibility
          >
            {/* Render icon trái tim */}
            <HeartIcon size={14} filled={currentFav} />
          </button>

          {/* Ảnh sản phẩm thực tế hoặc ảnh placeholder cá dự phòng */}
          {optimizedImg ? (
            <img
              src={optimizedImg} // Đường dẫn ảnh tối ưu hóa Cloudinary
              alt={product.name} // Tên hải sản
              loading="lazy" // Thiết lập tải ảnh lazy loading để tăng tốc độ tải trang ban đầu
              className={styles.image} // Class CSS ảnh sản phẩm
            />
          ) : (
            // Nếu không có ảnh hiển thị biểu tượng con cá dự phòng
            <div className={styles.imagePlaceholder}>🐟</div>
          )}
          {/* Lớp phủ gradient mờ trên ảnh */}
          <div className={styles.imageOverlay} />

          {/* Khối hiển thị Avatar và tên người bán đè lên mép dưới của ảnh */}
          <div className={styles.sellerOverlay}>
            {/* Vòng tròn hiển thị chữ cái đầu tên người bán đóng vai trò avatar */}
            <button
              className={styles.sellerAvatarCircle}
              onClick={handleSellerClick} // Click để vào trang người bán
            >
              {(product.sellerName || "?").charAt(0).toUpperCase()}
            </button>
            {/* Tên người bán kèm các huy hiệu xác minh/premium */}
            <button
              className={styles.sellerOverlayName}
              onClick={handleSellerClick} // Click để vào trang ngư dân
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              {product.sellerName}
              {/* Huy hiệu dấu tích xanh xác minh người bán */}
              {product.sellerIsVerified && <VerifiedBadge />}
              {/* Biểu tượng vương miện nếu là người bán gói Premium */}
              {product.sellerIsPremium ? (
                <span title="Premium" style={{ fontSize: 11 }}>
                  👑
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* ── Phần thân nội dung chi tiết phía dưới ảnh ── */}
        <div className={styles.body}>
          {/* Hàng 1: Tên hải sản & Đơn giá bán */}
          <div className={styles.titlePriceRow}>
            {/* Tên hải sản */}
            <h3 className={styles.name}>{product.name}</h3>
            {/* Đơn giá */}
            <div className={styles.price}>
              {fmt(product.price)}
              <span className={styles.priceUnit}>/kg</span>
            </div>
          </div>

          {/* Hàng 2: Mô tả tóm tắt ngắn gọn */}
          <div className={styles.descSnippet}>{shortDesc}</div>

          {/* Hàng 3: Các thông số trọng lượng, lượt xem và đếm ngược tươi ngon */}
          <div className={styles.metaRow}>
            {/* Số kg còn lại & số lượt xem */}
            <div className={styles.statsRow}>
              {/* Trọng lượng còn lại */}
              <span className={styles.statItem}>
                <WeightIcon size={12} />
                <strong className={styles.statValue}>
                  {product.remainingWeight} kg
                </strong>
              </span>
              {/* Lượt xem sản phẩm (chỉ hiển thị nếu lớn hơn 0) */}
              {product.viewCount > 0 && (
                <span className={styles.statItem}>
                  <EyeIcon size={12} />
                  {product.viewCount}
                </span>
              )}
            </div>

            {/* Bộ đếm ngược thời gian tươi ngon (chỉ hiển thị nếu là sản phẩm Tươi 'Fresh' và có catchTime) */}
            {product.type === "Fresh" && product.catchTime && (
              <CountdownBadge catchTime={product.catchTime} />
            )}
          </div>

          {/* Thanh phần trăm trượt thể hiện tỉ lệ hàng còn lại trong kho */}
          <div className={styles.stockBar}>
            <div
              className={styles.stockFill}
              // Sử dụng scaleX để thu hẹp/mở rộng thanh tiến trình theo tỉ lệ pct % và tô màu cảnh báo stockColor tương ứng
              style={{
                transform: `scaleX(${Math.min(100, pct) / 100})`,
                background: stockColor,
              }}
            />
          </div>

          {/* Nút nhấn kêu gọi hành động xem chi tiết sản phẩm */}
          <button className={styles.ctaBtn} onClick={handleCtaClick}>
            🛒 Xem chi tiết
            <span className={styles.ctaArrow}>➔</span>
          </button>
        </div>
      </div>
    );
  },
  // Hàm so sánh tùy chỉnh cho React.memo để kiểm soát việc re-render: chỉ render lại khi sản phẩm, user, cardIndex hoặc trạng thái yêu thích thay đổi
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

// Định nghĩa và export component ProductSkeleton hiển thị hiệu ứng khung xương chờ tải cho thẻ sản phẩm
export function ProductSkeleton() {
  return (
    <div className={styles.skeleton}>
      {/* Khung xương hình ảnh mẻ cá */}
      <div
        className="skeleton-shimmer"
        style={{ height: 220, width: "100%", borderRadius: 10 }}
      />
      <div className={styles.skeletonBody}>
        {/* Khung xương tiêu đề tên sản phẩm */}
        <div
          className="skeleton-shimmer"
          style={{
            width: "75%",
            height: 14,
            borderRadius: 4,
            marginBottom: 10,
          }}
        />
        {/* Khung xương đơn giá */}
        <div
          className="skeleton-shimmer"
          style={{
            width: "45%",
            height: 18,
            borderRadius: 4,
            marginBottom: 10,
          }}
        />
        {/* Khung xương dòng mô tả */}
        <div
          className="skeleton-shimmer"
          style={{
            width: "100%",
            height: 10,
            borderRadius: 4,
            marginBottom: 8,
          }}
        />
        {/* Khung xương thanh phần trăm hàng tồn kho */}
        <div
          className="skeleton-shimmer"
          style={{
            width: "100%",
            height: 3,
            borderRadius: 99,
            marginBottom: 12,
          }}
        />
        {/* Khung xương nút bấm xem chi tiết */}
        <div
          className="skeleton-shimmer"
          style={{ width: "100%", height: 34, borderRadius: 8 }}
        />
      </div>
    </div>
  );
}
