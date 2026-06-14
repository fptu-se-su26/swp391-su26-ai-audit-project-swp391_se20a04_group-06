// Component cơ sở Icon nhận vào size (kích thước), strokeWidth (độ dày viền), children (các thẻ đồ họa vector con) và các thuộc tính khác
const Icon = ({ size = 24, strokeWidth = 1.5, children, ...rest }) => (
  <svg
    // Chiều rộng của SVG (mặc định là 24px)
    width={size}
    // Chiều cao của SVG (mặc định là 24px)
    height={size}
    // Khung nhìn tọa độ chuẩn từ 0,0 đến 24,24
    viewBox="0 0 24 24"
    // Không tô màu nền bên trong các khối vẽ
    fill="none"
    // Màu đường viền sử dụng màu chữ của phần tử cha
    stroke="currentColor"
    // Độ dày đường viền (mặc định là 1.5px)
    strokeWidth={strokeWidth}
    // Định dạng bo tròn ở đầu các đoạn thẳng
    strokeLinecap="round"
    // Định dạng bo tròn tại điểm nối các đoạn thẳng
    strokeLinejoin="round"
    // Thuộc tính ẩn đối với các trình đọc màn hình hỗ trợ người khiếm thị
    aria-hidden="true"
    // Ngăn chặn việc focus bằng phím tab trên trình duyệt
    focusable="false"
    // Canh chỉnh icon thẳng hàng với dòng chữ văn bản
    style={{ display: "inline-block", verticalAlign: "middle" }}
    // Trải tất cả các thuộc tính style, className, onClick, ... bổ sung được truyền từ component cha
    {...rest}
  >
    {/* Kết xuất các phần tử đồ họa vector con bên trong thẻ svg */}
    {children}
  </svg>
);

// Component biểu tượng Tìm kiếm (SearchIcon)
export const SearchIcon = (props) => (
  // Sử dụng component Icon gốc và truyền tiếp các prop nhận được
  <Icon {...props}>
    {/* Vẽ một hình tròn đại diện cho mắt kính lúp có tâm (11, 11) và bán kính là 7 */}
    <circle cx="11" cy="11" r="7" />
    {/* Vẽ đường thẳng chéo làm tay cầm của kính lúp */}
    <path d="m21 21-4.35-4.35" />
  </Icon>
);

// Component biểu tượng Ghim bản đồ (MapPinIcon)
export const MapPinIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ hình chiếc ghim giọt nước bản đồ bằng thẻ path */}
    <path d="M12 2C8.69 2 6 4.69 6 8c0 5.25 6 12 6 12s6-6.75 6-12c0-3.31-2.69-6-6-6Z" />
    {/* Vẽ hình tròn rỗng nhỏ ở chính giữa đầu chiếc ghim */}
    <circle cx="12" cy="8" r="2" />
  </Icon>
);

// Component biểu tượng Bản đồ gấp (MapIcon)
export const MapIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ các đa giác khép kín đại diện cho 3 nếp gấp của bản đồ */}
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    {/* Vẽ đường phân chia thẳng đứng thứ nhất */}
    <line x1="9" y1="3" x2="9" y2="18" />
    {/* Vẽ đường phân chia thẳng đứng thứ hai */}
    <line x1="15" y1="6" x2="15" y2="21" />
  </Icon>
);

// Component biểu tượng Bộ lọc (FilterIcon)
export const FilterIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ đường ngang trên cùng dài nhất */}
    <line x1="4" y1="6" x2="20" y2="6" />
    {/* Vẽ đường ngang ở giữa có độ dài trung bình */}
    <line x1="7" y1="12" x2="17" y2="12" />
    {/* Vẽ đường ngang dưới cùng ngắn nhất tạo hình phễu */}
    <line x1="10" y1="18" x2="14" y2="18" />
  </Icon>
);

// Component biểu tượng Thanh trượt căn chỉnh (SlidersIcon)
export const SlidersIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ thanh dọc thứ nhất (cột trái - phần dưới nút trượt) */}
    <line x1="4" y1="21" x2="4" y2="14" />
    {/* Vẽ thanh dọc thứ nhất (cột trái - phần trên nút trượt) */}
    <line x1="4" y1="10" x2="4" y2="3" />
    {/* Vẽ thanh dọc thứ hai (cột giữa - phần dưới nút trượt) */}
    <line x1="12" y1="21" x2="12" y2="12" />
    {/* Vẽ thanh dọc thứ hai (cột giữa - phần trên nút trượt) */}
    <line x1="12" y1="8" x2="12" y2="3" />
    {/* Vẽ thanh dọc thứ ba (cột phải - phần dưới nút trượt) */}
    <line x1="20" y1="21" x2="20" y2="16" />
    {/* Vẽ thanh dọc thứ ba (cột phải - phần trên nút trượt) */}
    <line x1="20" y1="12" x2="20" y2="3" />
    {/* Vẽ nút trượt ngang ở cột trái */}
    <line x1="1" y1="14" x2="7" y2="14" />
    {/* Vẽ nút trượt ngang ở cột giữa */}
    <line x1="9" y1="8" x2="15" y2="8" />
    {/* Vẽ nút trượt ngang ở cột phải */}
    <line x1="17" y1="16" x2="23" y2="16" />
  </Icon>
);

// Component biểu tượng Mũi tên trái (ChevronLeftIcon)
export const ChevronLeftIcon = ({ strokeWidth = 2, ...props }) => (
  // Sử dụng component Icon gốc, ghi đè độ dày viền mặc định thành 2px
  <Icon strokeWidth={strokeWidth} {...props}>
    {/* Vẽ đường gấp khúc chỉ hướng bên trái */}
    <polyline points="15 18 9 12 15 6" />
  </Icon>
);

// Component biểu tượng Mũi tên phải (ChevronRightIcon)
export const ChevronRightIcon = ({ strokeWidth = 2, ...props }) => (
  // Sử dụng component Icon gốc, ghi đè độ dày viền mặc định thành 2px
  <Icon strokeWidth={strokeWidth} {...props}>
    {/* Vẽ đường gấp khúc chỉ hướng bên phải */}
    <polyline points="9 18 15 12 9 6" />
  </Icon>
);

// Component biểu tượng Mũi tên xuống (ChevronDownIcon)
export const ChevronDownIcon = ({ strokeWidth = 2, ...props }) => (
  // Sử dụng component Icon gốc, ghi đè độ dày viền mặc định thành 2px
  <Icon strokeWidth={strokeWidth} {...props}>
    {/* Vẽ đường gấp khúc chỉ hướng xuống dưới */}
    <polyline points="6 9 12 15 18 9" />
  </Icon>
);

// Component biểu tượng Mũi tên lên (ChevronUpIcon)
export const ChevronUpIcon = ({ strokeWidth = 2, ...props }) => (
  // Sử dụng component Icon gốc, ghi đè độ dày viền mặc định thành 2px
  <Icon strokeWidth={strokeWidth} {...props}>
    {/* Vẽ đường gấp khúc chỉ hướng lên trên */}
    <polyline points="18 15 12 9 6 15" />
  </Icon>
);

// Component biểu tượng Dạng lưới ô vuông (GridIcon)
export const GridIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ ô vuông góc trên bên trái */}
    <rect x="3" y="3" width="7" height="7" rx="1" />
    {/* Vẽ ô vuông góc trên bên phải */}
    <rect x="14" y="3" width="7" height="7" rx="1" />
    {/* Vẽ ô vuông góc dưới bên trái */}
    <rect x="3" y="14" width="7" height="7" rx="1" />
    {/* Vẽ ô vuông góc dưới bên phải */}
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Icon>
);

// Component biểu tượng Cán cân (ScaleIcon)
export const ScaleIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ trục đứng ở giữa cán cân */}
    <line x1="12" y1="3" x2="12" y2="21" />
    {/* Vẽ chóp tam giác trên đỉnh cán cân */}
    <path d="M3 9l9-7 9 7" />
    {/* Vẽ thanh ngang treo 2 đĩa cân ở phía dưới */}
    <line x1="3" y1="15" x2="21" y2="15" />
    {/* Vẽ thanh đòn ngang chính ở phía trên */}
    <path d="M3 9h18" />
    {/* Vẽ đĩa cân treo bên trái */}
    <path d="M5 15a2 2 0 0 1-2 2 2 2 0 0 1-2-2l2-6 2 6Z" />
    {/* Vẽ đĩa cân treo bên phải */}
    <path d="M21 15a2 2 0 0 1-2 2 2 2 0 0 1-2-2l2-6 2 6Z" />
  </Icon>
);

// Component biểu tượng Quả cân/Khối lượng (WeightIcon)
export const WeightIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ thân chính của quả cân hình chữ U ngược */}
    <path d="M6 18V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v11" />
    {/* Vẽ đường thẳng làm đế của quả cân */}
    <path d="M4 18h16" />
    {/* Vẽ quai xách hình vòm tròn trên đầu quả cân */}
    <path d="M9 5a3 3 0 0 1 6 0" />
  </Icon>
);

// Component biểu tượng Con mắt (EyeIcon)
export const EyeIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ hình viền quả mắt bên ngoài */}
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
    {/* Vẽ hình tròn đại diện cho tròng mắt ở chính giữa */}
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

// Component biểu tượng Trái tim (HeartIcon) nhận thêm thuộc tính filled (được tô màu hay không)
export const HeartIcon = ({ filled = false, ...props }) => (
  <Icon
    // Đặt màu tô bên trong: dùng currentColor nếu filled=true, ngược lại không tô màu (none)
    fill={filled ? "currentColor" : "none"}
    // Đặt viền: không có viền nếu filled=true (vì đã tô đặc màu), ngược lại dùng viền 1.5px
    strokeWidth={filled ? 0 : 1.5}
    // Truyền tiếp các prop khác
    {...props}
  >
    {/* Vẽ đường cong hình trái tim khép kín */}
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
  </Icon>
);

// Component biểu tượng Bong bóng chat (MessageIcon)
export const MessageIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ khung hình chữ nhật bo tròn có đuôi nhọn ở góc dưới bên trái đại diện cho hộp thoại hội thoại */}
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Icon>
);

// Component biểu tượng Cái chuông thông báo (BellIcon)
export const BellIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ thân cái chuông úp ngược */}
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    {/* Vẽ quả lắc chuông hình vòm cung nhỏ ở đáy chuông */}
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Icon>
);

// Component biểu tượng Tài khoản người dùng (UserIcon)
export const UserIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ đường cong đại diện cho bờ vai và phần cổ của người dùng */}
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    {/* Vẽ hình tròn đại diện cho đầu người dùng */}
    <circle cx="12" cy="7" r="4" />
  </Icon>
);

// Component biểu tượng Ba dấu gạch ngang (MenuIcon)
export const MenuIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ đường thẳng ngang ở giữa */}
    <line x1="3" y1="12" x2="21" y2="12" />
    {/* Vẽ đường thẳng ngang ở trên cùng */}
    <line x1="3" y1="6" x2="21" y2="6" />
    {/* Vẽ đường thẳng ngang ở dưới cùng */}
    <line x1="3" y1="18" x2="21" y2="18" />
  </Icon>
);

// Component biểu tượng Dấu chữ X (XIcon)
export const XIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ đường chéo từ góc trên bên phải xuống góc dưới bên trái */}
    <line x1="18" y1="6" x2="6" y2="18" />
    {/* Vẽ đường chéo từ góc trên bên trái xuống góc dưới bên phải */}
    <line x1="6" y1="6" x2="18" y2="18" />
  </Icon>
);

// Component biểu tượng Đăng xuất (LogOutIcon)
export const LogOutIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ khung mở của ô cửa đi ra */}
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    {/* Vẽ đầu mũi tên hướng ra ngoài bên phải */}
    <polyline points="16 17 21 12 16 7" />
    {/* Vẽ thân mũi tên nằm ngang chỉ từ trong ra ngoài cửa */}
    <line x1="21" y1="12" x2="9" y2="12" />
  </Icon>
);

// Component biểu tượng Biểu đồ cột (BarChartIcon)
export const BarChartIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ cột dọc thứ ba ở bên phải ngoài cùng (độ cao vừa phải) */}
    <line x1="18" y1="20" x2="18" y2="10" />
    {/* Vẽ cột dọc thứ hai ở giữa (độ cao cao nhất) */}
    <line x1="12" y1="20" x2="12" y2="4" />
    {/* Vẽ cột dọc thứ nhất ở bên trái ngoài cùng (độ cao thấp nhất) */}
    <line x1="6" y1="20" x2="6" y2="14" />
  </Icon>
);

// Component biểu tượng Ngôi nhà (HomeIcon)
export const HomeIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ phần mái nhà nhọn và khung bao ngoài thân nhà hình chữ nhật */}
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    {/* Vẽ cánh cửa chính ra vào hình chữ U ngược đặt ở đáy ngôi nhà */}
    <polyline points="9 22 9 12 15 12 15 22" />
  </Icon>
);

// Component biểu tượng Cài đặt (SettingsIcon)
export const SettingsIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ vòng tròn đồng tâm đại diện cho trục bánh răng bánh xe */}
    <circle cx="12" cy="12" r="3" />
    {/* Vẽ các chấu/khớp bánh răng nhô ra xung quanh vòng tròn */}
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M12 2v2m0 16v2M2 12h2m16 0h2" />
  </Icon>
);

// Component biểu tượng Xe tải giao hàng (TruckIcon)
export const TruckIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ phần thùng xe tải hình chữ nhật lớn phía sau */}
    <rect x="1" y="3" width="15" height="13" rx="1" />
    {/* Vẽ phần đầu xe tải có vát chéo phía trước */}
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    {/* Vẽ bánh xe trước (hình tròn có bán kính 2.5px) */}
    <circle cx="5.5" cy="18.5" r="2.5" />
    {/* Vẽ bánh xe sau (hình tròn có bán kính 2.5px) */}
    <circle cx="18.5" cy="18.5" r="2.5" />
  </Icon>
);

// Component biểu tượng Điện thoại (PhoneIcon)
export const PhoneIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ hình chiếc ống nghe điện thoại thoại cầm tay cong cong */}
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6A16 16 0 0 0 12 14.69l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 20 16z" />
  </Icon>
);

// Component biểu tượng Hộp hàng hóa/Bưu kiện (PackageIcon)
export const PackageIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ nếp gấp nắp hộp bên trái */}
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    {/* Vẽ hình khối 3D hộp lục giác bao quanh bưu kiện */}
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    {/* Vẽ nếp gấp mở nắp hộp phía trên */}
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    {/* Vẽ đường gấp mép chính giữa chia đôi thân hộp 3D */}
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </Icon>
);

// Component biểu tượng Đồng hồ (ClockIcon)
export const ClockIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ mặt đồng hồ hình tròn lớn */}
    <circle cx="12" cy="12" r="10" />
    {/* Vẽ kim giờ và kim phút góc 3 giờ rưỡi */}
    <polyline points="12 6 12 12 16 14" />
  </Icon>
);

// Component biểu tượng Dấu cộng (PlusIcon)
export const PlusIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ đường thẳng dọc từ trên xuống dưới */}
    <line x1="12" y1="5" x2="12" y2="19" />
    {/* Vẽ đường thẳng ngang từ trái sang phải */}
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);

// Component biểu tượng Vòng tròn tích chọn thành công (CheckCircleIcon)
export const CheckCircleIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ vòng tròn bị khuyết một góc nhỏ phía trên bên phải */}
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    {/* Vẽ hình dấu tích chữ V lồng vào góc khuyết của vòng tròn */}
    <polyline points="22 4 12 14.01 9 11.01" />
  </Icon>
);

// Component biểu tượng Vòng tròn cảnh báo dấu chấm than (AlertCircleIcon)
export const AlertCircleIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ vòng tròn cảnh báo bên ngoài */}
    <circle cx="12" cy="12" r="10" />
    {/* Vẽ vạch thẳng phía trên của dấu chấm than */}
    <line x1="12" y1="8" x2="12" y2="12" />
    {/* Vẽ dấu chấm nhỏ phía dưới của dấu chấm than */}
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </Icon>
);

// Component biểu tượng Vòng tròn chữ i thông tin (InfoIcon)
export const InfoIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ vòng tròn thông tin bên ngoài */}
    <circle cx="12" cy="12" r="10" />
    {/* Vẽ thân vạch thẳng của chữ i */}
    <line x1="12" y1="16" x2="12" y2="12" />
    {/* Vẽ dấu chấm tròn trên đầu của chữ i */}
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </Icon>
);

// Component biểu tượng Ngôi sao (StarIcon)
export const StarIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ đa giác hình ngôi sao 5 cánh khép kín */}
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Icon>
);

// Component biểu tượng Máy ảnh (CameraIcon)
export const CameraIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ khung vỏ ngoài của máy ảnh kèm theo đèn flash nhô lên phía trên */}
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    {/* Vẽ hình tròn đại diện cho ống kính máy ảnh ở chính giữa */}
    <circle cx="12" cy="13" r="4" />
  </Icon>
);

// Component biểu tượng Lấp lánh ma thuật (SparklesIcon)
export const SparklesIcon = (props) => (
  // Sử dụng component Icon gốc
  <Icon {...props}>
    {/* Vẽ hình ngôi sao lấp lánh 4 cánh lớn ở chính giữa */}
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    {/* Vẽ ngôi sao nhỏ lấp lánh ở góc trên bên trái */}
    <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z" />
    {/* Vẽ ngôi sao nhỏ lấp lánh ở góc dưới bên phải */}
    <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
  </Icon>
);
