// Import hook useState từ thư viện React để quản lý các trạng thái nội bộ của component
import { useState } from "react";
// Import bảng màu theme C từ thư mục tiện ích utils/theme
import { C } from "../utils/theme";
// Import helper api để gửi yêu cầu API
import { api } from "../services/api";
// Import hook useAuth từ AuthContext để lấy thông tin tài khoản người dùng đăng nhập hiện tại
import { useAuth } from "../context/AuthContext";
// Import hook useToast từ ToastContext để hiển thị thông báo toast nhỏ trên màn hình
import { useToast } from "../context/ToastContext";
// Import component VerifiedBadge hiển thị huy hiệu xác minh tài khoản
import { VerifiedBadge } from "./VerifiedBadge";
// Import hook useViewTransitionNavigate để chuyển hướng trang có hiệu ứng mượt mà
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";

// Định nghĩa và export component FishermanProfileHeader để hiển thị phần đầu trang cá nhân ngư dân
export function FishermanProfileHeader({ profile, isLoading, sellerId }) {
  // Lấy ra thông tin user từ context xác thực
  const { user } = useAuth();
  // Khởi tạo helper thông báo toast
  const toast = useToast();
  // Khởi tạo hàm điều hướng trang
  const navigate = useViewTransitionNavigate();
  // Khởi tạo state isFollowing lưu trạng thái đã theo dõi ngư dân này hay chưa (boolean)
  const [isFollowing, setIsFollowing] = useState(false);
  // Khởi tạo state togglingFollow kiểm soát quá trình gửi API bật/tắt theo dõi nhằm tránh click liên tục
  const [togglingFollow, setTogglingFollow] = useState(false);

  // Kiểm tra xem trang cá nhân đang xem có phải là của chính người dùng hiện tại đang đăng nhập hay không
  const isOwnProfile =
    user && (user.userId === sellerId || user.id === sellerId);

  // Xử lý sự kiện khi click nút Theo dõi/Bỏ theo dõi ngư dân
  const handleToggleFollow = async () => {
    // Nếu người dùng chưa đăng nhập, hiển thị cảnh báo và dừng thực thi
    if (!user) {
      toast.warn("Vui lòng đăng nhập để theo dõi!");
      return;
    }
    // Nếu là trang cá nhân của chính mình, hiển thị cảnh báo và dừng thực thi
    if (isOwnProfile) {
      toast.warn("Bạn không thể tự theo dõi chính mình!");
      return;
    }
    // Đặt trạng thái đang chuyển đổi theo dõi là true để vô hiệu hóa nút bấm tạm thời
    setTogglingFollow(true);
    try {
      // Gửi yêu cầu POST lên server để đảo ngược trạng thái theo dõi
      const res = await api(`/follows/${sellerId}/toggle`, { method: "POST" });
      // Cập nhật trạng thái theo dõi mới trả về từ API
      setIsFollowing(res.isFollowing);
      // Hiển thị thông báo thành công từ máy chủ
      toast.success(res.message);
    } catch (e) {
      // Nếu có lỗi, hiển thị thông báo lỗi lên giao diện
      toast.error(e.message);
    } finally {
      // Cuối cùng khôi phục trạng thái togglingFollow về false để cho phép bấm lại
      setTogglingFollow(false);
    }
  };

  // ── Skeleton loading (Giao diện chờ hiển thị khi đang tải dữ liệu hoặc chưa có profile) ──
  if (isLoading || !profile) {
    return (
      <div
        style={{
          background: C.white, // Nền trắng
          borderRadius: 20, // Bo tròn viền 20px
          border: `1px solid ${C.border}`, // Đường viền mảnh màu mặc định
          overflow: "hidden", // Ẩn nội dung bị tràn ra ngoài
          marginBottom: 28, // Khoảng cách cách khối phía dưới
        }}
      >
        {/* Khung xương banner phía trên */}
        <div className="skeleton-shimmer" style={{ height: 110 }} />
        {/* Khung xương phần thông tin phía dưới */}
        <div style={{ padding: "44px 28px 24px" }}>
          {/* Dòng tên người bán giả lập */}
          <div
            className="skeleton-shimmer"
            style={{
              width: 200,
              height: 24,
              borderRadius: 6,
              marginBottom: 12,
            }}
          />
          {/* Lưới các thẻ thống kê giả lập */}
          <div style={{ display: "flex", gap: 16 }}>
            {/* Tạo vòng lặp 5 phần tử để hiển thị các thẻ stat skeleton */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer"
                style={{ width: 80, height: 60, borderRadius: 12 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Giải nén thông tin tài khoản người bán (sellerUser) và các thống kê (stats) từ đối tượng profile
  const { user: sellerUser, stats } = profile;

  // Định nghĩa mảng lưu trữ cấu hình cho các thẻ thống kê hoạt động của ngư dân
  const statCards = [
    { emoji: "📦", value: stats.activeProducts, label: "Đang bán" },
    { emoji: "🍳", value: stats.totalRecipes, label: "Công thức" },
    { emoji: "💬", value: stats.totalPosts, label: "Cộng đồng" },
    { emoji: "⛵", value: stats.totalBoatLogs, label: "Nhật ký" },
    { emoji: "👥", value: stats.followersCount, label: "Theo dõi" },
    {
      emoji: "⭐",
      // Định dạng hiển thị điểm đánh giá trung bình với 1 chữ số thập phân, nếu bằng 0 hiển thị dấu gạch ngang
      value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—",
      label: `(${stats.ratingCount} đg)`, // Nhãn phụ hiển thị số lượt đánh giá
    },
  ];

  return (
    <div
      // Khung chứa header profile chính
      style={{
        background: C.white, // Nền trắng sáng
        borderRadius: 20, // Bo góc viền 20px
        border: `1px solid ${C.border}`, // Viền ngoài màu mặc định nhẹ
        overflow: "hidden", // Ẩn nội dung tràn góc bo tròn
        marginBottom: 28, // Cách phía dưới 28px
        boxShadow: "0 10px 25px -5px rgba(11, 79, 108, 0.04)", // Đổ bóng nhẹ thẩm mỹ
      }}
    >
      {/* Khối Banner với màu gradient xanh dương */}
      <div
        style={{
          height: 110, // Chiều cao banner 110px
          background: "linear-gradient(135deg, #0B4F6C 0%, #1A7FA0 100%)", // Nền gradient chuyển sắc từ xanh đậm sang nhạt
          position: "relative", // Đặt relative để làm gốc căn vị trí tuyệt đối cho avatar
        }}
      >
        {/* Khung chứa ảnh đại diện hình tròn đặt đè lên viền banner */}
        <div
          style={{
            position: "absolute", // Định vị tuyệt đối
            bottom: -28, // Đẩy lồi xuống dưới viền banner 28px
            left: 28, // Cách mép trái banner 28px
            width: 68, // Chiều rộng avatar 68px
            height: 68, // Chiều cao avatar 68px
            borderRadius: "50%", // Bo tròn hoàn hảo
            border: "3px solid #fff", // Đường viền trắng dày 3px để phân tách với banner
            overflow: "hidden", // Ẩn ảnh thừa ngoài vòng tròn
            zIndex: 3, // Nổi lên trên lớp banner
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)", // Đổ bóng chân thực
          }}
        >
          {/* Nếu có ảnh đại diện thì hiển thị thẻ img, ngược lại hiển thị ký tự đầu viết hoa trên nền cam */}
          {sellerUser.avatar ? (
            <img
              src={sellerUser.avatar}
              alt={sellerUser.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #E8643A, #D94E21)", // Nền gradient màu cam đất nổi bật
                display: "flex", // Bố cục flex
                alignItems: "center", // Căn giữa dọc
                justifyContent: "center", // Căn giữa ngang
                fontSize: 28, // Cỡ chữ viết tắt lớn
                color: "#fff", // Chữ màu trắng
                fontWeight: 800, // Định dạng in cực đậm
              }}
            >
              {sellerUser.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Phần thông tin chi tiết của người bán */}
      <div style={{ padding: "44px 28px 24px" }}>
        <div
          style={{
            display: "flex", // Thiết lập flexbox
            justifyContent: "space-between", // Đẩy thông tin sang trái và các nút bấm sang phải
            alignItems: "flex-start", // Căn thẳng hàng ở đỉnh của mỗi khối con
            flexWrap: "wrap", // Cho phép rớt dòng khi màn hình nhỏ
            gap: 16, // Khoảng cách giữa thông tin và nút bấm
          }}
        >
          {/* Cột Tên, huy hiệu và ngày đăng ký */}
          <div>
            {/* Tên người bán */}
            <h1
              style={{
                margin: "0 0 6px", // Loại bỏ margin mặc định, giữ khoảng cách dưới 6px
                fontSize: 22, // Cỡ chữ lớn 22px
                fontWeight: 800, // Chữ in siêu đậm
                color: C.dark, // Màu chữ tối sẫm
                display: "flex", // Bố cục flex
                alignItems: "center", // Căn giữa chữ và badges
                gap: 8, // Khoảng cách giữa các thành phần 8px
                flexWrap: "wrap", // Cho rớt dòng khi quá chật
              }}
            >
              {sellerUser.name}
              {/* Hiển thị huy hiệu VerifiedBadge nếu tài khoản đã được Admin xác minh */}
              {sellerUser.isVerified && <VerifiedBadge size="md" showLabel />}
              {/* Hiển thị vương miện nếu là thành viên Premium */}
              {sellerUser.isPremium && (
                <span title="Thành viên Premium" style={{ fontSize: 18 }}>
                  👑
                </span>
              )}
            </h1>

            {/* Dòng danh sách huy hiệu */}
            {sellerUser.badges?.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                {/* Duyệt qua từng huy hiệu đạt được */}
                {sellerUser.badges.map((b, i) => (
                  <span
                    key={i}
                    style={{
                      background: "#F0FDF4", // Nền xanh lá nhạt
                      border: "1px solid #99F6E4", // Viền ngọc bích nhạt
                      color: "#0F766E", // Chữ ngọc bích đậm
                      borderRadius: 6, // Bo góc viền 6px
                      padding: "2px 8px", // Đệm trong nhỏ
                      fontSize: 11, // Cỡ chữ 11px
                      fontWeight: 700, // Chữ in đậm
                    }}
                  >
                    🎖️ {b}
                  </span>
                ))}
              </div>
            )}

            {/* Ngày tham gia hệ thống */}
            {sellerUser.memberSince && (
              <div style={{ fontSize: 12, color: C.muted }}>
                Thành viên từ{" "}
                {/* Định dạng ngày tham gia thành dạng: Tháng X năm Y theo tiếng Việt */}
                {new Date(sellerUser.memberSince).toLocaleDateString("vi-VN", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}
          </div>

          {/* Cột các nút bấm hành động */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {/* Nếu là trang của chính mình thì hiện nút chỉnh sửa, ngược lại hiện nút theo dõi */}
            {isOwnProfile ? (
              <button
                onClick={() => navigate("/profile")} // Click chuyển hướng sang trang sửa thông tin cá nhân
                style={{
                  padding: "10px 20px", // Đệm trong nút bấm
                  borderRadius: 10, // Bo góc viền nút 10px
                  border: `1px solid ${C.border}`, // Viền xám
                  background: C.white, // Nền trắng
                  color: C.text, // Màu chữ mặc định
                  fontWeight: 700, // Chữ in đậm
                  fontSize: 13, // Cỡ chữ 13px
                  cursor: "pointer", // Con trỏ pointer
                  fontFamily: "inherit",
                }}
              >
                ✏️ Chỉnh sửa hồ sơ
              </button>
            ) : (
              <button
                onClick={handleToggleFollow} // Bật/tắt theo dõi người bán
                disabled={togglingFollow} // Vô hiệu hóa nút khi đang xử lý API
                style={{
                  padding: "10px 20px", // Đệm nút bấm
                  borderRadius: 10, // Bo góc viền nút 10px
                  // Màu nền: nếu đã theo dõi thì màu xám nhạt, nếu chưa thì nền gradient xanh dương
                  background: isFollowing
                    ? "rgba(11,79,108,0.08)"
                    : `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
                  color: isFollowing ? C.ocean : "#fff", // Màu chữ: ocean nếu đã theo dõi, trắng nếu chưa
                  fontWeight: 700, // Chữ in đậm
                  fontSize: 13, // Cỡ chữ 13px
                  cursor: "pointer", // Con trỏ chuột pointer
                  fontFamily: "inherit",
                  // Viền: nếu đã theo dõi thì viền xanh ocean mảnh, nếu chưa thì không viền
                  border: isFollowing ? `1.5px solid ${C.ocean}` : "none",
                }}
              >
                {/* Nhãn văn bản thay đổi tùy theo trạng thái loading và theo dõi */}
                {togglingFollow
                  ? "..."
                  : isFollowing
                    ? "✅ Đang theo dõi"
                    : "+ Theo dõi ngư dân"}
              </button>
            )}
          </div>
        </div>

        {/* Lưới các thẻ chỉ số thống kê kết quả hoạt động */}
        <div
          style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}
        >
          {/* Duyệt qua từng chỉ số trong mảng statCards để render ra thẻ giao diện tương ứng */}
          {statCards.map((s) => (
            <div
              key={s.label}
              style={{
                textAlign: "center", // Căn giữa chữ
                padding: "10px 16px", // Đệm trong thẻ stat rộng rãi
                background: "#F8FAFC", // Nền xám lam rất nhẹ
                borderRadius: 12, // Bo tròn viền 12px
                border: `1px solid ${C.border}`, // Đường viền mảnh màu nhẹ mặc định
                minWidth: 72, // Chiều rộng tối thiểu 72px để các ô đồng đều
              }}
            >
              {/* Emoji đại diện cho thống kê */}
              <div style={{ fontSize: 20, marginBottom: 2 }}>{s.emoji}</div>
              {/* Giá trị số lượng thống kê */}
              <div
                style={{
                  fontSize: 18, // Cỡ số lớn
                  fontWeight: 800, // Nét số rất dày
                  color: C.dark, // Màu số tối sẫm
                  lineHeight: 1, // Line-height bằng 1
                }}
              >
                {s.value}
              </div>
              {/* Nhãn mô tả bên dưới số lượng */}
              <div
                style={{
                  fontSize: 10, // Cỡ chữ siêu nhỏ
                  color: C.muted, // Màu chữ mờ xám
                  fontWeight: 600, // Chữ bán đậm
                  marginTop: 3, // Khoảng cách nhỏ với số phía trên
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
