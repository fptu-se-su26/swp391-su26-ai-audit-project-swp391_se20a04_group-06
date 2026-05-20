"use strict";
/**
 * Haversine formula — tính khoảng cách (km) giữa 2 toạ độ GPS.
 * Dùng để lọc hải sản tươi trong bán kính MAX_FRESH_DISTANCE_KM.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_FRESH_DISTANCE_KM = void 0;
exports.haversineKm = haversineKm;
exports.MAX_FRESH_DISTANCE_KM = 20; // buyer chỉ thấy sản phẩm trong 20km
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371; // bán kính Trái Đất (km)
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
