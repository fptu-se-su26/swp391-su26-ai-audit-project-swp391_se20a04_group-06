// Import đối tượng chứa cấu hình bảng màu theme C từ utils/theme
import { C } from "../utils/theme";
// Import hook useViewTransitionNavigate để chuyển hướng trang có hiệu ứng mượt mà
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";

/**
 * FishermanCard
 * @param {object} fisherman - { id, name, avatar, isVerified, isPremium, badges,
 *                               activeProducts, avgRating, ratingCount }
 * @param {"compact"|"full"} size - compact = grid nhỏ (homepage), full = list card
 */
// Định nghĩa và export component FishermanCard dùng hiển thị thông tin thẻ ngư dân với cấu hình mặc định size là compact
export function FishermanCard({ fisherman, size = "compact" }) {
  // Khởi tạo hook điều hướng trang
  const navigate = useViewTransitionNavigate();
  // Giải nén các thuộc tính của đối tượng ngư dân (fisherman) để sử dụng trực tiếp trong component
  const {
    id, // ID tài khoản của ngư dân
    name, // Tên của ngư dân hoặc chủ hộ kinh doanh
    avatar, // URL hình ảnh đại diện của ngư dân
    isVerified, // Trạng thái tài khoản đã được Admin xác minh (boolean)
    isPremium, // Trạng thái gói dịch vụ Premium (boolean)
    badges = [], // Danh sách các huy hiệu/danh hiệu của ngư dân (mặc định mảng rỗng)
    activeProducts = 0, // Số lượng sản phẩm hải sản đang được mở bán trên hệ thống (mặc định là 0)
    avgRating = 0, // Điểm đánh giá trung bình từ khách hàng (mặc định là 0)
    ratingCount = 0, // Tổng số lượng lượt đánh giá (mặc định là 0)
  } = fisherman;

  // Kiểm tra xem ngư dân này có sản phẩm đang mở bán hay không
  const hasActive = activeProducts > 0;

  // Định nghĩa hàm click chuyển hướng người dùng đến trang hồ sơ người bán chi tiết
  const handleClick = () => navigate(`/nguoi-ban/${id}`);

  // ── Compact size (dạng thẻ card thu nhỏ dùng ở trang chủ HomePage grid) ────────────────
  if (size === "compact") {
    return (
      <div
        // Click vào thẻ card thực hiện chuyển sang trang chi tiết người bán
        onClick={handleClick}
        style={{
          display: "flex", // Thiết lập hiển thị flex
          flexDirection: "column", // Các phần tử con xếp theo hàng dọc
          alignItems: "center", // Căn giữa các con theo chiều ngang
          cursor: "pointer", // Đổi con trỏ chuột thành pointer khi di qua
          padding: "10px 12px", // Đệm lề trong thẻ card
          borderRadius: 12, // Bo góc viền thẻ card 12px
          border: `1px solid ${C.border}`, // Viền ngoài màu xám nhạt mặc định
          background: "#FAFAFA", // Nền xám cực nhạt
          transition: "all 0.22s ease", // Đặt hiệu ứng chuyển cảnh mượt mà
          textAlign: "center", // Căn chữ nằm chính giữa
          width: 110, // Thiết lập chiều rộng cố định 110px
        }}
        // Khi di chuột vào thẻ card: dịch lên trên 4px, tạo bóng mờ và đổi màu viền sang ocean
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
          e.currentTarget.style.borderColor = C.ocean;
        }}
        // Khi chuột rời đi: khôi phục vị trí, bóng mờ và màu viền mặc định
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = C.border;
        }}
      >
        {/* Khung chứa ảnh đại diện với vòng tròn gradient đặc sắc nếu có sản phẩm đang bán */}
        <div
          style={{
            width: 56, // Chiều rộng 56px
            height: 56, // Chiều cao 56px
            borderRadius: "50%", // Bo tròn tuyệt đối tạo hình tròn
            marginBottom: 8, // Khoảng cách cách tên phía dưới 8px
            padding: hasActive ? 3 : 2, // Đệm rộng hơn một chút nếu có vòng viền gradient
            // Nếu đang bán hải sản thì tô màu viền gradient dạng hoạt động Instagram, ngược lại tô màu border nhẹ mặc định
            background: hasActive
              ? "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #bc1888 100%)"
              : C.border,
            position: "relative", // Đặt relative làm gốc định vị cho biểu tượng ghim xác minh ở góc
            flexShrink: 0, // Không co rút kích thước avatar
          }}
        >
          {/* Lớp lót màu trắng bên trong vòng tròn avatar để tách biệt ảnh với viền gradient */}
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: "#fff",
              overflow: "hidden", // Ẩn các phần thừa của ảnh tràn ra ngoài
              display: "flex", // Bố cục flex
              alignItems: "center", // Căn giữa ảnh dọc
              justifyContent: "center", // Căn giữa ảnh ngang
            }}
          >
            {/* Nếu có avatar thật thì render thẻ img, ngược lại tạo khối tròn nền gradient chứa chữ cái đầu tiên của tên */}
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} // Cắt xén ảnh vừa vặn vòng tròn
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`, // Nền chuyển sắc xanh chủ đạo
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff", // Chữ cái màu trắng
                  fontWeight: 700, // Chữ in đậm
                  fontSize: 18, // Cỡ chữ lớn 18px
                }}
              >
                {/* Lấy ký tự đầu viết hoa của tên ngư dân */}
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {/* Huy hiệu dấu tích xác minh ở góc dưới phải avatar nếu tài khoản đã được xác minh */}
          {isVerified && (
            <div
              style={{
                position: "absolute", // Định vị tuyệt đối ở góc avatar
                bottom: 0, // Căn sát mép đáy
                right: 0, // Căn sát mép phải
                background: "#0284C7", // Nền màu xanh dương của Leaflet/Verified
                color: "#fff", // Màu dấu tích trắng
                borderRadius: "50%", // Bo tròn tuyệt đối
                width: 16, // Chiều rộng 16px
                height: 16, // Chiều cao 16px
                fontSize: 9, // Cỡ chữ dấu tích siêu nhỏ
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid #fff", // Viền trắng để làm nổi bật dấu tích trên nền avatar
                fontWeight: 700,
              }}
            >
              ✓
            </div>
          )}
        </div>

        {/* Khối hiển thị Tên ngư dân */}
        <span
          style={{
            fontSize: 11, // Cỡ chữ 11px
            fontWeight: 700, // Chữ in đậm
            color: C.dark, // Màu tối sẫm
            overflow: "hidden", // Ẩn văn bản thừa
            textOverflow: "ellipsis", // Thêm dấu ba chấm khi bị tràn
            whiteSpace: "nowrap", // Không cho xuống dòng
            width: "100%", // Chiều rộng chiếm hết khung chứa
            display: "block",
          }}
        >
          {/* Thêm biểu tượng vương miện nếu là ngư dân Premium */}
          {isPremium ? "👑 " : ""}
          {name}
        </span>

        {/* Khối thống kê số lượng sản phẩm và đánh giá thu nhỏ (nếu có sản phẩm đang mở bán) */}
        {activeProducts > 0 && (
          <span style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
            📦 {activeProducts}
            {/* Hiển thị sao đánh giá nếu điểm rating lớn hơn 0 */}
            {avgRating > 0 ? ` · ⭐ ${avgRating}` : ""}
          </span>
        )}
      </div>
    );
  }

  // ── Full size (Dạng thẻ danh sách chi tiết dùng ở FishermanListPage) ────────────────
  return (
    <div
      // Click vào card để chuyển hướng đến trang chi tiết ngư dân
      onClick={handleClick}
      style={{
        display: "flex", // Sử dụng flexbox sắp xếp các phần tử con nằm ngang
        alignItems: "center", // Căn giữa tất cả theo chiều dọc
        gap: 14, // Khoảng cách giữa avatar và khối thông tin là 14px
        padding: "16px 20px", // Khoảng đệm trong thẻ card rộng rãi
        background: C.white, // Nền trắng sáng
        borderRadius: 14, // Bo tròn viền thẻ card 14px
        border: `1px solid ${C.border}`, // Đường viền mảnh màu mặc định
        cursor: "pointer", // Con trỏ chuột pointer khi hover
        transition: "all 0.22s ease", // Đặt hiệu ứng chuyển đổi mượt mà
      }}
      // Khi di chuột vào: Đổi màu viền sang ocean và tạo bóng mờ nhẹ
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.ocean;
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(11,79,108,0.08)";
      }}
      // Khi chuột rời đi: Khôi phục lại viền và bóng mờ ban đầu
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Vòng tròn Avatar của ngư dân */}
      <div
        style={{
          width: 52, // Chiều rộng 52px
          height: 52, // Chiều cao 52px
          borderRadius: "50%", // Bo tròn tuyệt đối
          flexShrink: 0, // Không co rút
          padding: hasActive ? 2.5 : 2, // Đệm viền
          // Đặt viền gradient nếu có sản phẩm đang hoạt động, ngược lại để viền border nhẹ
          background: hasActive
            ? "linear-gradient(45deg, #f09433 0%, #dc2743 50%, #bc1888 100%)"
            : C.border,
        }}
      >
        {/* Lớp đệm trắng tách ảnh */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: "#fff",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Render ảnh đại diện nếu có, ngược lại render chữ cái viết tắt */}
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Khối chứa thông tin chữ bên phải */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Dòng tên và biểu tượng/vương miện/tích xác minh */}
        <div
          style={{
            fontWeight: 800, // Chữ in siêu đậm
            fontSize: 15, // Cỡ chữ 15px
            color: C.dark, // Màu tối sẫm
            display: "flex", // Bố cục flex
            alignItems: "center", // Căn giữa dọc
            gap: 6, // Khoảng cách giữa tên và các tag là 6px
            flexWrap: "wrap", // Cho phép rớt dòng các huy hiệu nếu thiếu chiều rộng
          }}
        >
          {/* Vương miện Premium */}
          {isPremium && <span>👑</span>}
          {/* Tên ngư dân */}
          {name}
          {/* Nhãn tích xác minh màu xanh dương */}
          {isVerified && (
            <span
              style={{
                background: "#0284C7", // Nền xanh dương
                color: "#fff", // Dấu tích trắng
                borderRadius: 4, // Bo góc viền nhỏ 4px
                padding: "1px 6px", // Đệm lề trong
                fontSize: 10, // Cỡ chữ siêu nhỏ
                fontWeight: 700,
              }}
            >
              ✓
            </span>
          )}
        </div>
        {/* Dòng hiển thị số lượng sản phẩm và sao rating */}
        <div
          style={{
            display: "flex",
            gap: 12,
            fontSize: 12,
            color: C.muted,
            marginTop: 3,
          }}
        >
          {activeProducts > 0 && <span>📦 {activeProducts} sản phẩm</span>}
          {avgRating > 0 && (
            <span>
              ⭐ {avgRating} ({ratingCount} đánh giá)
            </span>
          )}
        </div>
        {/* Danh sách các huy hiệu/danh hiệu đạt được hiển thị tối đa 2 huy hiệu */}
        {badges.length > 0 && (
          <div
            style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}
          >
            {badges.slice(0, 2).map((b, i) => (
              <span
                key={i}
                // Định dạng tag huy hiệu có nền xanh lá nhạt, viền lam nhạt và chữ ngọc bích đậm
                style={{
                  background: "#F0FDF4", // Nền xanh lá nhạt tươi mát
                  border: "1px solid #99F6E4", // Viền xanh ngọc lam nhạt
                  color: "#0F766E", // Màu chữ ngọc bích đậm
                  borderRadius: 4, // Bo góc 4px
                  padding: "2px 7px", // Khoảng đệm
                  fontSize: 10, // Cỡ chữ nhỏ 10px
                  fontWeight: 700, // Chữ in đậm
                }}
              >
                🎖️ {b}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dấu mũi tên đi tới ở góc phải card */}
      <span style={{ fontSize: 18, color: C.muted }}>›</span>
    </div>
  );
}
