export const categoryLabelMap = {
  fish: "Cá",
  shrimp: "Tôm",
  crab: "Cua, ghẹ",
  squid: "Mực",
  shellfish: "Nhuyễn thể",
  other: "Khác",
  others: "Khác",
};

export const freshnessLabelMap = {
  live: "Còn sống",
  fresh: "Tươi sống",
  dried: "Đồ khô",
  frozen: "Đông lạnh",
};

export const difficultyLabelMap = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

export function getCategoryLabel(value) {
  if (!value) return "Khác";
  const normalized = String(value).toLowerCase().trim();
  return categoryLabelMap[normalized] || value;
}

export function getFreshnessLabel(value) {
  if (!value) return "Chưa cập nhật";
  const normalized = String(value).toLowerCase().trim();
  return freshnessLabelMap[normalized] || value;
}

export function getDifficultyLabel(value) {
  if (!value) return "Chưa cập nhật";
  const normalized = String(value).toLowerCase().trim();
  return difficultyLabelMap[normalized] || value;
}
