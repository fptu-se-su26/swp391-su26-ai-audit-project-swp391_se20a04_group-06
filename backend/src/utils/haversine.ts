/**
 * Haversine formula — tính khoảng cách (km) giữa 2 toạ độ GPS.
 * Dùng để lọc hải sản tươi trong bán kính MAX_FRESH_DISTANCE_KM.
 */

// Định nghĩa hằng số khoảng cách tối đa (tính bằng km) để lọc sản phẩm tươi sống
export const MAX_FRESH_DISTANCE_KM = 20;

// Định nghĩa hàm haversineKm tính toán khoảng cách địa lý theo đơn vị km giữa 2 tọa độ GPS (Vĩ độ, Kinh độ)
export function haversineKm(
  // Vĩ độ điểm 1
  lat1: number,
  // Kinh độ điểm 1
  lng1: number,
  // Vĩ độ điểm 2
  lat2: number,
  // Kinh độ điểm 2
  lng2: number,
): number {
  // Bán kính Trái Đất trung bình tính bằng km
  const R = 6371;
  // Hàm trợ giúp chuyển đổi đơn vị từ độ (degree) sang radian
  const toRad = (d: number) => (d * Math.PI) / 180;
  // Tính độ chênh lệch vĩ độ theo radian
  const dLat = toRad(lat2 - lat1);
  // Tính độ chênh lệch kinh độ theo radian
  const dLng = toRad(lng2 - lng1);
  // Áp dụng công thức tính hệ số trung gian a trong công thức Haversine
  const a =
    // Bình phương sin của một nửa hiệu vĩ độ
    Math.sin(dLat / 2) ** 2 +
    // Tích cosin của vĩ độ 1, vĩ độ 2 và bình phương sin của một nửa hiệu kinh độ
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  // Sử dụng hàm ngược tang atan2 để tính khoảng cách cung tròn trên mặt cầu và nhân với bán kính trái đất R
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
