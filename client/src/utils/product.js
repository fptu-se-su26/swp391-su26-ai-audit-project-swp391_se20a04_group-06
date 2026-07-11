export function getProductId(product) {
  return product?.id || product?._id || "";
}

export function getProductImage(product) {
  const firstImage = product?.images?.[0];
  return (
    product?.coverImg ||
    (typeof firstImage === "string" ? firstImage : firstImage?.url) ||
    product?.imageUrl ||
    "/favicon.svg"
  );
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function formatDate(value, fallback = "Chưa cập nhật") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString("vi-VN");
}

export function getFreshness(product) {
  if (product?.type !== "Fresh") return "Đã sơ chế / đồ khô";
  if (!product?.catchTime) return "Chưa cập nhật";

  const ageHours = (Date.now() - new Date(product.catchTime).getTime()) / 3_600_000;
  if (ageHours <= 24) return "Tươi hôm nay";
  if (ageHours <= 72) return "Rất tươi";
  if (ageHours <= 168) return "Tươi";
  return "Đã bảo quản";
}

const marketplaceStatuses = {
  available: { key: "available", label: "Còn hàng" },
  reserved: { key: "reserved", label: "Đã giữ chỗ" },
  "sold out": { key: "sold-out", label: "Hết hàng" },
  soldout: { key: "sold-out", label: "Hết hàng" },
  expired: { key: "expired", label: "Hết hạn" },
};

export function getMarketplaceStatus(product) {
  const explicitStatus = String(
    product?.marketplaceStatus || product?.uiStatus || product?.status || "",
  ).toLowerCase();
  const expiryTime = product?.expiryDate ? new Date(product.expiryDate).getTime() : null;
  const hasKnownStock =
    product?.remainingWeight !== undefined && product?.remainingWeight !== null;

  if (marketplaceStatuses[explicitStatus]) return marketplaceStatuses[explicitStatus];
  if (expiryTime && expiryTime < Date.now()) return marketplaceStatuses.expired;
  if (product?.isReserved || product?.reserved) return marketplaceStatuses.reserved;
  if (hasKnownStock && Number(product.remainingWeight) <= 0) {
    return marketplaceStatuses["sold out"];
  }
  if (explicitStatus && explicitStatus !== "active") return marketplaceStatuses.expired;
  return marketplaceStatuses.available;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceKm(from, product) {
  const lat = Number(product?.lat);
  const lng = Number(product?.lng);
  if (!from || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const earthRadiusKm = 6371;
  const latDelta = toRadians(lat - from.latitude);
  const lngDelta = toRadians(lng - from.longitude);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(lat)) *
      Math.sin(lngDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(distanceKm) {
  if (distanceKm == null) return "Chưa có vị trí";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
}
