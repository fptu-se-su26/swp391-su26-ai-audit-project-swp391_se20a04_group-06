const API_BASE =
  window.HAISAN_CONFIG?.API_BASE ||
  localStorage.getItem("haisan-api-base") ||
  "http://localhost:5000/api";

const app = document.querySelector("#app");
const toastRoot = document.querySelector("#toast-root");

const state = {
  user: null,
  apiOnline: false,
  loading: true,
  activeSection: "market",
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

const demoSellerUser = {
  id: "demo-seller-1",
  name: "Tàu Cô Ba Cần Giờ",
  role: "User",
  isVerified: true,
  isPremium: true,
  avatarUrl: "",
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

function currentSeller() {
  return state.user || demoSellerUser;
}

function isDemoSellerMode() {
  return !state.user;
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
    state.user = null;
  }
  renderHeaderOnly();
  loadSellerData();
}

async function loadSellerData() {
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
  app.innerHTML = `
    <header class="shell-header">
      <a class="brand" href="#market" data-nav="market" aria-label="HaiSan.vn">
        <span class="brand-mark">HS</span>
        <span>
          <strong>HaiSan.vn</strong>
          <small>Buyer market</small>
        </span>
      </a>
      <nav class="top-nav" aria-label="Khu vực chính">
        ${navButton("market", "Chợ biển")}
        ${navButton("fishermen", "Ngư dân")}
        ${navButton("recipes", "Bếp biển")}
        ${navButton("community", "Cộng đồng")}
        ${navButton("seller", "Seller")}
      </nav>
      <div class="header-actions" data-header-user>${renderUserButton()}</div>
    </header>

    <main>
      ${renderMarket(products)}
      ${renderFishermen()}
      ${renderRecipes()}
      ${renderCommunity()}
      ${renderSellerWorkspace()}
      ${renderRoadmap()}
    </main>

    <footer class="site-footer">
      <span>HaiSan.vn phase 2</span>
      <span>${state.apiOnline ? "API online" : "Đang dùng dữ liệu mẫu"}</span>
      <span>${escapeHtml(API_BASE)}</span>
    </footer>

    ${state.selectedProduct ? renderProductModal(state.selectedProduct) : ""}
    ${state.selectedSeller ? renderSellerModal(state.selectedSeller) : ""}
  `;

  bindEvents();
}

function navButton(section, label) {
  const active = state.activeSection === section ? "is-active" : "";
  return `<a class="nav-link ${active}" href="#${section}" data-nav="${section}">${label}</a>`;
}

function renderUserButton() {
  if (state.user) {
    return `
      <button class="user-chip" type="button" title="Tài khoản hiện tại">
        <span class="avatar mini">${escapeHtml(initials(state.user.name))}</span>
        <span>${escapeHtml(state.user.name || "Buyer")}</span>
      </button>
    `;
  }

  return `
    <button class="ghost-button" type="button" data-login title="Đăng nhập buyer">
      <span class="button-icon">↗</span>
      <span>Đăng nhập</span>
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

        <div class="seller-tabs" role="tablist" aria-label="Seller tools">
          ${sellerTabButton("overview", "Tổng quan")}
          ${sellerTabButton("products", "Mẻ hàng")}
          ${sellerTabButton("recipes", "Công thức")}
          ${sellerTabButton("posts", "Bài viết")}
          ${sellerTabButton("messages", "Tin nhắn")}
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

function sellerTabButton(tab, label) {
  const active = state.seller.tab === tab ? "is-selected" : "";
  return `<button class="${active}" type="button" data-seller-tab="${tab}">${label}</button>`;
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
          <article class="roadmap-item">
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
      state.activeSection = node.dataset.nav;
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

  document.querySelectorAll("[data-seller-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.seller.tab = button.dataset.sellerTab || "overview";
      state.activeSection = "seller";
      render();
    });
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
      showToast("Frontend hiện tại dùng demo khi chưa đăng nhập; Google OAuth sẽ nối theo cấu hình backend.");
    });
  });

  document.querySelector("[data-contact-seller]")?.addEventListener("click", () => {
    showToast("Buyer cần đăng nhập để mở chat hoặc đặt lịch gọi.");
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
  if (event.key === "Escape" && (state.selectedProduct || state.selectedSeller)) {
    state.selectedProduct = null;
    state.selectedSeller = null;
    render();
  }
}

render();
loadData();
loadUser();
