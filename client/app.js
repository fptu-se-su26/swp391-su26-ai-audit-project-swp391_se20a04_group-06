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
      </nav>
      <div class="header-actions" data-header-user>${renderUserButton()}</div>
    </header>

    <main>
      ${renderMarket(products)}
      ${renderFishermen()}
      ${renderRecipes()}
      ${renderCommunity()}
      ${renderRoadmap()}
    </main>

    <footer class="site-footer">
      <span>HaiSan.vn phase 1</span>
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
          <article class="roadmap-item">
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
      showToast("Phase 1 dùng giao diện chung Guest/Buyer; Google OAuth sẽ nối theo cấu hình backend.");
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
