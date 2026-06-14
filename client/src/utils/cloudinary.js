/**
 * cloudinary.js — Helpers tối ưu URL ảnh Cloudinary
 *
 * Cloudinary hỗ trợ biến đổi URL theo format:
 *   https://res.cloudinary.com/{cloud}/image/upload/f_auto,q_auto,w_400/{public_id}
 *
 * Việc thêm params này KHÔNG cần rebuild ảnh — Cloudinary CDN xử lý on-the-fly.
 */

/**
 * Tối ưu URL Cloudinary với transformations.
 *
 * @param {string|null} url      - URL gốc từ Cloudinary
 * @param {number} [width=400]   - Chiều rộng mong muốn (px)
 * @param {number} [quality]     - Chất lượng (1-100), mặc định auto
 * @returns {string} URL đã tối ưu
 */
export function cloudinaryOptimize(url, width = 400, quality = null) {
  // Nếu không có URL truyền vào, trả về ngay giá trị null/undefined ban đầu để tránh lỗi xử lý chuỗi
  if (!url) return url;
  // Kiểm tra xem địa chỉ URL có chứa tên miền của hệ thống Cloudinary hay không
  if (!url.includes('res.cloudinary.com') && !url.includes('cloudinary.com')) return url;

  // Nếu trong URL đã sẵn có các cấu hình tối ưu tự động (f_auto hoặc q_auto), trả về luôn để tránh lặp bộ lọc
  if (url.includes('f_auto') || url.includes('q_auto')) return url;

  // Thiết lập mức chất lượng ảnh: nếu có truyền chất lượng cụ thể thì dùng q_quality, ngược lại dùng tự động q_auto
  const q = quality ? `q_${quality}` : 'q_auto';
  // Tạo chuỗi định cấu hình biến đổi: tự động chọn định dạng ảnh f_auto, mức chất lượng q, giới hạn chiều rộng w và tỉ lệ c_limit
  const transform = `f_auto,${q},w_${width},c_limit`;

  // Định vị chuỗi '/upload/' mặc định trên Cloudinary và chèn chuỗi biến đổi hình ảnh tối ưu hóa ngay sau đó
  return url.replace('/upload/', `/upload/${transform}/`);
}

/**
 * Lấy ảnh làm hình nền chính (cover image) cho thẻ sản phẩm ProductCard (sử dụng thumbnail nhỏ rộng 400px)
 */
export function cardImage(url) {
  // Gọi hàm tối ưu hóa hình ảnh với chiều rộng mặc định là 400px
  return cloudinaryOptimize(url, 400);
}

/**
 * Lấy ảnh phục vụ trang chi tiết sản phẩm (ProductDetailPage) có độ phân giải lớn hơn (chiều rộng 800px)
 */
export function detailImage(url) {
  // Gọi hàm tối ưu hóa hình ảnh với chiều rộng lớn hơn là 800px để hiển thị sắc nét trên máy tính
  return cloudinaryOptimize(url, 800);
}

/**
 * Lấy ảnh phục vụ chia sẻ liên kết mạng xã hội (Open Graph Image) - định dạng chuẩn 1200x630px
 */
export function ogImage(url) {
  // Nếu không có URL, trả về ngay giá trị ban đầu để tránh lỗi
  if (!url) return url;
  // Nếu đây không phải là ảnh lưu trữ trên Cloudinary, không thực hiện tối ưu hóa
  if (!url.includes('cloudinary.com')) return url;
  // Nếu ảnh đã được cấu hình định dạng tự động f_auto từ trước, trả về trực tiếp để tránh ghi đè
  if (url.includes('f_auto')) return url;
  // Thay thế chuỗi '/upload/' bằng chuỗi cấu hình cố định 1200x630px cắt cúp vừa vặn (c_fill) để làm ảnh bìa chia sẻ Facebook/Zalo
  return url.replace('/upload/', '/upload/f_auto,q_auto,w_1200,h_630,c_fill/');
}
