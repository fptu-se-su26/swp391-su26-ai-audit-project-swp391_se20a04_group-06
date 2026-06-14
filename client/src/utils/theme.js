// theme.js — Danh sách Design tokens, đồng bộ chặt chẽ với các biến CSS variables trong index.css

// Đối tượng C (Colors) định nghĩa bảng màu chủ đạo và các biến thể màu sắc của ứng dụng
export const C = {
  ocean:  "#0B4F6C", // Màu xanh đại dương chính (Ocean primary)
  oceanL: "#1A7FA0", // Màu xanh đại dương sáng (Ocean light)
  oceanP: "#E6F4F9", // Màu xanh đại dương nhạt làm nền (Ocean pale)
  oceanD: "#07364B", // Màu xanh đại dương sẫm (Ocean dark)
  coral:  "#E8643A", // Màu đỏ san hô (Coral primary)
  coralL: "#FDE8E0", // Màu đỏ san hô nhạt làm nền (Coral light)
  coralD: "#C94F27", // Màu đỏ san hô sẫm (Coral dark)
  ok:     "#1E8449", // Màu xanh lục báo trạng thái thành công/an toàn (Success)
  okL:    "#D5F5E3", // Màu xanh lục nhạt làm nền trạng thái thành công
  warn:   "#D68910", // Màu vàng cam báo trạng thái cảnh báo/chờ (Warning)
  warnL:  "#FEF3C7", // Màu vàng cam nhạt làm nền trạng thái cảnh báo
  dark:   "#0F1B29", // Màu tối sẫm dùng cho tiêu đề chính (Dark slate)
  text:   "#1C2B3A", // Màu chữ chính mặc định (Primary text)
  text2:  "#4A5568", // Màu chữ phụ (Secondary text)
  muted:  "#718096", // Màu chữ nhạt làm mờ/chú thích (Muted text)
  border: "#DDE3EC", // Màu đường viền mặc định (Standard border)
  borderL:"#EDF2F7", // Màu đường viền nhẹ (Light border)
  bg:     "#F4F7FB", // Màu nền trang mặc định (Background)
  bg2:    "#EBF0F7", // Màu nền phụ/khu vực phụ (Background 2)
  white:  "#FFFFFF", // Màu trắng chuẩn
};

// Đối tượng S (Shadows) định nghĩa các cấu hình đổ bóng mờ tạo chiều sâu 3D cho giao diện
export const S = {
  sm: "0 1px 3px rgba(15,27,41,0.08), 0 1px 2px rgba(15,27,41,0.04)",  // Bóng đổ siêu nhỏ dưới chân thẻ
  md: "0 4px 12px rgba(15,27,41,0.10), 0 2px 4px rgba(15,27,41,0.06)",  // Bóng đổ trung bình cho các Card/Button
  lg: "0 10px 28px rgba(15,27,41,0.12), 0 4px 8px rgba(15,27,41,0.06)", // Bóng đổ lớn cho Menu/Dropdown nổi
  xl: "0 20px 40px rgba(11,79,108,0.15), 0 8px 16px rgba(11,79,108,0.07)", // Bóng đổ cực đại cho Modal popup/Chatbox nổi
};

// Đối tượng R (Radii) định nghĩa bán kính bo góc các thành phần (tính bằng px)
export const R = {
  sm:  6,  // Bo góc nhỏ (dành cho ô nhập liệu input, nhãn tag nhỏ)
  md:  10, // Bo góc trung bình (dành cho nút bấm, khung thông tin nhỏ)
  lg:  14, // Bo góc lớn (dành cho card sản phẩm, dropdown)
  xl:  20, // Bo góc rất lớn (dành cho banner, hộp thoại chính modal)
  xxl: 28, // Bo góc cực lớn (dành cho khối trang trí đặc biệt)
};
