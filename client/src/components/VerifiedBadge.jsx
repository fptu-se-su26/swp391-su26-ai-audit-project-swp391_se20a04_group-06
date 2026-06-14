// Định nghĩa hằng số SIZES lưu trữ cấu hình giao diện cho các kích thước khác nhau (sm, md, lg)
const SIZES = {
  // Cấu hình kích thước nhỏ (sm): cỡ chữ 11px, khoảng đệm trong 1px dọc 6px ngang, kích thước biểu tượng 10px
  sm: { fontSize: 11, padding: "1px 6px", iconSize: 10 },
  // Cấu hình kích thước vừa (md): cỡ chữ 13px, khoảng đệm trong 2px dọc 8px ngang, kích thước biểu tượng 12px
  md: { fontSize: 13, padding: "2px 8px", iconSize: 12 },
  // Cấu hình kích thước lớn (lg): cỡ chữ 15px, khoảng đệm trong 4px dọc 12px ngang, kích thước biểu tượng 14px
  lg: { fontSize: 15, padding: "4px 12px", iconSize: 14 },
};

// Định nghĩa và export component VerifiedBadge để hiển thị huy hiệu xác minh của người dùng
export function VerifiedBadge({ size = "sm", showLabel = false, style = {} }) {
  // Lấy ra cấu hình kích thước phù hợp dựa trên prop size được truyền vào
  const s = SIZES[size];
  // Trả về phần tử span chứa biểu tượng và nhãn văn bản đã xác minh
  return (
    <span
      // Tooltip hiển thị khi người dùng di chuột qua huy hiệu
      title="Người bán đã được Admin xác minh"
      // Thiết lập các thuộc tính style CSS inline cho huy hiệu
      style={{
        display: "inline-flex", // Sử dụng flexbox nội dòng để căn chỉnh các phần tử bên trong
        alignItems: "center", // Căn giữa biểu tượng và văn bản theo chiều dọc
        gap: 3, // Khoảng cách giữa biểu tượng và văn bản là 3px
        background: "linear-gradient(135deg, #0EA5E9, #0284C7)", // Tạo nền dải chuyển màu xanh dương hiện đại
        color: "#fff", // Đặt màu chữ và biểu tượng là màu trắng
        borderRadius: 20, // Bo tròn góc tối đa để tạo hình viên thuốc
        padding: s.padding, // Áp dụng khoảng đệm theo kích thước đã cấu hình
        fontSize: s.fontSize, // Áp dụng cỡ chữ tương ứng
        fontWeight: 700, // Đặt kiểu chữ in đậm
        verticalAlign: "middle", // Căn hàng huy hiệu nằm giữa dòng văn bản bên ngoài
        whiteSpace: "nowrap", // Ngăn không cho chữ bên trong bị tự động xuống dòng
        ...style, // Kế thừa và ghi đè các style bổ sung truyền từ component cha nếu có
      }}
    >
      {/* Biểu tượng SVG chứa dấu tích hoàn thành */}
      <svg
        width={s.iconSize} // Chiều rộng của biểu tượng
        height={s.iconSize} // Chiều cao của biểu tượng
        viewBox="0 0 12 12" // Thiết lập tỷ lệ tọa độ hiển thị trong SVG
        fill="none" // Không tô màu nền biểu tượng
        xmlns="http://www.w3.org/2000/svg" // Định nghĩa schema XML cho SVG
      >
        {/* Đường vẽ hình chữ V thể hiện dấu kiểm tra */}
        <path
          d="M10 3L4.5 8.5L2 6" // Toạ độ các điểm nối tạo thành dấu tích
          stroke="white" // Đặt màu đường viền vẽ là màu trắng
          strokeWidth="1.8" // Thiết lập độ dày đường viền vẽ là 1.8px
          strokeLinecap="round" // Bo tròn hai đầu mút của đường viền
          strokeLinejoin="round" // Bo tròn các góc giao nhau của đường viền
        />
      </svg>
      {/* Hiển thị dòng chữ nhãn 'Đã xác minh' nếu prop showLabel được truyền vào là true */}
      {showLabel && "Đã xác minh"}
    </span>
  );
}

/**
 * ─── Hướng dẫn dùng VerifiedBadge trong ProductCard ───
 *
 * Tìm chỗ hiện tên seller trong ProductCard.jsx:
 *
 *   <span>{product.sellerName}</span>
 *
 * Đổi thành:
 *
 *   <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
 *     {product.sellerName}
 *     {product.sellerIsVerified && <VerifiedBadge />}
 *   </span>
 *
 * Lưu ý: backend cần thêm `u.IsVerified AS sellerIsVerified` vào query product.
 */

/**
 * ─── Hướng dẫn dùng trong SellerProfilePage ───
 *
 *   <h1>{seller.name}</h1>
 *   {seller.isVerified && <VerifiedBadge size="lg" showLabel />}
 *
 */
