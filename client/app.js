const API_BASE =
  window.HAISAN_CONFIG?.API_BASE ||
  localStorage.getItem("haisan-api-base") ||
  "http://localhost:5000/api";

const app = document.querySelector("#app");
const toastRoot = document.querySelector("#toast-root");
const sectionIds = ["market", "fishermen", "recipes", "community", "seller", "admin"];
const DEMO_USER_KEY = "haisan-demo-user";

function sectionFromHash() {
  const section = window.location.hash.replace("#", "");
  return sectionIds.includes(section) ? section : "market";
}

const state = {
  user: null,
  apiOnline: false,
  loading: true,
  activeSection: sectionFromHash(),
  auth: {
    modalOpen: false,
  },
  filters: {
    search: "",
    type: "All",
    category: "All",
    sort: "fresh",
    nearMe: false,
    lat: null,
    lng: null,
  },
  data: {
    products: [],
    fishermen: [],
    recipes: [],
    posts: [],
  },
  seller: {
    loading: false,
    tab: "overview",
    products: [],
    recipes: [],
    posts: [],
    todayCount: null,
    lastSync: null,
  },
  admin: {
    loading: false,
    tab: "overview",
    stats: null,
    users: [],
    listings: [],
    reports: [],
    broadcasts: [],
    reportStatus: "Pending",
    search: "",
    listingStatus: "",
    lastSync: null,
  },
  meta: {
    products: { total: 0, page: 1, totalPages: 1 },
  },
  favorites: new Set(JSON.parse(localStorage.getItem("haisan-favorites") || "[]")),
  selectedProduct: null,
  selectedSeller: null,
};

const fallbackProducts = [
  {
    id: "demo-fresh-crab",
    sellerId: "demo-seller-1",
    sellerName: "Tàu Cô Ba Cần Giờ",
    sellerIsVerified: 1,
    sellerIsPremium: 1,
    sellerBadges: ["Nguồn gốc rõ", "Giao nhanh"],
    type: "Fresh",
    category: "Cua, ghẹ",
    name: "Cua gạch Cần Giờ",
    description: "Mẻ cua gạch chắc thịt, còn sống, giao trong buổi sáng.",
    price: 360000,
    salesType: "Retail",
    totalWeight: 24,
    remainingWeight: 11,
    origin: "Cần Giờ, TP.HCM",
    viewCount: 189,
    createdAt: new Date().toISOString(),
    coverImg: null,
  },
  {
    id: "demo-shrimp",
    sellerId: "demo-seller-2",
    sellerName: "Vựa Biển Bạc Liêu",
    sellerIsVerified: 1,
    sellerIsPremium: 0,
    sellerBadges: ["Đánh bắt trong ngày"],
    type: "Fresh",
    category: "Tôm",
    name: "Tôm sú oxy",
    description: "Tôm sú size lớn, đóng thùng xốp có oxy cho đơn nội thành.",
    price: 285000,
    salesType: "Wholesale",
    totalWeight: 60,
    remainingWeight: 38,
    origin: "Bạc Liêu",
    viewCount: 96,
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    coverImg: null,
  },
  {
    id: "demo-dried-squid",
    sellerId: "demo-seller-3",
    sellerName: "Làng Chài Phú Quốc",
    sellerIsVerified: 1,
    sellerIsPremium: 1,
    sellerBadges: ["Premium", "Đóng gói hút chân không"],
    type: "Dried",
    category: "Mực",
    name: "Mực một nắng Phú Quốc",
    description: "Mực câu phơi một nắng, vị ngọt đậm, hợp nướng hoặc rim me.",
    price: 520000,
    salesType: "Retail",
    totalWeight: 18,
    remainingWeight: 8,
    origin: "Phú Quốc, Kiên Giang",
    viewCount: 241,
    createdAt: new Date(Date.now() - 3600000 * 15).toISOString(),
    coverImg: null,
  },
  {
    id: "demo-fish",
    sellerId: "demo-seller-4",
    sellerName: "Thuyền Nhà Trần",
    sellerIsVerified: 0,
    sellerIsPremium: 0,
    sellerBadges: ["Giá sỉ"],
    type: "Fresh",
    category: "Cá",
    name: "Cá thu cắt khoanh",
    description: "Cá thu vừa cập bến, cắt khoanh theo yêu cầu, phù hợp quán ăn.",
    price: 210000,
    salesType: "Wholesale",
    totalWeight: 80,
    remainingWeight: 53,
    origin: "Nha Trang, Khánh Hòa",
    viewCount: 73,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    coverImg: null,
  },
];

const fallbackFishermen = [
  {
    id: "demo-seller-1",
    name: "Tàu Cô Ba Cần Giờ",
    bio: "Chuyên cua, ghẹ sống giao nhanh khu vực TP.HCM.",
    avatar: "",
    isVerified: true,
    isPremium: true,
    ratingAvg: 4.9,
    followersCount: 1240,
    productsCount: 18,
  },
  {
    id: "demo-seller-2",
    name: "Vựa Biển Bạc Liêu",
    bio: "Nguồn tôm, cá biển cho bếp gia đình và nhà hàng.",
    avatar: "",
    isVerified: true,
    isPremium: false,
    ratingAvg: 4.7,
    followersCount: 830,
    productsCount: 22,
  },
  {
    id: "demo-seller-3",
    name: "Làng Chài Phú Quốc",
    bio: "Đặc sản mực một nắng, cá khô và nước mắm gia đình.",
    avatar: "",
    isVerified: true,
    isPremium: true,
    ratingAvg: 5,
    followersCount: 2100,
    productsCount: 31,
  },
];

const fallbackRecipes = [
  {
    id: "demo-recipe-1",
    title: "Cua hấp sả gừng",
    description: "Giữ vị ngọt của cua sống, ăn cùng muối tiêu chanh.",
    difficulty: "Easy",
    cookingTime: 25,
    servings: 3,
    tags: ["Cua", "Hấp"],
    views: 420,
    likes: [1, 2, 3, 4],
  },
  {
    id: "demo-recipe-2",
    title: "Mực một nắng rim me",
    description: "Món nhắm chua ngọt, làm nhanh trên chảo nóng.",
    difficulty: "Medium",
    cookingTime: 35,
    servings: 4,
    tags: ["Mực", "Rim"],
    views: 315,
    likes: [1, 2],
  },
  {
    id: "demo-recipe-3",
    title: "Lẩu cá thu chua cay",
    description: "Nước dùng trong, cay nhẹ, hợp bữa tối cuối tuần.",
    difficulty: "Medium",
    cookingTime: 45,
    servings: 5,
    tags: ["Cá", "Lẩu"],
    views: 287,
    likes: [1, 2, 3],
  },
];

const fallbackPosts = [
  {
    id: "demo-post-1",
    title: "Cách chọn cua còn khỏe khi mua online",
    content: "Ưu tiên người bán có giờ bắt, ảnh mẻ hàng và cam kết đổi trả rõ ràng.",
    userName: "Buyer Minh",
    tags: ["Kinh nghiệm", "Cua"],
    likes: [1, 2, 3],
    comments: [{ text: "Mẹo rất hữu ích." }],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "demo-post-2",
    title: "Khu vực nào giao hải sản tươi tốt ở TP.HCM?",
    content: "Mình đang tìm seller có giao sáng sớm cho quán nhỏ ở Bình Thạnh.",
    userName: "Bếp Mộc",
    tags: ["Giao hàng", "TP.HCM"],
    likes: [1],
    comments: [],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

const demoBuyerUser = {
  id: "demo-buyer-1",
  name: "Buyer Minh",
  role: "Buyer",
  accountType: "Buyer",
  email: "buyer@haisan.vn",
  isDemo: true,
};

const demoSellerUser = {
  id: "demo-seller-1",
  name: "Tàu Cô Ba Cần Giờ",
  role: "Seller",
  accountType: "Seller",
  email: "seller@haisan.vn",
  isVerified: true,
  isPremium: true,
  avatarUrl: "",
  isDemo: true,
};

const productCategories = [
  ["Fish", "Cá"],
  ["Shrimp", "Tôm"],
  ["Squid", "Mực"],
  ["Crab", "Cua, ghẹ"],
  ["Shellfish", "Nghêu, sò, ốc"],
  ["Others", "Khác"],
];

const sellerStatusLabels = {
  Active: "Đang bán",
  Expired: "Hết hạn",
  Deleted: "Đã xóa",
};

const demoAdminUser = {
  id: "demo-admin-1",
  name: "Admin HaiSan.vn",
  role: "Admin",
  accountType: "Admin",
  email: "admin@haisan.vn",
  isDemo: true,
};

const adminStatusLabels = {
  Active: "Đang bán",
  Expired: "Hết hạn",
  Deleted: "Đã xóa",
  Pending: "Chờ xử lý",
  Resolved: "Đã xử lý",
  Dismissed: "Đã bỏ qua",
};

const demoAdminUsers = [
  {
    id: "demo-seller-1",
    name: "Tàu Cô Ba Cần Giờ",
    email: "coba@haisan.vn",
    role: "User",
    isActive: 1,
    isVerified: 1,
    postCount: 18,
  },
  {
    id: "demo-seller-2",
    name: "Vựa Biển Bạc Liêu",
    email: "baclieu@haisan.vn",
    role: "User",
    isActive: 1,
    isVerified: 1,
    postCount: 22,
  },
  {
    id: "demo-seller-3",
    name: "Làng Chài Phú Quốc",
    email: "phuquoc@haisan.vn",
    role: "User",
    isActive: 1,
    isVerified: 1,
    postCount: 31,
  },
  {
    id: "demo-buyer-1",
    name: "Buyer Minh",
    email: "minh@example.com",
    role: "User",
    isActive: 1,
    isVerified: 0,
    postCount: 0,
  },
  {
    id: "demo-buyer-2",
    name: "Bếp Mộc",
    email: "bepmoc@example.com",
    role: "User",
    isActive: 0,
    isVerified: 0,
    postCount: 0,
  },
];

const demoAdminReports = [
  {
    id: "demo-report-1",
    reason: "Ảnh sản phẩm chưa khớp mô tả mẻ hàng.",
    status: "Pending",
    reporterName: "Buyer Minh",
    productName: "Tôm sú oxy",
    sellerName: "Vựa Biển Bạc Liêu",
    productId: "demo-shrimp",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "demo-report-2",
    reason: "Giá hiển thị khác giá chốt trong chat.",
    status: "Pending",
    reporterName: "Lan Anh",
    productName: "Cá thu cắt khoanh",
    sellerName: "Thuyền Nhà Trần",
    productId: "demo-fish",
    createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
  },
  {
    id: "demo-report-3",
    reason: "Báo cáo trùng, seller đã cập nhật lại ảnh.",
    status: "Dismissed",
    reporterName: "Bếp Mộc",
    productName: "Mực một nắng Phú Quốc",
    sellerName: "Làng Chài Phú Quốc",
    productId: "demo-dried-squid",
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
];

const demoAdminBroadcasts = [
  {
    id: "demo-broadcast-1",
    content: "Nhắc seller cập nhật tồn kho trước 9h sáng để buyer đặt hàng chính xác.",
    targetRole: "Seller",
    sentCount: 72,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "demo-broadcast-2",
    content: "HaiSan.vn sẽ bảo trì ngắn lúc 23h tối nay.",
    targetRole: "all",
    sentCount: 1280,
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
];

function buildDemoAdminListings() {
  return fallbackProducts.map((item, index) => ({
    id: getId(item),
    name: item.name,
    type: item.type,
    status: index === fallbackProducts.length - 1 ? "Expired" : item.status || "Active",
    price: item.price,
    remainingWeight: item.remainingWeight,
    createdAt: item.createdAt,
    sellerName: item.sellerName,
    sellerEmail: `seller${index + 1}@haisan.vn`,
    coverImg: productImage(item),
  }));
}

function buildDemoTrend(seed) {
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(Date.now() - (6 - index) * 86400000);
    return {
      date: date.toISOString().slice(0, 10),
      count: seed + ((index * 3) % 7),
    };
  });
}

function buildDemoAdminStats() {
  const listings = buildDemoAdminListings();
  return {
    totalUsers: demoAdminUsers.length,
    verifiedUsers: demoAdminUsers.filter((item) => Number(item.isVerified) === 1).length,
    activeFresh: listings.filter((item) => item.type === "Fresh" && item.status === "Active").length,
    activeDried: listings.filter((item) => item.type === "Dried" && item.status === "Active").length,
    expiredTotal: listings.filter((item) => item.status === "Expired").length,
    totalReviews: 47,
    avgRating: 4.8,
    totalMessages: 128,
    totalFollows: 421,
    postsPerDay: buildDemoTrend(3),
    usersPerDay: buildDemoTrend(2),
    topSellers: demoAdminUsers
      .filter((item) => item.postCount > 0)
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        name: item.name,
        isVerified: item.isVerified,
        postCount: item.postCount,
        avgRating: item.id === "demo-seller-3" ? 5 : 4.8,
      })),
  };
}

function userAudience(user = state.user) {
  if (!user) return "buyer";
  if (user.role === "Admin" || user.accountType === "Admin") return "admin";
  if (
    user.role === "Seller" ||
    user.accountType === "Seller" ||
    user.isSeller ||
    user.isVerified ||
    user.isPremium
  ) {
    return "seller";
  }
  return "buyer";
}

function defaultSectionForAudience(audience = userAudience()) {
  if (audience === "admin") return "admin";
  if (audience === "seller") return "seller";
  return "market";
}

function sectionsForAudience(audience = userAudience()) {
  if (audience === "admin") return ["admin"];
  if (audience === "seller") return ["seller"];
  return ["market", "fishermen", "recipes", "community"];
}

function normalizeSectionForAudience(section = state.activeSection, audience = userAudience()) {
  const allowed = sectionsForAudience(audience);
  return allowed.includes(section) ? section : defaultSectionForAudience(audience);
}

function roleLabel(user = state.user) {
  if (!user) return "Guest";
  const audience = userAudience(user);
  if (audience === "admin") return "Admin";
  if (audience === "seller") return "Seller";
  return "Buyer";
}

function storedDemoUser() {
  try {
    const raw = localStorage.getItem(DEMO_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(DEMO_USER_KEY);
    return null;
  }
}

function demoUserForAudience(audience) {
  if (audience === "admin") return { ...demoAdminUser };
  if (audience === "seller") return { ...demoSellerUser };
  return { ...demoBuyerUser };
}

function currentSeller() {
  return userAudience() === "seller" ? state.user || demoSellerUser : demoSellerUser;
}

function isDemoSellerMode() {
  return state.user?.isDemo || userAudience() !== "seller";
}

function sellerProfile() {
  const seller = currentSeller();
  return {
    id: seller.id,
    name: seller.name || "Seller",
    isVerified: !!seller.isVerified,
    isPremium: !!seller.isPremium,
    avatarUrl: seller.avatarUrl || seller.avatar || "",
  };
}

function currentAdmin() {
  return userAudience() === "admin" ? state.user || demoAdminUser : demoAdminUser;
}

function isDemoAdminMode() {
  return state.user?.isDemo || userAudience() !== "admin";
}

function adminProfile() {
  const admin = currentAdmin();
  return {
    id: admin.id,
    name: admin.name || "Admin",
    email: admin.email || "admin@haisan.vn",
  };
}

function categoryLabel(value) {
  return productCategories.find(([key]) => key === value)?.[1] || value || "Hải sản";
}

function splitLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitTags(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeList(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function getId(item) {
  return String(item?.id || item?._id || "");
}

function getCookie(name) {
  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=") || "";
}

async function apiFetch(path, options = {}) {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(options.params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "All") {
      url.searchParams.set(key, value);
    }
  });

  const method = options.method || "GET";
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  const init = {
    method,
    headers,
    credentials: "include",
    signal: null,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 3500);
  init.signal = controller.signal;

  if (options.body) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(options.body);
  }

  if (method !== "GET") {
    const csrfToken = getCookie("csrfToken");
    if (csrfToken) headers.set("x-csrf-token", csrfToken);
  }

  let response;
  let body;
  try {
    response = await fetch(url, init);
    const contentType = response.headers.get("content-type") || "";
    body = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const message = typeof body === "string" ? body : body?.message;
    throw new Error(message || `HTTP ${response.status}`);
  }

  return body;
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

function formatDate(value) {
  if (!value) return "Mới cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Mới cập nhật";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initials(name = "HS") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return (parts.at(0)?.at(0) || "H") + (parts.at(-1)?.at(0) || "S");
}

function productImage(product) {
  return product.coverImg || product.images?.[0]?.url || product.images?.[0] || "./assets/seafood-market.png";
}

function categoryOptions(products) {
  const categories = products.map((item) => item.category).filter(Boolean);
  return ["All", ...Array.from(new Set(categories))];
}

function saveFavorites() {
  localStorage.setItem("haisan-favorites", JSON.stringify([...state.favorites]));
}

function showToast(message, type = "info") {
  const node = document.createElement("div");
  node.className = `toast toast-${type}`;
  node.textContent = message;
  toastRoot.appendChild(node);
  setTimeout(() => node.classList.add("is-visible"), 10);
  setTimeout(() => {
    node.classList.remove("is-visible");
    setTimeout(() => node.remove(), 220);
  }, 3200);
}

function activateSectionForCurrentUser() {
  state.activeSection = normalizeSectionForAudience(sectionFromHash());
  const desiredHash = `#${state.activeSection}`;
  if (window.location.hash !== desiredHash) {
    window.history.replaceState(null, "", desiredHash);
  }
}

function setDemoUser(audience) {
  state.user = demoUserForAudience(audience);
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(state.user));
  state.auth.modalOpen = false;
  state.selectedProduct = null;
  state.selectedSeller = null;
  state.activeSection = defaultSectionForAudience(userAudience());
  window.history.replaceState(null, "", `#${state.activeSection}`);
  render();
  if (userAudience() === "seller") loadSellerData();
  if (userAudience() === "admin") loadAdminData();
  showToast(`Đã đăng nhập demo ${roleLabel(state.user)}.`);
}

async function logoutUser() {
  const wasDemo = !!state.user?.isDemo;
  try {
    if (!wasDemo && state.user) {
      await apiFetch("/auth/logout", { method: "POST", timeoutMs: 5000 });
    }
  } catch {
    showToast("Đã đăng xuất ở frontend; backend chưa phản hồi logout.", "warn");
  }

  localStorage.removeItem(DEMO_USER_KEY);
  state.user = null;
  state.auth.modalOpen = false;
  state.selectedProduct = null;
  state.selectedSeller = null;
  state.activeSection = "market";
  window.history.replaceState(null, "", "#market");
  render();
  showToast("Đã về chế độ Guest/Buyer.");
}

async function loadData() {
  state.loading = true;
  render();

  const params = {
    page: 1,
    limit: 24,
    search: state.filters.search,
    type: state.filters.type,
    category: state.filters.category,
    lat: state.filters.nearMe ? state.filters.lat : null,
    lng: state.filters.nearMe ? state.filters.lng : null,
  };

  try {
    const [health, products, fishermen, recipes, posts] = await Promise.allSettled([
      apiFetch("/health"),
      apiFetch("/products", { params }),
      apiFetch("/fishermen", { params: { limit: 9 } }),
      apiFetch("/recipes", { params: { limit: 6 } }),
      apiFetch("/posts", { params: { limit: 6 } }),
    ]);

    state.apiOnline = health.status === "fulfilled";
    if (products.status === "fulfilled") {
      state.data.products = normalizeList(products.value, "products");
      state.meta.products = {
        total: products.value.total || state.data.products.length,
        page: products.value.page || 1,
        totalPages: products.value.totalPages || 1,
      };
    } else {
      state.data.products = fallbackProducts;
      state.meta.products = { total: fallbackProducts.length, page: 1, totalPages: 1 };
    }

    state.data.fishermen =
      fishermen.status === "fulfilled"
        ? normalizeList(fishermen.value, "fishermen")
        : fallbackFishermen;
    state.data.recipes =
      recipes.status === "fulfilled"
        ? normalizeList(recipes.value, "recipes")
        : fallbackRecipes;
    state.data.posts =
      posts.status === "fulfilled" ? normalizeList(posts.value, "posts") : fallbackPosts;

    if (!state.data.products.length) state.data.products = fallbackProducts;
    if (!state.data.fishermen.length) state.data.fishermen = fallbackFishermen;
    if (!state.data.recipes.length) state.data.recipes = fallbackRecipes;
    if (!state.data.posts.length) state.data.posts = fallbackPosts;
  } catch {
    state.apiOnline = false;
    state.data.products = fallbackProducts;
    state.data.fishermen = fallbackFishermen;
    state.data.recipes = fallbackRecipes;
    state.data.posts = fallbackPosts;
  } finally {
    state.loading = false;
    render();
  }
}

async function loadUser() {
  try {
    state.user = await apiFetch("/auth/me");
  } catch {
    state.user = storedDemoUser();
  }
  activateSectionForCurrentUser();
  render();
  if (userAudience() === "seller") loadSellerData();
  if (userAudience() === "admin") loadAdminData();
}

async function loadSellerData() {
  if (userAudience() !== "seller") {
    state.seller.loading = false;
    return;
  }

  state.seller.loading = true;
  render();

  const demoProducts = fallbackProducts
    .filter((item) => item.sellerId === demoSellerUser.id)
    .map((item) => ({ ...item, status: item.status || "Active", category: "Crab" }));
  const demoRecipes = fallbackRecipes.map((item) => ({
    ...item,
    authorId: demoSellerUser.id,
  }));
  const demoPosts = fallbackPosts.map((item) => ({
    ...item,
    userId: demoSellerUser.id,
  }));

  if (!state.user) {
    state.seller.products = demoProducts;
    state.seller.recipes = demoRecipes;
    state.seller.posts = demoPosts;
    state.seller.todayCount = { count: demoProducts.length, max: 5, isPremium: true };
    state.seller.lastSync = new Date().toISOString();
    state.seller.loading = false;
    render();
    return;
  }

  try {
    const [products, todayCount, recipes, posts] = await Promise.allSettled([
      apiFetch("/products/my", { params: { limit: 50 }, timeoutMs: 5000 }),
      apiFetch("/products/today-count", { timeoutMs: 5000 }),
      apiFetch("/recipes", {
        params: { authorId: state.user.id, limit: 24 },
        timeoutMs: 5000,
      }),
      apiFetch("/posts", {
        params: { userId: state.user.id, limit: 24 },
        timeoutMs: 5000,
      }),
    ]);

    state.seller.products =
      products.status === "fulfilled" ? normalizeList(products.value, "products") : demoProducts;
    state.seller.todayCount =
      todayCount.status === "fulfilled"
        ? todayCount.value
        : { count: state.seller.products.length, max: 5, isPremium: !!state.user.isPremium };
    state.seller.recipes =
      recipes.status === "fulfilled" ? normalizeList(recipes.value, "recipes") : demoRecipes;
    state.seller.posts =
      posts.status === "fulfilled" ? normalizeList(posts.value, "posts") : demoPosts;
    state.seller.lastSync = new Date().toISOString();
  } catch {
    state.seller.products = demoProducts;
    state.seller.recipes = demoRecipes;
    state.seller.posts = demoPosts;
    state.seller.todayCount = { count: demoProducts.length, max: 5, isPremium: true };
  } finally {
    state.seller.loading = false;
    render();
  }
}

async function loadAdminData() {
  if (userAudience() !== "admin") {
    state.admin.loading = false;
    return;
  }

  state.admin.loading = true;
  render();

  const demoListings = buildDemoAdminListings();
  const demoReports = demoAdminReports.filter((item) => item.status === state.admin.reportStatus);

  if (isDemoAdminMode()) {
    state.admin.stats = buildDemoAdminStats();
    state.admin.users = demoAdminUsers;
    state.admin.listings = demoListings;
    state.admin.reports = demoReports;
    state.admin.broadcasts = demoAdminBroadcasts;
    state.admin.lastSync = new Date().toISOString();
    state.admin.loading = false;
    render();
    return;
  }

  try {
    const [stats, users, listings, reports, broadcasts] = await Promise.allSettled([
      apiFetch("/admin/stats", { timeoutMs: 6000 }),
      apiFetch("/admin/users", {
        params: { limit: 20, search: state.admin.search },
        timeoutMs: 6000,
      }),
      apiFetch("/admin/listings", {
        params: {
          limit: 20,
          search: state.admin.search,
          status: state.admin.listingStatus,
        },
        timeoutMs: 6000,
      }),
      apiFetch("/reports", {
        params: { limit: 20, status: state.admin.reportStatus },
        timeoutMs: 6000,
      }),
      apiFetch("/admin/notifications/broadcasts", { timeoutMs: 6000 }),
    ]);

    state.admin.stats = stats.status === "fulfilled" ? stats.value : buildDemoAdminStats();
    state.admin.users =
      users.status === "fulfilled" ? normalizeList(users.value, "users") : demoAdminUsers;
    state.admin.listings =
      listings.status === "fulfilled" ? normalizeList(listings.value, "listings") : demoListings;
    state.admin.reports =
      reports.status === "fulfilled" ? normalizeList(reports.value, "reports") : demoReports;
    state.admin.broadcasts =
      broadcasts.status === "fulfilled"
        ? normalizeList(broadcasts.value, "broadcasts")
        : demoAdminBroadcasts;
    state.admin.lastSync = new Date().toISOString();
  } catch {
    state.admin.stats = buildDemoAdminStats();
    state.admin.users = demoAdminUsers;
    state.admin.listings = demoListings;
    state.admin.reports = demoReports;
    state.admin.broadcasts = demoAdminBroadcasts;
  } finally {
    state.admin.loading = false;
    render();
  }
}

function visibleProducts() {
  const term = state.filters.search.trim().toLowerCase();
  const products = state.data.products.filter((item) => {
    const matchesText =
      !term ||
      [item.name, item.description, item.sellerName, item.origin, item.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    const matchesType = state.filters.type === "All" || item.type === state.filters.type;
    const matchesCategory =
      state.filters.category === "All" || item.category === state.filters.category;
    return matchesText && matchesType && matchesCategory;
  });

  return products.sort((a, b) => {
    if (state.filters.sort === "price-low") return Number(a.price) - Number(b.price);
    if (state.filters.sort === "price-high") return Number(b.price) - Number(a.price);
    if (state.filters.sort === "popular") return Number(b.viewCount || 0) - Number(a.viewCount || 0);
    return new Date(b.bumpedAt || b.createdAt || 0) - new Date(a.bumpedAt || a.createdAt || 0);
  });
}

function renderHeaderOnly() {
  const header = document.querySelector("[data-header-user]");
  if (header) header.innerHTML = renderUserButton();
}

function render() {
  const products = visibleProducts();
  const audience = userAudience();
  const startSection = defaultSectionForAudience(audience);
  app.innerHTML = `
    <header class="shell-header ${audience}-header">
      <a class="brand" href="#${startSection}" data-nav="${startSection}" aria-label="HaiSan.vn">
        <span class="brand-mark">HS</span>
        <span>
          <strong>HaiSan.vn</strong>
          <small>${escapeHtml(roleLabel(state.user))} frontend</small>
        </span>
      </a>
      <nav class="top-nav ${audience}-top-nav" aria-label="Khu vực chính">
        ${renderNavForAudience(audience)}
      </nav>
      <div class="header-actions" data-header-user>${renderUserButton()}</div>
    </header>

    <main>
      ${renderMainForAudience(audience, products)}
    </main>

    <footer class="site-footer">
      <span>HaiSan.vn phase 3 role split</span>
      <span>${state.apiOnline ? "API online" : "Đang dùng dữ liệu mẫu"}</span>
      <span>${escapeHtml(API_BASE)}</span>
    </footer>

    ${state.selectedProduct ? renderProductModal(state.selectedProduct) : ""}
    ${state.selectedSeller ? renderSellerModal(state.selectedSeller) : ""}
    ${state.auth.modalOpen ? renderLoginModal() : ""}
  `;

  bindEvents();
}

function renderNavForAudience(audience) {
  if (audience === "admin") return renderAdminHeaderTabs();
  if (audience === "seller") return renderSellerHeaderTabs();
  return `
    ${navButton("market", "Chợ biển")}
    ${navButton("fishermen", "Ngư dân")}
    ${navButton("recipes", "Bếp biển")}
    ${navButton("community", "Cộng đồng")}
  `;
}

function renderMainForAudience(audience, products) {
  if (audience === "admin") return renderAdminWorkspace();
  if (audience === "seller") return renderSellerWorkspace();
  return `
    ${renderMarket(products)}
    ${renderFishermen()}
    ${renderRecipes()}
    ${renderCommunity()}
  `;
}

function navButton(section, label) {
  const active = state.activeSection === section ? "is-active" : "";
  return `<a class="nav-link ${active}" href="#${section}" data-nav="${section}">${label}</a>`;
}

function renderSellerHeaderTabs() {
  return `
    ${sellerHeaderTabButton("overview", "Tổng quan")}
    ${sellerHeaderTabButton("products", "Mẻ hàng")}
    ${sellerHeaderTabButton("recipes", "Công thức")}
    ${sellerHeaderTabButton("posts", "Bài viết")}
    ${sellerHeaderTabButton("messages", "Tin nhắn")}
  `;
}

function sellerHeaderTabButton(tab, label) {
  const active = state.seller.tab === tab ? "is-active" : "";
  return `<button class="nav-link ${active}" type="button" data-seller-tab="${tab}">${escapeHtml(label)}</button>`;
}

function renderAdminHeaderTabs() {
  return `
    ${adminHeaderTabButton("overview", "Tổng quan")}
    ${adminHeaderTabButton("users", "User/Seller")}
    ${adminHeaderTabButton("listings", "Sản phẩm")}
    ${adminHeaderTabButton("reports", "Báo cáo")}
    ${adminHeaderTabButton("broadcasts", "Broadcast")}
  `;
}

function adminHeaderTabButton(tab, label) {
  const active = state.admin.tab === tab ? "is-active" : "";
  return `<button class="nav-link ${active}" type="button" data-admin-tab="${tab}">${escapeHtml(label)}</button>`;
}

function renderUserButton() {
  if (state.user) {
    return `
      <div class="auth-actions">
        <button class="user-chip" type="button" data-login title="Đổi tài khoản">
          <span class="avatar mini">${escapeHtml(initials(state.user.name))}</span>
          <span>
            ${escapeHtml(state.user.name || "User")}
            <small>${escapeHtml(roleLabel(state.user))}${state.user.isDemo ? " demo" : ""}</small>
          </span>
        </button>
        <button class="ghost-button icon-only" type="button" data-logout title="Đăng xuất" aria-label="Đăng xuất">
          <span class="button-icon">×</span>
        </button>
      </div>
    `;
  }

  return `
    <button class="ghost-button" type="button" data-login title="Đăng nhập buyer">
      <span class="button-icon">↗</span>
      <span>Đăng nhập</span>
    </button>
  `;
}

function renderLoginModal() {
  return `
    <div class="modal-layer" role="dialog" aria-modal="true" aria-label="Đăng nhập">
      <div class="modal-panel auth-modal">
        <button class="icon-button close-button" type="button" data-close-auth aria-label="Đóng">×</button>
        <div class="auth-head">
          <span class="eyebrow">Role login</span>
          <h2>Chọn giao diện đăng nhập</h2>
          <p>Guest chưa đăng nhập luôn dùng frontend Buyer. Ba nút dưới đây tạo session demo để xem đúng frontend theo từng loại user.</p>
        </div>
        <div class="auth-role-grid">
          ${renderAuthRoleCard("buyer", "Buyer", "Mua hải sản, xem seller, lưu sản phẩm quan tâm.", "Chợ biển")}
          ${renderAuthRoleCard("seller", "Seller", "Quản lý mẻ hàng, công thức, bài viết và tin nhắn buyer.", "Workspace")}
          ${renderAuthRoleCard("admin", "Admin", "Theo dõi hệ thống, duyệt seller, xử lý report và broadcast.", "Control room")}
        </div>
        <div class="auth-note">
          <button class="ghost-button" type="button" data-google-login>
            <span class="button-icon">G</span>
            <span>Nối Google OAuth backend</span>
          </button>
          <small>Backend hiện có <code>/auth/google</code>, <code>/auth/me</code>, <code>/auth/logout</code>; frontend demo dùng localStorage để test đủ role khi chưa có OAuth credential.</small>
        </div>
      </div>
    </div>
  `;
}

function renderAuthRoleCard(audience, title, description, cta) {
  return `
    <button class="auth-role-card ${audience}" type="button" data-demo-login="${audience}">
      <span class="avatar large">${escapeHtml(initials(title))}</span>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(description)}</span>
      <small>${escapeHtml(cta)}</small>
    </button>
  `;
}

function renderMarket(products) {
  const categories = categoryOptions(state.data.products);
  return `
    <section id="market" class="hero-band section-band" data-section="market">
      <div class="hero-visual" aria-hidden="true"></div>
      <div class="hero-content">
        <div class="hero-copy">
          <span class="eyebrow">Guest và Buyer</span>
          <h1>Chợ hải sản tươi theo mẻ, theo vị trí, theo người bán thật.</h1>
          <p>
            Xem mẻ hàng đang bán, so sánh giá, mở hồ sơ ngư dân và lưu sản phẩm quan tâm trong cùng một giao diện.
          </p>
        </div>
        <form class="search-panel" data-search-form>
          <label class="search-box">
            <span>Tìm</span>
            <input
              type="search"
              name="search"
              value="${escapeHtml(state.filters.search)}"
              placeholder="cua, tôm, mực một nắng..."
              autocomplete="off"
            />
          </label>
          <label class="select-box">
            <span>Loại</span>
            <select name="category">
              ${categories
                .map(
                  (category) =>
                    `<option value="${escapeHtml(category)}" ${state.filters.category === category ? "selected" : ""}>${category === "All" ? "Tất cả" : escapeHtml(category)}</option>`,
                )
                .join("")}
            </select>
          </label>
          <button class="primary-button" type="submit">
            <span class="button-icon">⌕</span>
            <span>Tìm hàng</span>
          </button>
        </form>
      </div>
    </section>

    <section class="section-band market-layout">
      <aside class="filter-rail" aria-label="Bộ lọc sản phẩm">
        <div class="rail-block">
          <span class="control-label">Nhóm hàng</span>
          <div class="segmented" role="group" aria-label="Loại hải sản">
            ${segmentButton("All", "Tất cả")}
            ${segmentButton("Fresh", "Tươi")}
            ${segmentButton("Dried", "Khô")}
          </div>
        </div>
        <label class="switch-row">
          <input type="checkbox" data-near-me ${state.filters.nearMe ? "checked" : ""} />
          <span class="switch-ui"></span>
          <span>Gần tôi</span>
        </label>
        <label class="select-box compact">
          <span>Sắp xếp</span>
          <select data-sort>
            <option value="fresh" ${state.filters.sort === "fresh" ? "selected" : ""}>Mới nhất</option>
            <option value="popular" ${state.filters.sort === "popular" ? "selected" : ""}>Xem nhiều</option>
            <option value="price-low" ${state.filters.sort === "price-low" ? "selected" : ""}>Giá thấp</option>
            <option value="price-high" ${state.filters.sort === "price-high" ? "selected" : ""}>Giá cao</option>
          </select>
        </label>
        <div class="status-panel">
          <strong>${products.length}</strong>
          <span>mẻ hàng phù hợp</span>
          <small>${state.apiOnline ? "Đang đồng bộ backend" : "Preview bằng dữ liệu mẫu"}</small>
        </div>
      </aside>

      <div class="content-column">
        <div class="section-title-row">
          <div>
            <span class="eyebrow">Marketplace</span>
            <h2>Mẻ hàng nổi bật</h2>
          </div>
          <button class="ghost-button" type="button" data-refresh title="Tải lại dữ liệu">
            <span class="button-icon">↻</span>
            <span>Làm mới</span>
          </button>
        </div>
        ${
          state.loading
            ? renderSkeletonGrid(6)
            : `<div class="product-grid">${products.map(renderProductCard).join("")}</div>`
        }
      </div>
    </section>
  `;
}

function segmentButton(value, label) {
  const selected = state.filters.type === value ? "is-selected" : "";
  return `<button class="${selected}" type="button" data-type="${value}">${label}</button>`;
}

function renderProductCard(product) {
  const id = getId(product);
  const isFavorite = state.favorites.has(id);
  const verified = product.sellerIsVerified || product.isVerified;
  const premium = product.sellerIsPremium || product.isPremium;
  return `
    <article class="product-card">
      <button class="image-button" type="button" data-product="${escapeHtml(id)}" title="Xem chi tiết">
        <img src="${escapeHtml(productImage(product))}" alt="${escapeHtml(product.name)}" loading="lazy" />
        <span class="type-badge ${product.type === "Fresh" ? "fresh" : "dried"}">${product.type === "Fresh" ? "Tươi" : "Khô"}</span>
      </button>
      <div class="product-body">
        <div class="card-topline">
          <span>${escapeHtml(product.category || "Hải sản")}</span>
          <button
            class="icon-button favorite ${isFavorite ? "is-active" : ""}"
            type="button"
            data-favorite="${escapeHtml(id)}"
            title="${isFavorite ? "Bỏ lưu" : "Lưu sản phẩm"}"
            aria-label="${isFavorite ? "Bỏ lưu" : "Lưu sản phẩm"}"
          >♡</button>
        </div>
        <h3>${escapeHtml(product.name || "Mẻ hải sản")}</h3>
        <p>${escapeHtml(product.description || "Thông tin mẻ hàng sẽ được cập nhật.")}</p>
        <div class="price-row">
          <strong>${formatCurrency(product.price)}</strong>
          <span>${escapeHtml(product.salesType === "Wholesale" ? "bán sỉ" : "bán lẻ")}</span>
        </div>
        <div class="seller-row">
          <button class="seller-link" type="button" data-seller="${escapeHtml(product.sellerId || "")}">
            <span class="avatar">${escapeHtml(initials(product.sellerName))}</span>
            <span>
              ${escapeHtml(product.sellerName || "Một ngư dân")}
              <small>${verified ? "Đã xác minh" : "Hồ sơ mới"}${premium ? " · Premium" : ""}</small>
            </span>
          </button>
        </div>
        <div class="meta-row">
          <span>${escapeHtml(product.origin || "Nguồn gốc đang cập nhật")}</span>
          <span>${Number(product.remainingWeight || product.totalWeight || 0)} kg còn lại</span>
        </div>
      </div>
    </article>
  `;
}

function renderFishermen() {
  return `
    <section id="fishermen" class="section-band" data-section="fishermen">
      <div class="section-container">
        <div class="section-title-row">
          <div>
            <span class="eyebrow">Seller network</span>
            <h2>Ngư dân nên theo dõi</h2>
          </div>
          <a class="text-link" href="#market" data-nav="market">Xem hàng đang bán</a>
        </div>
        <div class="seller-grid">
          ${state.data.fishermen.map(renderSellerCard).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderSellerCard(seller) {
  const id = getId(seller);
  return `
    <article class="seller-card">
      <button class="seller-card-main" type="button" data-seller="${escapeHtml(id)}">
        <span class="avatar large">${escapeHtml(initials(seller.name))}</span>
        <span>
          <strong>${escapeHtml(seller.name || "Ngư dân")}</strong>
          <small>${seller.isVerified ? "Đã xác minh" : "Hồ sơ mới"}${seller.isPremium ? " · Premium" : ""}</small>
        </span>
      </button>
      <p>${escapeHtml(seller.bio || seller.description || "Đang cập nhật thông tin hồ sơ.")}</p>
      <div class="seller-stats">
        <span><strong>${Number(seller.ratingAvg || seller.rating || 4.8).toFixed(1)}</strong> sao</span>
        <span><strong>${seller.productsCount || seller.productCount || 0}</strong> mẻ</span>
        <span><strong>${seller.followersCount || seller.followers || 0}</strong> theo dõi</span>
      </div>
    </article>
  `;
}

function renderRecipes() {
  return `
    <section id="recipes" class="section-band muted-band" data-section="recipes">
      <div class="section-container">
        <div class="section-title-row">
          <div>
            <span class="eyebrow">Kitchen</span>
            <h2>Bếp biển cho buyer</h2>
          </div>
        </div>
        <div class="recipe-grid">
          ${state.data.recipes.map(renderRecipeCard).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderRecipeCard(recipe) {
  const tags = Array.isArray(recipe.tags) ? recipe.tags.slice(0, 3) : [];
  const likes = Array.isArray(recipe.likes) ? recipe.likes.length : Number(recipe.likeCount || 0);
  return `
    <article class="recipe-card">
      <div class="recipe-image">
        <img src="${escapeHtml(recipe.imageUrl || "./assets/seafood-market.png")}" alt="${escapeHtml(recipe.title)}" loading="lazy" />
      </div>
      <div class="recipe-body">
        <span class="pill">${escapeHtml(recipe.difficulty || "Medium")}</span>
        <h3>${escapeHtml(recipe.title || "Công thức hải sản")}</h3>
        <p>${escapeHtml(recipe.description || "Cách chế biến sẽ được cập nhật.")}</p>
        <div class="meta-row">
          <span>${Number(recipe.cookingTime || 30)} phút</span>
          <span>${Number(recipe.servings || 2)} phần</span>
          <span>${likes} thích</span>
        </div>
        <div class="tag-row">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
    </article>
  `;
}

function renderCommunity() {
  return `
    <section id="community" class="section-band" data-section="community">
      <div class="section-container">
        <div class="section-title-row">
          <div>
            <span class="eyebrow">Forum</span>
            <h2>Câu chuyện mua bán</h2>
          </div>
        </div>
        <div class="post-list">
          ${state.data.posts.map(renderPostCard).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderSellerWorkspace() {
  const profile = sellerProfile();
  const products = state.seller.products;
  const activeProducts = products.filter((item) => (item.status || "Active") === "Active");
  const totalStock = products.reduce(
    (sum, item) => sum + Number(item.remainingWeight || item.totalWeight || 0),
    0,
  );
  const stockValue = products.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.remainingWeight || item.totalWeight || 0),
    0,
  );
  const today = state.seller.todayCount || {
    count: products.length,
    max: 5,
    isPremium: profile.isPremium,
  };

  return `
    <section id="seller" class="section-band seller-band" data-section="seller">
      <div class="section-container seller-shell">
        <div class="seller-hero">
          <div class="seller-identity">
            <span class="avatar xl">${escapeHtml(initials(profile.name))}</span>
            <div>
              <span class="eyebrow">Seller workspace</span>
              <h2>${escapeHtml(profile.name)}</h2>
              <p>
                Quản lý mẻ hàng, nội dung bán hàng và tương tác buyer trong một màn hình làm việc gọn.
              </p>
              <div class="tag-row">
                <span>${profile.isVerified ? "Đã xác minh" : "Chưa xác minh"}</span>
                <span>${profile.isPremium ? "Premium" : "Tài khoản thường"}</span>
                <span>${isDemoSellerMode() ? "Demo mode" : "Đang dùng tài khoản thật"}</span>
              </div>
            </div>
          </div>
          <div class="seller-sync">
            <strong>${state.seller.loading ? "Đang đồng bộ" : "Sẵn sàng"}</strong>
            <span>${state.seller.lastSync ? `Cập nhật ${formatDate(state.seller.lastSync)}` : "Chưa đồng bộ"}</span>
          </div>
        </div>

        <div class="seller-metrics">
          ${renderMetric("Mẻ đang bán", activeProducts.length, "sản phẩm")}
          ${renderMetric("Tồn khả dụng", totalStock.toFixed(1), "kg")}
          ${renderMetric("Giá trị tồn", formatCurrency(stockValue), "ước tính")}
          ${renderMetric("Hạn mức hôm nay", `${today.count || 0}/${today.isPremium ? "∞" : today.max || 5}`, "bài đăng")}
        </div>

        <div class="seller-panel">
          ${renderSellerPanel()}
        </div>
      </div>
    </section>
  `;
}

function renderMetric(label, value, suffix) {
  return `
    <article class="seller-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(suffix)}</small>
    </article>
  `;
}

function renderSellerPanel() {
  if (state.seller.tab === "products") return renderSellerProducts();
  if (state.seller.tab === "recipes") return renderSellerRecipes();
  if (state.seller.tab === "posts") return renderSellerPosts();
  if (state.seller.tab === "messages") return renderSellerMessages();
  return renderSellerOverview();
}

function renderSellerOverview() {
  const newestProducts = state.seller.products.slice(0, 3);
  return `
    <div class="seller-overview">
      <section class="seller-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Next actions</span>
            <h3>Việc nên làm hôm nay</h3>
          </div>
        </div>
        <div class="task-list">
          <button type="button" data-seller-tab="products">
            <strong>Đăng mẻ hàng mới</strong>
            <span>Thêm giá, tồn kho, vị trí bán và ảnh đại diện.</span>
          </button>
          <button type="button" data-seller-tab="recipes">
            <strong>Chia sẻ công thức</strong>
            <span>Tăng độ tin cậy bằng nội dung bếp biển.</span>
          </button>
          <button type="button" data-seller-tab="messages">
            <strong>Kiểm tra buyer</strong>
            <span>Theo dõi tin nhắn, thông báo và yêu cầu gọi.</span>
          </button>
        </div>
      </section>
      <section class="seller-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Inventory</span>
            <h3>Mẻ hàng mới nhất</h3>
          </div>
          <button class="ghost-button" type="button" data-refresh-seller>
            <span class="button-icon">↻</span>
            <span>Đồng bộ</span>
          </button>
        </div>
        <div class="seller-mini-list">
          ${
            newestProducts.length
              ? newestProducts.map(renderSellerMiniProduct).join("")
              : `<p class="empty-note">Chưa có mẻ hàng nào.</p>`
          }
        </div>
      </section>
    </div>
  `;
}

function renderSellerMiniProduct(product) {
  return `
    <article class="mini-product">
      <img src="${escapeHtml(productImage(product))}" alt="${escapeHtml(product.name)}" />
      <div>
        <strong>${escapeHtml(product.name || "Mẻ hàng")}</strong>
        <span>${formatCurrency(product.price)} · ${Number(product.remainingWeight || product.totalWeight || 0)} kg</span>
      </div>
      <small>${escapeHtml(sellerStatusLabels[product.status] || product.status || "Đang bán")}</small>
    </article>
  `;
}

function renderSellerProducts() {
  return `
    <div class="seller-two-column">
      <section class="seller-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Create listing</span>
            <h3>Đăng mẻ hàng</h3>
          </div>
        </div>
        <form class="seller-form" data-seller-product-form>
          <label>
            <span>Tên mẻ hàng</span>
            <input name="name" required minlength="2" placeholder="Cua gạch Cần Giờ" />
          </label>
          <div class="form-grid-2">
            <label>
              <span>Loại</span>
              <select name="type">
                <option value="Fresh">Tươi sống</option>
                <option value="Dried">Đồ khô</option>
              </select>
            </label>
            <label>
              <span>Danh mục</span>
              <select name="category">
                ${productCategories
                  .map(([value, label]) => `<option value="${value}">${label}</option>`)
                  .join("")}
              </select>
            </label>
          </div>
          <div class="form-grid-2">
            <label>
              <span>Giá / kg</span>
              <input name="price" type="number" min="1" required placeholder="250000" />
            </label>
            <label>
              <span>Khối lượng kg</span>
              <input name="totalWeight" type="number" min="0.1" step="0.1" required placeholder="20" />
            </label>
          </div>
          <div class="form-grid-2">
            <label>
              <span>Hình thức</span>
              <select name="salesType">
                <option value="Retail">Bán lẻ</option>
                <option value="Wholesale">Bán sỉ</option>
              </select>
            </label>
            <label>
              <span>Xuất xứ</span>
              <input name="origin" placeholder="Cần Giờ, TP.HCM" />
            </label>
          </div>
          <div class="form-grid-2">
            <label>
              <span>Vĩ độ bán</span>
              <input name="lat" type="number" step="0.000001" value="10.762622" />
            </label>
            <label>
              <span>Kinh độ bán</span>
              <input name="lng" type="number" step="0.000001" value="106.660172" />
            </label>
          </div>
          <label>
            <span>Ảnh URL</span>
            <input name="imageUrl" type="url" placeholder="https://..." />
          </label>
          <label>
            <span>Mô tả</span>
            <textarea name="description" rows="4" placeholder="Mô tả độ tươi, cách đóng gói, thời gian giao..."></textarea>
          </label>
          <button class="primary-button" type="submit">
            <span class="button-icon">＋</span>
            <span>Đăng mẻ hàng</span>
          </button>
        </form>
      </section>

      <section class="seller-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Listings</span>
            <h3>Sản phẩm của tôi</h3>
          </div>
          <button class="ghost-button" type="button" data-refresh-seller>
            <span class="button-icon">↻</span>
            <span>Tải lại</span>
          </button>
        </div>
        <div class="seller-product-list">
          ${
            state.seller.products.length
              ? state.seller.products.map(renderSellerProductItem).join("")
              : `<p class="empty-note">Chưa có sản phẩm. Hãy đăng mẻ đầu tiên.</p>`
          }
        </div>
      </section>
    </div>
  `;
}

function renderSellerProductItem(product) {
  const id = getId(product);
  return `
    <article class="seller-product-item">
      <img src="${escapeHtml(productImage(product))}" alt="${escapeHtml(product.name)}" />
      <div>
        <div class="card-topline">
          <span>${escapeHtml(categoryLabel(product.category))}</span>
          <span>${escapeHtml(sellerStatusLabels[product.status] || product.status || "Đang bán")}</span>
        </div>
        <h4>${escapeHtml(product.name || "Mẻ hàng")}</h4>
        <p>${escapeHtml(product.description || "Chưa có mô tả.")}</p>
        <div class="meta-row">
          <span>${formatCurrency(product.price)}</span>
          <span>${Number(product.remainingWeight || product.totalWeight || 0)} kg còn</span>
          <span>${formatDate(product.bumpedAt || product.createdAt)}</span>
        </div>
      </div>
      <div class="item-actions">
        <button class="ghost-button" type="button" data-seller-bump="${escapeHtml(id)}">
          <span class="button-icon">↑</span>
          <span>Đẩy tin</span>
        </button>
        <button class="ghost-button danger" type="button" data-seller-delete="${escapeHtml(id)}">
          <span class="button-icon">×</span>
          <span>Xóa</span>
        </button>
      </div>
    </article>
  `;
}

function renderSellerRecipes() {
  return `
    <div class="seller-two-column">
      <section class="seller-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Kitchen content</span>
            <h3>Viết công thức</h3>
          </div>
        </div>
        <form class="seller-form" data-seller-recipe-form>
          <label>
            <span>Tiêu đề</span>
            <input name="title" required placeholder="Cua hấp sả gừng" />
          </label>
          <label>
            <span>Mô tả</span>
            <textarea name="description" required rows="3" placeholder="Giới thiệu ngắn về món ăn"></textarea>
          </label>
          <div class="form-grid-2">
            <label>
              <span>Độ khó</span>
              <select name="difficulty">
                <option value="Easy">Dễ</option>
                <option value="Medium">Vừa</option>
                <option value="Hard">Khó</option>
              </select>
            </label>
            <label>
              <span>Thời gian phút</span>
              <input name="cookingTime" type="number" min="1" value="30" />
            </label>
          </div>
          <label>
            <span>Nguyên liệu mỗi dòng</span>
            <textarea name="ingredients" required rows="4" placeholder="2 con cua&#10;3 cây sả&#10;Gừng, muối tiêu"></textarea>
          </label>
          <label>
            <span>Các bước mỗi dòng</span>
            <textarea name="instructions" required rows="4" placeholder="Rửa sạch cua&#10;Đập dập sả gừng&#10;Hấp 15 phút"></textarea>
          </label>
          <label>
            <span>Tags</span>
            <input name="tags" placeholder="Cua, Hấp, Nhanh" />
          </label>
          <button class="primary-button" type="submit">
            <span class="button-icon">＋</span>
            <span>Đăng công thức</span>
          </button>
        </form>
      </section>
      <section class="seller-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">My recipes</span>
            <h3>Công thức của tôi</h3>
          </div>
        </div>
        <div class="seller-content-list">
          ${
            state.seller.recipes.length
              ? state.seller.recipes.map(renderSellerRecipeItem).join("")
              : `<p class="empty-note">Chưa có công thức.</p>`
          }
        </div>
      </section>
    </div>
  `;
}

function renderSellerRecipeItem(recipe) {
  const likes = Array.isArray(recipe.likes) ? recipe.likes.length : Number(recipe.likeCount || 0);
  return `
    <article class="seller-content-item">
      <span class="pill">${escapeHtml(recipe.difficulty || "Medium")}</span>
      <h4>${escapeHtml(recipe.title || "Công thức")}</h4>
      <p>${escapeHtml(recipe.description || "Chưa có mô tả.")}</p>
      <div class="meta-row">
        <span>${Number(recipe.cookingTime || 30)} phút</span>
        <span>${likes} thích</span>
      </div>
    </article>
  `;
}

function renderSellerPosts() {
  return `
    <div class="seller-two-column">
      <section class="seller-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Community</span>
            <h3>Viết bài bán hàng</h3>
          </div>
        </div>
        <form class="seller-form" data-seller-post-form>
          <label>
            <span>Tiêu đề</span>
            <input name="title" required placeholder="Mẻ cua sáng nay đã cập bến" />
          </label>
          <label>
            <span>Nội dung</span>
            <textarea name="content" required rows="7" placeholder="Kể câu chuyện mẻ hàng, cách đặt, khu vực giao..."></textarea>
          </label>
          <label>
            <span>Ảnh URL, cách nhau bằng dấu phẩy</span>
            <input name="images" placeholder="https://..." />
          </label>
          <label>
            <span>Tags</span>
            <input name="tags" placeholder="Cua, Cần Giờ, Giao sáng" />
          </label>
          <button class="primary-button" type="submit">
            <span class="button-icon">＋</span>
            <span>Đăng bài</span>
          </button>
        </form>
      </section>
      <section class="seller-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">My posts</span>
            <h3>Bài viết của tôi</h3>
          </div>
        </div>
        <div class="seller-content-list">
          ${
            state.seller.posts.length
              ? state.seller.posts.map(renderSellerPostItem).join("")
              : `<p class="empty-note">Chưa có bài viết.</p>`
          }
        </div>
      </section>
    </div>
  `;
}

function renderSellerPostItem(post) {
  const likes = Array.isArray(post.likes) ? post.likes.length : Number(post.likeCount || 0);
  const comments = Array.isArray(post.comments) ? post.comments.length : 0;
  return `
    <article class="seller-content-item">
      <h4>${escapeHtml(post.title || "Bài viết")}</h4>
      <p>${escapeHtml(post.content || "")}</p>
      <div class="meta-row">
        <span>${likes} thích</span>
        <span>${comments} bình luận</span>
        <span>${formatDate(post.createdAt)}</span>
      </div>
    </article>
  `;
}

function renderSellerMessages() {
  return `
    <div class="seller-overview">
      <section class="seller-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Inbox</span>
            <h3>Tin nhắn buyer</h3>
          </div>
        </div>
        <div class="message-list">
          <article>
            <strong>Buyer Minh</strong>
            <span>Hỏi còn cua size lớn giao Bình Thạnh sáng mai không?</span>
            <small>Chờ phản hồi</small>
          </article>
          <article>
            <strong>Bếp Mộc</strong>
            <span>Cần báo giá sỉ tôm sú 15kg mỗi ngày.</span>
            <small>Ưu tiên</small>
          </article>
          <article>
            <strong>Lan Anh</strong>
            <span>Muốn đặt lịch gọi video xem mẻ hàng trước khi chốt.</span>
            <small>Video call</small>
          </article>
        </div>
      </section>
      <section class="seller-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Notifications</span>
            <h3>Thông báo vận hành</h3>
          </div>
        </div>
        <div class="task-list">
          <button type="button" data-login>
            <strong>Kết nối Socket.IO</strong>
            <span>Đăng nhập seller thật để nhận realtime message từ backend.</span>
          </button>
          <button type="button" data-seller-tab="products">
            <strong>Cập nhật tồn kho</strong>
            <span>Ưu tiên các mẻ còn ít hàng hoặc đã quá 24 giờ chưa đẩy tin.</span>
          </button>
        </div>
      </section>
    </div>
  `;
}

function renderAdminWorkspace() {
  const profile = adminProfile();
  const stats = state.admin.stats || buildDemoAdminStats();
  const pendingReports = state.admin.reports.filter((item) => item.status === "Pending").length;
  const totalListings =
    Number(stats.activeFresh || 0) + Number(stats.activeDried || 0) + Number(stats.expiredTotal || 0);

  return `
    <section id="admin" class="section-band admin-band" data-section="admin">
      <div class="section-container admin-shell">
        <div class="admin-hero">
          <div class="admin-identity">
            <span class="avatar xl">${escapeHtml(initials(profile.name))}</span>
            <div>
              <span class="eyebrow">Admin control</span>
              <h2>${escapeHtml(profile.name)}</h2>
              <p>
                Theo dõi vận hành, duyệt seller, kiểm soát sản phẩm bị báo cáo và phát thông báo hệ thống.
              </p>
              <div class="tag-row">
                <span>${escapeHtml(profile.email)}</span>
                <span>${isDemoAdminMode() ? "Demo mode" : "Admin session"}</span>
                <span>${state.admin.loading ? "Đang đồng bộ" : "Sẵn sàng"}</span>
              </div>
            </div>
          </div>
          <div class="admin-sync">
            <strong>${state.admin.loading ? "Đang tải" : "Control room"}</strong>
            <span>${state.admin.lastSync ? `Cập nhật ${formatDate(state.admin.lastSync)}` : "Chưa đồng bộ"}</span>
          </div>
        </div>

        <div class="admin-metrics">
          ${renderAdminMetric("Người dùng", stats.totalUsers || 0, `${stats.verifiedUsers || 0} đã xác minh`)}
          ${renderAdminMetric("Tin đang kiểm soát", totalListings, `${stats.expiredTotal || 0} hết hạn`)}
          ${renderAdminMetric("Tin nhắn", stats.totalMessages || 0, "toàn hệ thống")}
          ${renderAdminMetric("Báo cáo chờ", pendingReports, "cần xử lý")}
        </div>

        <div class="admin-panel">
          ${renderAdminPanel()}
        </div>
      </div>
    </section>
  `;
}

function renderAdminMetric(label, value, suffix) {
  return `
    <article class="admin-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(suffix)}</small>
    </article>
  `;
}

function renderAdminPanel() {
  if (state.admin.tab === "users") return renderAdminUsers();
  if (state.admin.tab === "listings") return renderAdminListings();
  if (state.admin.tab === "reports") return renderAdminReports();
  if (state.admin.tab === "broadcasts") return renderAdminBroadcasts();
  return renderAdminOverview();
}

function renderAdminOverview() {
  const stats = state.admin.stats || buildDemoAdminStats();
  const newestReports = state.admin.reports.slice(0, 3);
  return `
    <div class="admin-two-column">
      <section class="admin-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Operations</span>
            <h3>Tín hiệu 7 ngày</h3>
          </div>
          <button class="ghost-button" type="button" data-refresh-admin>
            <span class="button-icon">↻</span>
            <span>Đồng bộ</span>
          </button>
        </div>
        <div class="admin-chart">
          <div>
            <strong>Bài đăng</strong>
            ${renderAdminTrendBars(stats.postsPerDay || [])}
          </div>
          <div>
            <strong>User mới</strong>
            ${renderAdminTrendBars(stats.usersPerDay || [])}
          </div>
        </div>
      </section>
      <section class="admin-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Moderation</span>
            <h3>Việc cần xử lý</h3>
          </div>
        </div>
        <div class="task-list admin-task-list">
          <button type="button" data-admin-tab="reports">
            <strong>${newestReports.length} báo cáo đang hiển thị</strong>
            <span>Kiểm tra lý do, seller liên quan và quyết định giải quyết hoặc bỏ qua.</span>
          </button>
          <button type="button" data-admin-tab="users">
            <strong>${state.admin.users.filter((item) => Number(item.isVerified) !== 1).length} hồ sơ chưa xác minh</strong>
            <span>Duyệt tích xanh cho seller đủ thông tin nguồn hàng.</span>
          </button>
          <button type="button" data-admin-tab="broadcasts">
            <strong>${state.admin.broadcasts.length} broadcast gần đây</strong>
            <span>Gửi thông báo vận hành theo nhóm người nhận.</span>
          </button>
        </div>
      </section>
      <section class="admin-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Top sellers</span>
            <h3>Người bán nổi bật</h3>
          </div>
        </div>
        <div class="admin-list">
          ${
            (stats.topSellers || []).length
              ? stats.topSellers.map(renderAdminTopSeller).join("")
              : `<p class="empty-note">Chưa có dữ liệu seller.</p>`
          }
        </div>
      </section>
      <section class="admin-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Reports</span>
            <h3>Báo cáo mới</h3>
          </div>
        </div>
        <div class="admin-list">
          ${
            newestReports.length
              ? newestReports.map(renderAdminReportMini).join("")
              : `<p class="empty-note">Không có báo cáo trong bộ lọc hiện tại.</p>`
          }
        </div>
      </section>
    </div>
  `;
}

function renderAdminTrendBars(rows) {
  const max = Math.max(1, ...rows.map((item) => Number(item.count || 0)));
  return `
    <div class="admin-bars">
      ${rows
        .map(
          (item) => `
            <span title="${escapeHtml(item.date)}: ${Number(item.count || 0)}">
              <i style="height: ${Math.max(10, (Number(item.count || 0) / max) * 100)}%"></i>
            </span>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderAdminTopSeller(seller) {
  return `
    <article class="admin-list-item">
      <span class="avatar mini">${escapeHtml(initials(seller.name))}</span>
      <div>
        <strong>${escapeHtml(seller.name || "Seller")}</strong>
        <span>${Number(seller.postCount || 0)} bài đăng · ${Number(seller.avgRating || 0).toFixed(1)} sao</span>
      </div>
      <small>${Number(seller.isVerified) === 1 ? "Đã xác minh" : "Chưa xác minh"}</small>
    </article>
  `;
}

function renderAdminReportMini(report) {
  return `
    <article class="admin-list-item">
      <span class="status-dot"></span>
      <div>
        <strong>${escapeHtml(report.productName || "Sản phẩm")}</strong>
        <span>${escapeHtml(report.reason || "Không có lý do")} · ${escapeHtml(report.sellerName || "Seller")}</span>
      </div>
      <small>${formatDate(report.createdAt)}</small>
    </article>
  `;
}

function renderAdminUsers() {
  return `
    <div class="admin-two-column">
      <section class="admin-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Directory</span>
            <h3>Tra cứu tài khoản</h3>
          </div>
        </div>
        <form class="admin-form" data-admin-search-form>
          <label>
            <span>Từ khóa</span>
            <input name="search" value="${escapeHtml(state.admin.search)}" placeholder="Tên hoặc email" />
          </label>
          <button class="primary-button" type="submit">
            <span class="button-icon">⌕</span>
            <span>Tìm</span>
          </button>
        </form>
      </section>
      <section class="admin-work-card admin-wide-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Accounts</span>
            <h3>User và seller</h3>
          </div>
          <button class="ghost-button" type="button" data-refresh-admin>
            <span class="button-icon">↻</span>
            <span>Tải lại</span>
          </button>
        </div>
        <div class="admin-table-list">
          ${
            state.admin.users.length
              ? state.admin.users.map(renderAdminUserItem).join("")
              : `<p class="empty-note">Chưa có tài khoản phù hợp.</p>`
          }
        </div>
      </section>
    </div>
  `;
}

function renderAdminUserItem(user) {
  const id = getId(user);
  const active = Number(user.isActive) !== 0;
  const verified = Number(user.isVerified) === 1 || user.isVerified === true;
  return `
    <article class="admin-row">
      <div>
        <strong>${escapeHtml(user.name || "Người dùng")}</strong>
        <span>${escapeHtml(user.email || "Chưa có email")}</span>
      </div>
      <span>${escapeHtml(user.role || "User")}</span>
      <span>${Number(user.postCount || 0)} bài</span>
      <span>${verified ? "Đã xác minh" : "Chưa xác minh"}</span>
      <span>${active ? "Đang hoạt động" : "Đang khóa"}</span>
      <div class="item-actions">
        <button class="ghost-button" type="button" data-admin-verify="${escapeHtml(id)}">
          <span class="button-icon">✓</span>
          <span>${verified ? "Thu hồi" : "Duyệt"}</span>
        </button>
        <button class="ghost-button danger" type="button" data-admin-toggle-user="${escapeHtml(id)}">
          <span class="button-icon">${active ? "×" : "↻"}</span>
          <span>${active ? "Khóa" : "Mở"}</span>
        </button>
      </div>
    </article>
  `;
}

function renderAdminListings() {
  return `
    <div class="admin-two-column">
      <section class="admin-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Inventory control</span>
            <h3>Lọc sản phẩm</h3>
          </div>
        </div>
        <form class="admin-form" data-admin-listing-filter>
          <label>
            <span>Từ khóa</span>
            <input name="search" value="${escapeHtml(state.admin.search)}" placeholder="Tên sản phẩm hoặc seller" />
          </label>
          <label>
            <span>Trạng thái</span>
            <select name="status">
              <option value="" ${state.admin.listingStatus === "" ? "selected" : ""}>Tất cả</option>
              <option value="Active" ${state.admin.listingStatus === "Active" ? "selected" : ""}>Đang bán</option>
              <option value="Expired" ${state.admin.listingStatus === "Expired" ? "selected" : ""}>Hết hạn</option>
              <option value="Deleted" ${state.admin.listingStatus === "Deleted" ? "selected" : ""}>Đã xóa</option>
            </select>
          </label>
          <button class="primary-button" type="submit">
            <span class="button-icon">⌕</span>
            <span>Lọc</span>
          </button>
        </form>
      </section>
      <section class="admin-work-card admin-wide-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Listings</span>
            <h3>Sản phẩm toàn sàn</h3>
          </div>
        </div>
        <div class="admin-table-list">
          ${
            state.admin.listings.length
              ? state.admin.listings.map(renderAdminListingItem).join("")
              : `<p class="empty-note">Không có sản phẩm phù hợp.</p>`
          }
        </div>
      </section>
    </div>
  `;
}

function renderAdminListingItem(listing) {
  const id = getId(listing);
  return `
    <article class="admin-row listing-row">
      <img src="${escapeHtml(productImage(listing))}" alt="${escapeHtml(listing.name)}" />
      <div>
        <strong>${escapeHtml(listing.name || "Sản phẩm")}</strong>
        <span>${escapeHtml(listing.sellerName || "Seller")} · ${formatCurrency(listing.price)}</span>
      </div>
      <span>${escapeHtml(listing.type || "Fresh")}</span>
      <span>${escapeHtml(adminStatusLabels[listing.status] || listing.status || "Đang bán")}</span>
      <span>${Number(listing.remainingWeight || 0)} kg</span>
      <div class="item-actions">
        <button class="ghost-button danger" type="button" data-admin-delete-listing="${escapeHtml(id)}">
          <span class="button-icon">×</span>
          <span>Xóa</span>
        </button>
      </div>
    </article>
  `;
}

function renderAdminReports() {
  return `
    <div class="admin-two-column">
      <section class="admin-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Reports</span>
            <h3>Bộ lọc báo cáo</h3>
          </div>
        </div>
        <form class="admin-form" data-admin-report-filter>
          <label>
            <span>Trạng thái</span>
            <select name="status">
              <option value="Pending" ${state.admin.reportStatus === "Pending" ? "selected" : ""}>Chờ xử lý</option>
              <option value="Resolved" ${state.admin.reportStatus === "Resolved" ? "selected" : ""}>Đã xử lý</option>
              <option value="Dismissed" ${state.admin.reportStatus === "Dismissed" ? "selected" : ""}>Đã bỏ qua</option>
            </select>
          </label>
          <button class="primary-button" type="submit">
            <span class="button-icon">⌕</span>
            <span>Lọc báo cáo</span>
          </button>
        </form>
      </section>
      <section class="admin-work-card admin-wide-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Moderation queue</span>
            <h3>Hàng chờ xử lý</h3>
          </div>
        </div>
        <div class="admin-table-list">
          ${
            state.admin.reports.length
              ? state.admin.reports.map(renderAdminReportItem).join("")
              : `<p class="empty-note">Không có báo cáo trong trạng thái này.</p>`
          }
        </div>
      </section>
    </div>
  `;
}

function renderAdminReportItem(report) {
  const id = getId(report);
  return `
    <article class="admin-row report-row">
      <div>
        <strong>${escapeHtml(report.productName || "Sản phẩm")}</strong>
        <span>${escapeHtml(report.reason || "Không có lý do")}</span>
      </div>
      <span>${escapeHtml(report.reporterName || "Người báo cáo")}</span>
      <span>${escapeHtml(report.sellerName || "Seller")}</span>
      <span>${escapeHtml(adminStatusLabels[report.status] || report.status || "Chờ xử lý")}</span>
      <span>${formatDate(report.createdAt)}</span>
      <div class="item-actions">
        <button class="ghost-button danger" type="button" data-admin-resolve-report="${escapeHtml(id)}">
          <span class="button-icon">!</span>
          <span>Giải quyết</span>
        </button>
        <button class="ghost-button" type="button" data-admin-dismiss-report="${escapeHtml(id)}">
          <span class="button-icon">✓</span>
          <span>Bỏ qua</span>
        </button>
      </div>
    </article>
  `;
}

function renderAdminBroadcasts() {
  return `
    <div class="admin-two-column">
      <section class="admin-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Broadcast</span>
            <h3>Gửi thông báo</h3>
          </div>
        </div>
        <form class="admin-form" data-admin-broadcast-form>
          <label>
            <span>Nhóm nhận</span>
            <select name="targetRole">
              <option value="all">Tất cả</option>
              <option value="Seller">Seller</option>
              <option value="Buyer">Buyer</option>
            </select>
          </label>
          <label>
            <span>Nội dung</span>
            <textarea name="content" maxlength="200" required rows="5" placeholder="Thông báo vận hành tối đa 200 ký tự"></textarea>
          </label>
          <button class="primary-button" type="submit">
            <span class="button-icon">↗</span>
            <span>Phát thông báo</span>
          </button>
        </form>
      </section>
      <section class="admin-work-card admin-wide-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">History</span>
            <h3>Lịch sử broadcast</h3>
          </div>
        </div>
        <div class="admin-list">
          ${
            state.admin.broadcasts.length
              ? state.admin.broadcasts.map(renderAdminBroadcastItem).join("")
              : `<p class="empty-note">Chưa có broadcast.</p>`
          }
        </div>
      </section>
    </div>
  `;
}

function renderAdminBroadcastItem(item) {
  return `
    <article class="admin-list-item">
      <span class="status-dot"></span>
      <div>
        <strong>${escapeHtml(item.content || "Thông báo")}</strong>
        <span>${escapeHtml(item.targetRole || "all")} · ${Number(item.sentCount || 0)} người nhận</span>
      </div>
      <small>${formatDate(item.createdAt)}</small>
    </article>
  `;
}

function renderPostCard(post) {
  const tags = Array.isArray(post.tags) ? post.tags.slice(0, 4) : [];
  const likes = Array.isArray(post.likes) ? post.likes.length : Number(post.likeCount || 0);
  const comments = Array.isArray(post.comments) ? post.comments.length : 0;
  return `
    <article class="post-card">
      <div class="post-author">
        <span class="avatar">${escapeHtml(initials(post.userName || post.authorName))}</span>
        <span>
          <strong>${escapeHtml(post.userName || post.authorName || "Buyer")}</strong>
          <small>${formatDate(post.createdAt)}</small>
        </span>
      </div>
      <div>
        <h3>${escapeHtml(post.title || "Bài viết cộng đồng")}</h3>
        <p>${escapeHtml(post.content || "")}</p>
        <div class="tag-row">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
      <div class="post-actions">
        <span>${likes} thích</span>
        <span>${comments} bình luận</span>
      </div>
    </article>
  `;
}

function renderRoadmap() {
  return `
    <section class="section-band roadmap-band">
      <div class="section-container">
        <div class="section-title-row">
          <div>
            <span class="eyebrow">Frontend mới</span>
            <h2>Ba giai đoạn triển khai</h2>
          </div>
        </div>
        <div class="roadmap-grid">
          <article class="roadmap-item is-done">
            <span>01</span>
            <h3>Guest và Buyer</h3>
            <p>Chợ biển, hồ sơ ngư dân, công thức, cộng đồng, lưu quan tâm.</p>
          </article>
          <article class="roadmap-item is-done">
            <span>02</span>
            <h3>Seller</h3>
            <p>Quản lý mẻ hàng, bài viết, công thức, tin nhắn và thông báo.</p>
          </article>
          <article class="roadmap-item is-done">
            <span>03</span>
            <h3>Admin</h3>
            <p>Duyệt người bán, kiểm soát sản phẩm, báo cáo và broadcast.</p>
          </article>
        </div>
      </div>
    </section>
  `;
}

function renderProductModal(product) {
  const images = product.images?.length ? product.images : [{ url: productImage(product), id: "cover" }];
  const favorite = state.favorites.has(getId(product));
  return `
    <div class="modal-layer" role="dialog" aria-modal="true" aria-label="Chi tiết sản phẩm">
      <div class="modal-panel product-modal">
        <button class="icon-button close-button" type="button" data-close-modal aria-label="Đóng">×</button>
        <div class="modal-media">
          <img src="${escapeHtml(images[0]?.url || images[0] || "./assets/seafood-market.png")}" alt="${escapeHtml(product.name)}" />
        </div>
        <div class="modal-content">
          <span class="type-badge ${product.type === "Fresh" ? "fresh" : "dried"}">${product.type === "Fresh" ? "Hải sản tươi" : "Hải sản khô"}</span>
          <h2>${escapeHtml(product.name || "Mẻ hải sản")}</h2>
          <p>${escapeHtml(product.description || "Thông tin chi tiết sẽ được cập nhật.")}</p>
          <div class="detail-price">${formatCurrency(product.price)}</div>
          <dl class="detail-list">
            <div><dt>Người bán</dt><dd>${escapeHtml(product.sellerName || "Một ngư dân")}</dd></div>
            <div><dt>Xuất xứ</dt><dd>${escapeHtml(product.origin || "Đang cập nhật")}</dd></div>
            <div><dt>Còn lại</dt><dd>${Number(product.remainingWeight || product.totalWeight || 0)} kg</dd></div>
            <div><dt>Cập nhật</dt><dd>${formatDate(product.bumpedAt || product.createdAt)}</dd></div>
          </dl>
          <div class="modal-actions">
            <button class="primary-button" type="button" data-contact-seller>
              <span class="button-icon">☎</span>
              <span>Liên hệ</span>
            </button>
            <button class="ghost-button" type="button" data-favorite="${escapeHtml(getId(product))}">
              <span class="button-icon">${favorite ? "♥" : "♡"}</span>
              <span>${favorite ? "Đã lưu" : "Lưu"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSellerModal(seller) {
  return `
    <div class="modal-layer" role="dialog" aria-modal="true" aria-label="Hồ sơ người bán">
      <div class="modal-panel seller-modal">
        <button class="icon-button close-button" type="button" data-close-modal aria-label="Đóng">×</button>
        <div class="seller-profile-head">
          <span class="avatar xl">${escapeHtml(initials(seller.name))}</span>
          <div>
            <span class="eyebrow">${seller.isPremium ? "Premium seller" : "Seller"}</span>
            <h2>${escapeHtml(seller.name || "Ngư dân")}</h2>
            <p>${escapeHtml(seller.bio || seller.description || "Đang cập nhật hồ sơ.")}</p>
          </div>
        </div>
        <div class="seller-stats big">
          <span><strong>${Number(seller.ratingAvg || seller.rating || 4.8).toFixed(1)}</strong> sao</span>
          <span><strong>${seller.productsCount || seller.productCount || 0}</strong> mẻ hàng</span>
          <span><strong>${seller.followersCount || seller.followers || 0}</strong> theo dõi</span>
        </div>
        <div class="modal-actions">
          <button class="primary-button" type="button" data-filter-seller="${escapeHtml(getId(seller))}">
            <span class="button-icon">⌕</span>
            <span>Xem hàng</span>
          </button>
          <button class="ghost-button" type="button" data-login>
            <span class="button-icon">＋</span>
            <span>Theo dõi</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderSkeletonGrid(count) {
  return `
    <div class="product-grid">
      ${Array.from({ length: count })
        .map(
          () => `
          <article class="product-card skeleton-card">
            <div class="skeleton image"></div>
            <div class="product-body">
              <div class="skeleton line short"></div>
              <div class="skeleton line"></div>
              <div class="skeleton line"></div>
              <div class="skeleton line short"></div>
            </div>
          </article>
        `,
        )
        .join("")}
    </div>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-nav]").forEach((node) => {
    node.addEventListener("click", () => {
      state.activeSection = normalizeSectionForAudience(node.dataset.nav);
      render();
    });
  });

  document.querySelector("[data-search-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.filters.search = String(formData.get("search") || "");
    state.filters.category = String(formData.get("category") || "All");
    loadData();
  });

  document.querySelectorAll("[data-type]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.type = button.dataset.type;
      loadData();
    });
  });

  document.querySelector("[data-sort]")?.addEventListener("change", (event) => {
    state.filters.sort = event.target.value;
    render();
  });

  document.querySelector("[data-near-me]")?.addEventListener("change", (event) => {
    state.filters.nearMe = event.target.checked;
    if (!state.filters.nearMe) {
      state.filters.lat = null;
      state.filters.lng = null;
      loadData();
      return;
    }
    if (!navigator.geolocation) {
      state.filters.nearMe = false;
      showToast("Trình duyệt chưa hỗ trợ lấy vị trí.", "warn");
      render();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        state.filters.lat = position.coords.latitude;
        state.filters.lng = position.coords.longitude;
        showToast("Đã bật lọc quanh vị trí hiện tại.");
        loadData();
      },
      () => {
        state.filters.nearMe = false;
        showToast("Không lấy được vị trí hiện tại.", "warn");
        render();
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });

  document.querySelector("[data-refresh]")?.addEventListener("click", () => loadData());

  document.querySelectorAll("[data-refresh-seller]").forEach((button) => {
    button.addEventListener("click", () => loadSellerData());
  });

  document.querySelectorAll("[data-refresh-admin]").forEach((button) => {
    button.addEventListener("click", () => loadAdminData());
  });

  document.querySelectorAll("[data-seller-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.seller.tab = button.dataset.sellerTab || "overview";
      state.activeSection = "seller";
      render();
    });
  });

  document.querySelectorAll("[data-admin-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.admin.tab = button.dataset.adminTab || "overview";
      state.activeSection = "admin";
      render();
    });
  });

  document.querySelector("[data-admin-search-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.admin.search = String(formData.get("search") || "").trim();
    state.admin.tab = "users";
    loadAdminData();
  });

  document.querySelector("[data-admin-listing-filter]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.admin.search = String(formData.get("search") || "").trim();
    state.admin.listingStatus = String(formData.get("status") || "");
    state.admin.tab = "listings";
    loadAdminData();
  });

  document.querySelector("[data-admin-report-filter]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.admin.reportStatus = String(formData.get("status") || "Pending");
    state.admin.tab = "reports";
    loadAdminData();
  });

  document.querySelectorAll("[data-admin-verify]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.adminVerify;
      if (!id) return;
      if (isDemoAdminMode() || id.startsWith("demo-")) {
        state.admin.users = state.admin.users.map((item) =>
          getId(item) === id
            ? { ...item, isVerified: Number(item.isVerified) === 1 ? 0 : 1 }
            : item,
        );
        state.admin.stats = buildDemoAdminStats();
        showToast("Đã cập nhật trạng thái xác minh demo.");
        render();
        return;
      }

      try {
        await apiFetch(`/admin/users/${id}/verify`, { method: "PATCH", timeoutMs: 7000 });
        showToast("Đã cập nhật xác minh.");
        loadAdminData();
      } catch (error) {
        showToast(error.message || "Không cập nhật được xác minh.", "warn");
      }
    });
  });

  document.querySelectorAll("[data-admin-toggle-user]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.adminToggleUser;
      if (!id) return;
      if (isDemoAdminMode() || id.startsWith("demo-")) {
        state.admin.users = state.admin.users.map((item) =>
          getId(item) === id ? { ...item, isActive: Number(item.isActive) === 1 ? 0 : 1 } : item,
        );
        showToast("Đã cập nhật trạng thái tài khoản demo.");
        render();
        return;
      }

      try {
        await apiFetch(`/admin/users/${id}/toggle`, { method: "PATCH", timeoutMs: 7000 });
        showToast("Đã cập nhật trạng thái tài khoản.");
        loadAdminData();
      } catch (error) {
        showToast(error.message || "Không cập nhật được tài khoản.", "warn");
      }
    });
  });

  document.querySelectorAll("[data-admin-delete-listing]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.adminDeleteListing;
      if (!id) return;
      if (isDemoAdminMode() || id.startsWith("demo-")) {
        state.admin.listings = state.admin.listings.filter((item) => getId(item) !== id);
        showToast("Đã xóa listing demo.");
        render();
        return;
      }

      if (!window.confirm("Admin xóa sản phẩm này khỏi sàn?")) return;
      try {
        await apiFetch(`/admin/listings/${id}`, { method: "DELETE", timeoutMs: 7000 });
        showToast("Đã xóa sản phẩm khỏi sàn.");
        loadAdminData();
      } catch (error) {
        showToast(error.message || "Không xóa được sản phẩm.", "warn");
      }
    });
  });

  document.querySelectorAll("[data-admin-resolve-report], [data-admin-dismiss-report]").forEach(
    (button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.adminResolveReport || button.dataset.adminDismissReport;
        const action = button.dataset.adminResolveReport ? "resolve" : "dismiss";
        if (!id) return;
        if (isDemoAdminMode() || id.startsWith("demo-")) {
          state.admin.reports = state.admin.reports.filter((item) => getId(item) !== id);
          showToast(action === "resolve" ? "Đã xử lý report demo." : "Đã bỏ qua report demo.");
          render();
          return;
        }

        try {
          await apiFetch(`/reports/${id}`, {
            method: "PATCH",
            body: {
              action,
              adminNote:
                action === "resolve"
                  ? "Admin đã xử lý từ dashboard."
                  : "Admin đã bỏ qua từ dashboard.",
            },
            timeoutMs: 7000,
          });
          showToast(action === "resolve" ? "Đã xử lý báo cáo." : "Đã bỏ qua báo cáo.");
          loadAdminData();
        } catch (error) {
          showToast(error.message || "Không xử lý được báo cáo.", "warn");
        }
      });
    },
  );

  document.querySelector("[data-admin-broadcast-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const content = String(formData.get("content") || "").trim();
    const targetRole = String(formData.get("targetRole") || "all");
    const body = { content, targetRole };

    if (isDemoAdminMode()) {
      state.admin.broadcasts = [
        {
          id: `demo-broadcast-${Date.now()}`,
          ...body,
          sentCount: targetRole === "Seller" ? 72 : targetRole === "Buyer" ? 1208 : 1280,
          createdAt: new Date().toISOString(),
        },
        ...state.admin.broadcasts,
      ];
      form.reset();
      showToast("Đã phát broadcast demo.");
      render();
      return;
    }

    try {
      await apiFetch("/admin/notifications/broadcast", {
        method: "POST",
        body,
        timeoutMs: 7000,
      });
      form.reset();
      showToast("Đã phát broadcast.");
      loadAdminData();
    } catch (error) {
      showToast(error.message || "Không phát được broadcast.", "warn");
    }
  });

  document.querySelector("[data-seller-product-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const totalWeight = Number(formData.get("totalWeight") || 0);
    const imageUrl = String(formData.get("imageUrl") || "").trim();
    const body = {
      type: String(formData.get("type") || "Fresh"),
      category: String(formData.get("category") || "Others"),
      name: String(formData.get("name") || "").trim(),
      price: Number(formData.get("price") || 0),
      totalWeight,
      remainingWeight: totalWeight,
      salesType: String(formData.get("salesType") || "Retail"),
      origin: String(formData.get("origin") || "").trim(),
      lat: Number(formData.get("lat") || 0),
      lng: Number(formData.get("lng") || 0),
      description: String(formData.get("description") || "").trim(),
      images: imageUrl ? [imageUrl] : [],
    };

    if (isDemoSellerMode()) {
      const profile = sellerProfile();
      state.seller.products = [
        {
          ...body,
          id: `demo-product-${Date.now()}`,
          sellerId: profile.id,
          sellerName: profile.name,
          sellerIsVerified: profile.isVerified,
          sellerIsPremium: profile.isPremium,
          status: "Active",
          coverImg: imageUrl || null,
          viewCount: 0,
          createdAt: new Date().toISOString(),
        },
        ...state.seller.products,
      ];
      form.reset();
      showToast("Đã thêm mẻ hàng demo.");
      render();
      return;
    }

    try {
      await apiFetch("/products", { method: "POST", body, timeoutMs: 7000 });
      form.reset();
      showToast("Đã đăng mẻ hàng mới.");
      loadSellerData();
    } catch (error) {
      showToast(error.message || "Không đăng được sản phẩm.", "warn");
    }
  });

  document.querySelectorAll("[data-seller-bump]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.sellerBump;
      if (!id) return;
      if (isDemoSellerMode() || id.startsWith("demo-")) {
        state.seller.products = state.seller.products.map((item) =>
          getId(item) === id ? { ...item, bumpedAt: new Date().toISOString() } : item,
        );
        showToast("Đã đẩy tin demo lên đầu danh sách.");
        render();
        return;
      }

      try {
        await apiFetch(`/products/${id}/bump`, { method: "POST", timeoutMs: 7000 });
        showToast("Đã đẩy tin sản phẩm.");
        loadSellerData();
      } catch (error) {
        showToast(error.message || "Không đẩy được tin.", "warn");
      }
    });
  });

  document.querySelectorAll("[data-seller-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.sellerDelete;
      if (!id) return;
      if (isDemoSellerMode() || id.startsWith("demo-")) {
        state.seller.products = state.seller.products.filter((item) => getId(item) !== id);
        showToast("Đã xóa sản phẩm demo.");
        render();
        return;
      }

      if (!window.confirm("Xóa sản phẩm này?")) return;
      try {
        await apiFetch(`/products/${id}`, { method: "DELETE", timeoutMs: 7000 });
        showToast("Đã xóa sản phẩm.");
        loadSellerData();
      } catch (error) {
        showToast(error.message || "Không xóa được sản phẩm.", "warn");
      }
    });
  });

  document.querySelector("[data-seller-recipe-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = {
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      ingredients: splitLines(formData.get("ingredients")),
      instructions: splitLines(formData.get("instructions")),
      difficulty: String(formData.get("difficulty") || "Medium"),
      cookingTime: Number(formData.get("cookingTime") || 30),
      servings: Number(formData.get("servings") || 2),
      tags: splitTags(formData.get("tags")),
    };

    if (isDemoSellerMode()) {
      state.seller.recipes = [
        {
          ...body,
          id: `demo-recipe-${Date.now()}`,
          authorId: sellerProfile().id,
          likes: [],
          views: 0,
          createdAt: new Date().toISOString(),
        },
        ...state.seller.recipes,
      ];
      form.reset();
      showToast("Đã thêm công thức demo.");
      render();
      return;
    }

    try {
      await apiFetch("/recipes", { method: "POST", body, timeoutMs: 7000 });
      form.reset();
      showToast("Đã đăng công thức.");
      loadSellerData();
    } catch (error) {
      showToast(error.message || "Không đăng được công thức.", "warn");
    }
  });

  document.querySelector("[data-seller-post-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = {
      title: String(formData.get("title") || "").trim(),
      content: String(formData.get("content") || "").trim(),
      images: splitTags(formData.get("images")),
      tags: splitTags(formData.get("tags")),
    };

    if (isDemoSellerMode()) {
      state.seller.posts = [
        {
          ...body,
          id: `demo-post-${Date.now()}`,
          userId: sellerProfile().id,
          userName: sellerProfile().name,
          likes: [],
          comments: [],
          createdAt: new Date().toISOString(),
        },
        ...state.seller.posts,
      ];
      form.reset();
      showToast("Đã thêm bài viết demo.");
      render();
      return;
    }

    try {
      await apiFetch("/posts", { method: "POST", body, timeoutMs: 7000 });
      form.reset();
      showToast("Đã đăng bài viết.");
      loadSellerData();
    } catch (error) {
      showToast(error.message || "Không đăng được bài viết.", "warn");
    }
  });

  document.querySelectorAll("[data-product]").forEach((button) => {
    button.addEventListener("click", async () => {
      const product = state.data.products.find((item) => getId(item) === button.dataset.product);
      state.selectedProduct = product;
      render();
      if (!product || String(product.id || "").startsWith("demo-")) return;
      try {
        state.selectedProduct = await apiFetch(`/products/${getId(product)}`);
        render();
      } catch {
        showToast("Không tải được chi tiết từ backend.", "warn");
      }
    });
  });

  document.querySelectorAll("[data-seller]").forEach((button) => {
    button.addEventListener("click", async () => {
      const sellerId = button.dataset.seller;
      if (!sellerId) return;
      const seller =
        state.data.fishermen.find((item) => getId(item) === sellerId) ||
        fallbackFishermen.find((item) => getId(item) === sellerId) ||
        { id: sellerId, name: "Ngư dân", bio: "Đang tải hồ sơ." };
      state.selectedSeller = seller;
      render();
      if (sellerId.startsWith("demo-")) return;
      try {
        state.selectedSeller = await apiFetch(`/fishermen/${sellerId}/profile`);
        render();
      } catch {
        showToast("Không tải được hồ sơ người bán.", "warn");
      }
    });
  });

  document.querySelectorAll("[data-favorite]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.favorite;
      if (!id) return;
      if (state.favorites.has(id)) state.favorites.delete(id);
      else state.favorites.add(id);
      saveFavorites();
      render();

      if (state.user && !id.startsWith("demo-")) {
        try {
          await apiFetch(`/favorites/${id}`, { method: "POST" });
        } catch {
          showToast("Đã lưu cục bộ; backend cần phiên đăng nhập hợp lệ.", "warn");
        }
      } else {
        showToast("Đã lưu trong trình duyệt.");
      }
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedProduct = null;
      state.selectedSeller = null;
      render();
    });
  });

  document.querySelectorAll("[data-login]").forEach((button) => {
    button.addEventListener("click", () => {
      state.auth.modalOpen = true;
      render();
    });
  });

  document.querySelectorAll("[data-demo-login]").forEach((button) => {
    button.addEventListener("click", () => {
      setDemoUser(button.dataset.demoLogin || "buyer");
    });
  });

  document.querySelector("[data-close-auth]")?.addEventListener("click", () => {
    state.auth.modalOpen = false;
    render();
  });

  document.querySelector("[data-google-login]")?.addEventListener("click", () => {
    showToast("Google OAuth cần credential từ Google Identity; frontend đã sẵn endpoint backend /auth/google.", "warn");
  });

  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => logoutUser());
  });

  document.querySelector("[data-contact-seller]")?.addEventListener("click", () => {
    if (!state.user) {
      state.auth.modalOpen = true;
      render();
      return;
    }
    showToast("Buyer đã đăng nhập sẽ mở chat hoặc đặt lịch gọi khi backend realtime được nối.");
  });

  document.querySelector("[data-filter-seller]")?.addEventListener("click", (event) => {
    const sellerId = event.currentTarget.dataset.filterSeller;
    const sellerProducts = state.data.products.filter((item) => item.sellerId === sellerId);
    state.selectedSeller = null;
    state.activeSection = "market";
    if (sellerProducts.length) {
      state.filters.search = "";
      state.filters.category = "All";
      state.data.products = sellerProducts;
      render();
    } else {
      showToast("Chưa có mẻ hàng public cho người bán này.", "warn");
      render();
    }
  });

  document.addEventListener("keydown", handleEscape, { once: true });
}

function handleEscape(event) {
  if (event.key === "Escape" && state.auth.modalOpen) {
    state.auth.modalOpen = false;
    render();
    return;
  }
  if (event.key === "Escape" && (state.selectedProduct || state.selectedSeller)) {
    state.selectedProduct = null;
    state.selectedSeller = null;
    render();
  }
}

activateSectionForCurrentUser();
render();
loadData();
loadUser();

window.addEventListener("hashchange", () => {
  const previousSection = state.activeSection;
  activateSectionForCurrentUser();
  if (state.activeSection !== previousSection) render();
});
