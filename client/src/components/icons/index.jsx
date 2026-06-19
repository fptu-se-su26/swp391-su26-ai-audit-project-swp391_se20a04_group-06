// Import các component biểu tượng cần thiết từ thư viện 'lucide-react'
import {
  Search,         // Biểu tượng Kính lúp (Tìm kiếm)
  MapPin,         // Biểu tượng Ghim vị trí bản đồ
  Map,            // Biểu tượng Bản đồ xếp nếp
  Filter,         // Biểu tượng Phễu lọc
  Sliders,        // Biểu tượng Thanh trượt cấu hình
  ChevronLeft,    // Biểu tượng Mũi tên trái
  ChevronRight,   // Biểu tượng Mũi tên phải
  ChevronDown,    // Biểu tượng Mũi tên xuống
  ChevronUp,      // Biểu tượng Mũi tên lên
  Grid,           // Biểu tượng Lưới ô vuông
  Scale,          // Biểu tượng Cán cân
  Weight,         // Biểu tượng Quả cân (Khối lượng)
  Eye,            // Biểu tượng Con mắt (Lượt xem)
  Heart,          // Biểu tượng Trái tim (Yêu thích)
  MessageSquare,  // Biểu tượng Bong bóng chat (Tin nhắn)
  Bell,           // Biểu tượng Cái chuông (Thông báo)
  User,           // Biểu tượng Người dùng (Tài khoản)
  Menu,           // Biểu tượng Menu ba sọc
  X,              // Biểu tượng Dấu đóng (Chữ X)
  LogOut,         // Biểu tượng Đăng xuất
  BarChart,       // Biểu tượng Biểu đồ cột
  Home,           // Biểu tượng Ngôi nhà (Trang chủ)
  Settings,       // Biểu tượng Bánh răng (Cài đặt)
  Truck,          // Biểu tượng Xe tải (Vận chuyển)
  Phone,          // Biểu tượng Điện thoại (Liên hệ)
  Package,        // Biểu tượng Hộp hàng (Gói tin/Sản phẩm)
  Clock,          // Biểu tượng Đồng hồ (Thời gian)
  Plus,           // Biểu tượng Dấu cộng
  CheckCircle,    // Biểu tượng Vòng tròn tích xanh thành công
  AlertCircle,    // Biểu tượng Vòng tròn chấm than cảnh báo
  Info,           // Biểu tượng Vòng tròn chữ i thông tin
  Star,           // Biểu tượng Ngôi sao (Đánh giá)
  Camera,         // Biểu tượng Máy ảnh (Hình ảnh)
  Sparkles        // Biểu tượng Lấp lánh (Tính năng đặc biệt/AI)
} from "lucide-react";

/**
 * Hàm wrapIcon (Higher-Order Component) dùng để đóng gói một icon từ Lucide.
 * Hàm này giúp định hình và chuẩn hóa các thuộc tính (props) cho toàn bộ icon trong dự án:
 * - defaultStrokeWidth: Độ dày viền mặc định là 1.5px (có thể tùy chỉnh).
 * - display: "inline-block" và verticalAlign: "middle" giúp icon căn chỉnh thẳng hàng với văn bản đi kèm.
 * - {...props}: Cho phép truyền tiếp các thuộc tính khác như onClick, className, color, v.v.
 */
const wrapIcon = (LucideIcon, defaultStrokeWidth = 1.5) => {
  return ({ size = 24, strokeWidth = defaultStrokeWidth, style, ...props }) => (
    <LucideIcon
      size={size} // Kích thước của icon (mặc định là 24x24 px)
      strokeWidth={strokeWidth} // Độ dày nét vẽ viền
      style={{ display: "inline-block", verticalAlign: "middle", ...style }} // Căn lề hiển thị đẹp mắt
      {...props} // Kế thừa các thuộc tính bổ sung từ bên ngoài truyền vào
    />
  );
};

// Khai báo và xuất các component Icon đã được chuẩn hóa thông qua hàm wrapIcon:
export const SearchIcon = wrapIcon(Search);       // Icon tìm kiếm
export const MapPinIcon = wrapIcon(MapPin);       // Icon ghim bản đồ
export const MapIcon = wrapIcon(Map);             // Icon bản đồ
export const FilterIcon = wrapIcon(Filter);       // Icon bộ lọc
export const SlidersIcon = wrapIcon(Sliders);     // Icon thanh trượt lọc nâng cao
export const ChevronLeftIcon = wrapIcon(ChevronLeft, 2);   // Icon mũi tên trái (nét vẽ dày 2px)
export const ChevronRightIcon = wrapIcon(ChevronRight, 2); // Icon mũi tên phải (nét vẽ dày 2px)
export const ChevronDownIcon = wrapIcon(ChevronDown, 2);   // Icon mũi tên xuống (nét vẽ dày 2px)
export const ChevronUpIcon = wrapIcon(ChevronUp, 2);       // Icon mũi tên lên (nét vẽ dày 2px)
export const GridIcon = wrapIcon(Grid);           // Icon hiển thị dạng lưới
export const ScaleIcon = wrapIcon(Scale);         // Icon cán cân
export const WeightIcon = wrapIcon(Weight);       // Icon khối lượng
export const EyeIcon = wrapIcon(Eye);             // Icon mắt xem chi tiết

/**
 * Biểu tượng Trái tim (HeartIcon) có xử lý nghiệp vụ đặc biệt:
 * - filled = true: Trái tim được tô màu đặc hoàn toàn và ẩn viền đi (cho trạng thái đã yêu thích).
 * - filled = false: Trái tim dạng rỗng nét vẽ mảnh viền ngoài (cho trạng thái chưa yêu thích).
 */
export const HeartIcon = ({ filled = false, size = 24, strokeWidth = 1.5, style, ...props }) => (
  <Heart
    size={size} // Kích thước của icon trái tim
    strokeWidth={filled ? 0 : strokeWidth} // Nếu tô đầy (filled) thì ẩn nét viền (bằng 0), ngược lại giữ nét viền
    fill={filled ? "currentColor" : "none"} // Nếu filled thì tô đặc bằng màu chữ hiện tại, ngược lại để rỗng màu
    style={{ display: "inline-block", verticalAlign: "middle", ...style }} // Căn lề dọc thẳng hàng chữ
    {...props} // Truyền tiếp các props bổ sung (ví dụ: onClick để thả tim)
  />
);

// Khai báo và xuất các component Icon còn lại:
export const MessageIcon = wrapIcon(MessageSquare); // Icon bong bóng chat tin nhắn
export const BellIcon = wrapIcon(Bell);             // Icon thông báo cái chuông
export const UserIcon = wrapIcon(User);             // Icon tài khoản người dùng
export const MenuIcon = wrapIcon(Menu);             // Icon ba dấu gạch ngang menu
export const XIcon = wrapIcon(X);                   // Icon nút đóng chữ X
export const LogOutIcon = wrapIcon(LogOut);         // Icon đăng xuất khỏi hệ thống
export const BarChartIcon = wrapIcon(BarChart);     // Icon biểu đồ cột thống kê
export const HomeIcon = wrapIcon(Home);             // Icon trang chủ ngôi nhà
export const SettingsIcon = wrapIcon(Settings);     // Icon cài đặt bánh răng
export const TruckIcon = wrapIcon(Truck);           // Icon xe tải vận chuyển hàng hóa
export const PhoneIcon = wrapIcon(Phone);           // Icon điện thoại liên hệ
export const PackageIcon = wrapIcon(Package);       // Icon bưu kiện hộp hàng
export const ClockIcon = wrapIcon(Clock);           // Icon đồng hồ thời gian đăng tin
export const PlusIcon = wrapIcon(Plus);             // Icon dấu cộng đăng tin/thêm mới
export const CheckCircleIcon = wrapIcon(CheckCircle); // Icon vòng tròn tích chọn hoàn tất
export const AlertCircleIcon = wrapIcon(AlertCircle); // Icon vòng tròn chấm than lỗi/cảnh báo
export const InfoIcon = wrapIcon(Info);             // Icon vòng tròn chữ i thông tin
export const StarIcon = wrapIcon(Star);             // Icon ngôi sao đánh giá
export const CameraIcon = wrapIcon(Camera);         // Icon máy ảnh chụp sản phẩm
export const SparklesIcon = wrapIcon(Sparkles);     // Icon lấp lánh tính năng nổi bật/AI
