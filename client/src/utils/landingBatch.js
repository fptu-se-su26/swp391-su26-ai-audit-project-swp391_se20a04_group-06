export const landingBatchCategoryLabels = {
  Fish: "Cá",
  Shrimp: "Tôm",
  Squid: "Mực",
  Crab: "Cua, ghẹ",
  Shellfish: "Nhuyễn thể",
  Others: "Khác",
};

export function getLandingBatchId(batch) {
  return batch?.id || batch?._id || "";
}

export function getLandingBatchImage(batch) {
  const firstImage = batch?.images?.[0];
  return (
    batch?.coverImg ||
    (typeof firstImage === "string" ? firstImage : firstImage?.url) ||
    null
  );
}

export function formatLandingDateTime(value, fallback = "Chưa cập nhật") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function getLandingBatchStatus(status) {
  const normalized = String(status || "Active").toLowerCase();
  if (normalized === "closed") return { key: "closed", label: "Đã đóng" };
  if (normalized === "deleted") return { key: "deleted", label: "Đã ẩn" };
  return { key: "active", label: "Đang bán" };
}
