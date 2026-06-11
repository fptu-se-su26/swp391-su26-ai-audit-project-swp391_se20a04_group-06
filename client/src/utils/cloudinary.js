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
  if (!url) return url;
  // Kiểm tra đây có phải Cloudinary URL không
  if (!url.includes('res.cloudinary.com') && !url.includes('cloudinary.com')) return url;

  // Tránh double-transform nếu URL đã có params
  if (url.includes('f_auto') || url.includes('q_auto')) return url;

  const q = quality ? `q_${quality}` : 'q_auto';
  const transform = `f_auto,${q},w_${width},c_limit`;

  // Chèn transform vào sau /upload/
  return url.replace('/upload/', `/upload/${transform}/`);
}

/**
 * Cover image cho ProductCard (thumbnail nhỏ 400px)
 */
export function cardImage(url) {
  return cloudinaryOptimize(url, 400);
}

/**
 * Ảnh detail page — lớn hơn (800px)
 */
export function detailImage(url) {
  return cloudinaryOptimize(url, 800);
}

/**
 * Ảnh OG/share — 1200x630
 */
export function ogImage(url) {
  if (!url) return url;
  if (!url.includes('cloudinary.com')) return url;
  if (url.includes('f_auto')) return url;
  return url.replace('/upload/', '/upload/f_auto,q_auto,w_1200,h_630,c_fill/');
}
