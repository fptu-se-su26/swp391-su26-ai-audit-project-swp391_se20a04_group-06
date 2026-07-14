export const categoryLabelMap = {
  FISH: "Cá",
  SHRIMP: "Tôm",
  CRAB: "Cua",
  SQUID: "Mực",
  SHELLFISH: "Ốc/Sò",
  OTHER: "Khác",
  OTHERS: "Khác",
  fish: "Cá",
  shrimp: "Tôm",
  crab: "Cua",
  squid: "Mực",
  shellfish: "Ốc/Sò",
  other: "Khác",
  others: "Khác",
  "Cua, ghẹ": "Cua, ghẹ",
  "Nhuyễn thể": "Nhuyễn thể",
};

export const freshnessLabelMap = {
  LIVE: "Còn sống",
  FRESH: "Tươi sống",
  FROZEN: "Đông lạnh",
  DRIED: "Đồ khô",
  live: "Còn sống",
  fresh: "Tươi sống",
  frozen: "Đông lạnh",
  dried: "Đồ khô",
};

export const difficultyLabelMap = {
  Easy: "Dễ",
  Medium: "Trung bình",
  Hard: "Khó",
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

export const roleLabelMap = {
  buyer: "Người mua",
  seller: "Người bán",
  admin: "Quản trị viên",
  BUYER: "Người mua",
  SELLER: "Người bán",
  ADMIN: "Quản trị viên",
};

export const statusLabelMap = {
  active: "Đang hoạt động",
  inactive: "Ngừng hoạt động",
  pending: "Đang chờ",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
  locked: "Đã khóa",
  unlocked: "Đang mở",
  in_stock: "Còn hàng",
  out_of_stock: "Hết hàng",
  Active: "Đang hoạt động",
  Inactive: "Ngừng hoạt động",
  Pending: "Đang chờ",
  Approved: "Đã duyệt",
  Rejected: "Đã từ chối",
  Locked: "Đã khóa",
  Unlocked: "Đang mở",
  In_stock: "Còn hàng",
  Out_of_stock: "Hết hàng",
};

export const productSizeLabelMap = {
  LARGE: "To",
  MEDIUM: "Trung bình",
  SMALL: "Nhỏ",
  large: "To",
  medium: "Trung bình",
  small: "Nhỏ",
  To: "To",
  "Trung bình": "Trung bình",
  Nhỏ: "Nhỏ",
};

export function getCategoryLabel(value) {
  if (!value) return "Khác";
  const normalized = String(value).trim();
  const lowerNormalized = normalized.toLowerCase();
  return categoryLabelMap[normalized] || categoryLabelMap[lowerNormalized] || value;
}

export function getFreshnessLabel(value) {
  if (!value) return "Chưa cập nhật";
  const normalized = String(value).trim();
  const lowerNormalized = normalized.toLowerCase();
  return freshnessLabelMap[normalized] || freshnessLabelMap[lowerNormalized] || value;
}

export function getDifficultyLabel(value) {
  if (!value) return "Chưa cập nhật";
  const normalized = String(value).trim();
  const lowerNormalized = normalized.toLowerCase();
  return difficultyLabelMap[normalized] || difficultyLabelMap[lowerNormalized] || value;
}

export function getRoleLabel(value) {
  if (!value) return "Chưa cập nhật";
  const normalized = String(value).trim();
  const lowerNormalized = normalized.toLowerCase();
  return roleLabelMap[normalized] || roleLabelMap[lowerNormalized] || value;
}

export function getStatusLabel(value) {
  if (!value) return "Chưa cập nhật";
  const normalized = String(value).trim();
  const lowerNormalized = normalized.toLowerCase();
  return statusLabelMap[normalized] || statusLabelMap[lowerNormalized] || value;
}

export function getProductSizeLabel(value) {
  if (!value) return "Chưa cập nhật";
  return productSizeLabelMap[value] || "Chưa cập nhật";
}
