// import React phục vụ render JSX component
import React from "react";

// Hàm helper định dạng số thành chuỗi tiền tệ Việt Nam Đồng (VND) theo chuẩn định dạng quốc gia (ví dụ: 100.000đ)
export const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

// Hàm helper render nhanh một component nhãn huy hiệu trạng thái (pill status badge) có màu nền, màu chữ và nội dung tùy chỉnh
export const pill = (bg, color, label) => (
  <span
    style={{
      background: bg,        // Thiết lập màu nền của huy hiệu (truyền vào mã màu HEX/RGBA)
      color,                 // Thiết lập màu chữ của huy hiệu
      borderRadius: 4,       // Bo tròn nhẹ 4 góc của huy hiệu
      padding: "2px 7px",    // Đệm khoảng cách bên trong (trên/dưới 2px, trái/phải 7px)
      fontSize: 11,          // Cỡ chữ nhỏ gọn 11px
      fontWeight: 700,       // Kiểu chữ in đậm (bold)
    }}
  >
    {label}                  {/* Hiển thị nhãn văn bản truyền vào */}
  </span>
);
