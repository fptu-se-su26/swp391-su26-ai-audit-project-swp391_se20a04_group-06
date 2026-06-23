// Import đối tượng chứa các mã màu chủ đạo từ utils/theme
import { C } from "../utils/theme";
// Import hook useApiFetch để thực hiện các yêu cầu HTTP gọi API fetch dữ liệu
import { useApiFetch } from "../hooks/useApiFetch";
// Import component FishermanCard để hiển thị thông tin chi tiết từng ngư dân
import { FishermanCard } from "./FishermanCard";
// Import hook điều hướng có hỗ trợ View Transitions API để tạo hiệu ứng chuyển tiếp mượt mà
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";

// ── Hardcode fallback (Danh sách dữ liệu dự phòng được sử dụng khi gọi API thất bại hoặc rỗng) ──────
const HARDCODE_FALLBACK = [
  { id: null, img: "/n_ryo01.png", name: "Ngư dân ÁNH COCA", loc: "Côn Đảo" },
  { id: null, img: "/n_ryo02.png", name: "Tàu koko", loc: "Hạ Long" },
  {
    id: null,
    img: "/n_ryo03.png",
    name: "Hộ thuyền Kim Vinh",
    loc: "Vũng Tàu",
  },
  { id: null, img: "/n_ryo04.png", name: "HTX", loc: "Vịnh Bắc Bộ" },
  { id: null, img: "/n_ryo05.png", name: "Tàu a", loc: "Sông Đốc" },
  { id: null, img: "/n_ryo06.png", name: "Tàu aa", loc: "Phu Quoc" },
  { id: null, img: "/n_ryo07.png", name: "Đầm hào aa", loc: "Nha Trang" },
  { id: null, img: "/n_ryo08.png", name: "Tàu aa", loc: "Phan Thiết" },
  { id: null, img: "/n_ryo09.png", name: "Thủy sản Ki", loc: "Cát Bà" },
  { id: null, img: "/n_ryo10.png", name: "HTX A", loc: "Kê Gà" },
  { id: null, img: "/n_ryo11.png", name: "Tàu s", loc: "Vân Đồn" },
  { id: null, img: "/n_ryo12.png", name: "Thủy sản Ks", loc: "Cửa Lò" },
  { id: null, img: "/n_ryo13.png", name: "Tàu Sho", loc: "Vũng Tàu" },
  { id: null, img: "/n_ryo14.png", name: "Tàu câu xa", loc: "Đà Nẵng" },
  { id: null, img: "/n_ryo15.png", name: "HTX Lý Sơn", loc: "Quảng Ngãi" },
  { id: null, img: "/n_ryo16.png", name: "Thủy sản", loc: "Vịnh Hạ Long" },
  { id: null, img: "/n_ryo17.png", name: "Tàu mimi", loc: "Đồ Sơn" },
];

// Định nghĩa component hiển thị lưới dữ liệu giả lập dự phòng trong trường hợp xảy ra sự cố API
function HardcodeFallbackGrid() {
  // Khởi tạo hàm điều hướng trang
  const navigate = useViewTransitionNavigate();
  return (
    <div
      // Tạo khung flexbox co giãn tự động xuống dòng khi thiếu không gian, khoảng cách cách 12px
      style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}
    >
      {/* Duyệt qua từng đối tượng ngư dân trong danh sách dự phòng */}
      {HARDCODE_FALLBACK.map((item, i) => (
        <div
          // Đặt mã khóa React duy nhất cho mỗi item
          key={i}
          // Lắng nghe sự kiện click chuột để chuyển hướng đến trang danh mục ngư dân "/ngu-dan"
          onClick={() => navigate("/ngu-dan")}
          // Cài đặt style CSS inline cho thẻ card ngư dân
          style={{
            display: "flex", // Thiết lập hiển thị flex
            flexDirection: "column", // Căn các phần tử bên trong theo hàng dọc
            alignItems: "center", // Căn giữa theo chiều ngang
            cursor: "pointer", // Biến đổi hình dáng con trỏ chuột thành hình bàn tay khi hover vào
            padding: "8px 12px", // Khoảng đệm trong: 8px trên dưới, 12px trái phải
            borderRadius: 12, // Bo tròn các góc thẻ 12px
            border: `1px solid ${C.border}`, // Tạo đường viền mảnh xung quanh
            background: "#FAFAFA", // Sử dụng màu nền xám rất nhạt
            transition: "all 0.22s", // Đặt hiệu ứng chuyển đổi mượt mà 0.22 giây
            textAlign: "center", // Căn văn bản nằm chính giữa
            width: 110, // Thiết lập chiều rộng cố định 110px
          }}
          // Khi người dùng di chuột vào thẻ card, dịch chuyển nhẹ lên trên và làm nổi bật viền
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)"; // Dịch thẻ lên trên 4px
            e.currentTarget.style.borderColor = C.ocean; // Đổi viền sang màu đại dương xanh thẳm
          }}
          // Khi chuột rời khỏi thẻ card, hoàn trả lại các thuộc tính style ban đầu
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)"; // Trở về vị trí cũ
            e.currentTarget.style.borderColor = C.border; // Khôi phục màu viền gốc
          }}
        >
          {/* Ảnh đại diện tròn của ngư dân hoặc tàu cá */}
          <img
            src={item.img} // Đường dẫn ảnh đại diện
            alt={item.name} // Nhãn thay thế khi ảnh lỗi
            style={{
              width: 52, // Chiều rộng ảnh đại diện
              height: 52, // Chiều cao ảnh đại diện
              borderRadius: "50%", // Bo tròn ảnh hoàn chỉnh thành hình tròn
              objectFit: "cover", // Cắt xén ảnh vừa vặn khung tròn mà không bị bóp méo hình dạng
              marginBottom: 6, // Khoảng cách cách nhãn chữ phía dưới là 6px
              border: `2px solid ${C.border}`, // Tạo viền bao quanh ảnh
            }}
          />
          {/* Tên ngư dân / Hộ kinh doanh */}
          <span
            style={{
              fontSize: 11, // Cỡ chữ nhỏ 11px
              fontWeight: 700, // Định dạng chữ in đậm
              color: C.dark, // Màu chữ tối sẫm
              overflow: "hidden", // Ẩn đi phần văn bản bị vượt quá khung chứa
              textOverflow: "ellipsis", // Cắt ngắn và thêm dấu ba chấm nếu tên quá dài
              whiteSpace: "nowrap", // Không cho phép văn bản tự ý xuống dòng
              width: "100%", // Chiều rộng tối đa chiếm hết thẻ cha
            }}
          >
            {item.name}
          </span>
          {/* Nhãn địa điểm hoạt động */}
          <span style={{ fontSize: 9, color: C.muted }}>📍 {item.loc}</span>
        </div>
      ))}
    </div>
  );
}

// Định nghĩa component FishermanGrid chính, nhận vào prop giới hạn số lượng và hàm xử lý xem thêm
export function FishermanGrid({ limit = 17, onViewAll }) {
  // Gọi API lấy thông tin danh sách ngư dân có trạng thái hoạt động tích cực
  const { data, loading, error } = useApiFetch(
    `/fishermen?limit=${limit}&hasActive=true`,
    [],
  );

  // Fallback an toàn: Nếu cuộc gọi API thất bại, chuyển đổi tự động sang hiển thị dữ liệu cứng giả lập
  if (error) return <HardcodeFallbackGrid onViewAll={onViewAll} />;

  // Nếu hệ thống đang trong quá trình kết nối và tải dữ liệu từ API
  if (loading) {
    return (
      <div
        // Hiển thị container bao bọc các khung skeleton
        style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}
      >
        {/* Tạo mảng giả lập có kích thước bằng limit để hiển thị số lượng bộ xương placeholder phù hợp */}
        {Array.from({ length: limit }).map((_, i) => (
          <div
            key={i} // Khóa React cho từng ô skeleton
            className="skeleton-shimmer" // Lớp CSS tạo hiệu ứng quét bóng sáng chạy qua chạy lại
            style={{ width: 110, height: 100, borderRadius: 12 }} // Kích thước tương thích thẻ card
          />
        ))}
      </div>
    );
  }

  // Giải nén danh sách ngư dân từ API trả về, gán mảng rỗng nếu dữ liệu trả về null/undefined
  const fishermen = data?.data ?? [];

  // Nếu kết quả trả về rỗng (chưa có ngư dân nào đăng ký thật sự), chuyển sang giao diện dự phòng
  if (fishermen.length === 0)
    return <HardcodeFallbackGrid onViewAll={onViewAll} />;

  return (
    <div
      // Khung chứa hiển thị các thẻ card ngư dân thực sự
      style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}
    >
      {/* Lặp qua từng bản ghi dữ liệu ngư dân nhận được để render ra giao diện */}
      {fishermen.map((f) => (
        // Khởi tạo FishermanCard ở chế độ hiển thị thu gọn (size="compact")
        <FishermanCard key={f.id} fisherman={f} size="compact" />
      ))}
    </div>
  );
}
