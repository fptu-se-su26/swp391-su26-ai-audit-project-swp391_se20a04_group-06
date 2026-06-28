const API_BASE =
  window.HAISAN_CONFIG?.API_BASE ||
  localStorage.getItem("haisan-api-base") ||
  "http://localhost:5000/api";

let socket = null;
let peerConnection = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;

const app = document.querySelector("#app");
const toastRoot = document.querySelector("#toast-root");
const sectionIds = ["market", "fishermen", "recipes", "community", "seller", "admin", "login", "profile-update"];
const DEMO_USER_KEY = "haisan-demo-user";
const MAX_UPLOAD_IMAGE_BYTES = 4 * 1024 * 1024;

function sectionFromHash() {
  const section = window.location.hash.replace("#", "");
  return sectionIds.includes(section) ? section : "market";
}


const state = {
  activeCall: {
    open: false,
    peerName: "",
    localStream: null,
    remoteStream: null,
    pcLocal: null,
    pcRemote: null,
  },
  followingSellers: new Set(JSON.parse(localStorage.getItem("haisan-following-sellers") || "[]")),
  selectedRecipe: null,
  selectedPost: null,
  activeCommentReplyId: null,
  activeInlinePostEditId: null,
  expandedCommentReplies: new Set(),
  reportModal: {
    open: false,
    targetId: null,
    targetType: null,
    targetTitle: "",
  },
  user: null,
  apiOnline: false,
  loading: true,
  activeSection: sectionFromHash(),
  auth: {
    modalOpen: false,
    loginReasonMessage: "",
  },
  sellerReviews: { formatted: [], total: 0 },
  reviewFilter: "all",
  draftReviewRating: 5,
  notifications: {
    open: false,
  },
  filters: {
    search: "",
    type: "All",
    category: "All",
    sort: "fresh",
    nearMe: false,
    followingOnly: false,
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
    conversations: [],
    activeThreadId: null,
    minimizedThreads: new Set(),
    emojiOpen: false,
    recording: false,
    todayCount: null,
    lastSync: null,
  },
  buyer: {
    conversations: [],
    activeThreadId: null,
    minimizedThreads: new Set(),
    emojiOpen: false,
    recording: false,
    featuredIndex: 0,
    featuredInterval: null,
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
  userMenuOpen: false,
  profileModalOpen: false,
  followedModalOpen: false,
  premiumModalOpen: false,
  chatbot: {
    open: false,
    loading: false,
    messages: [
      { role: "assistant", content: "Xin chào! Tôi là **Trợ lý Hải Sản** 🐟 của HảiSản.vn. Tôi có thể giúp gì cho bạn hôm nay?" }
    ]
  }
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

const demoSellerConversations = [
  {
    id: "chat-buyer-minh",
    buyerName: "Buyer Minh",
    buyerLabel: "Khách lẻ · Bình Thạnh",
    status: "Đang hoạt động",
    unread: 2,
    messages: [
      {
        id: "minh-1",
        from: "buyer",
        type: "text",
        text: "Chị còn cua size lớn giao Bình Thạnh sáng mai không?",
        createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
      },
      {
        id: "minh-2",
        from: "seller",
        type: "text",
        text: "Còn khoảng 11kg, em giữ size 350-450g/con được nhé.",
        createdAt: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
      },
      {
        id: "minh-3",
        from: "buyer",
        type: "location",
        text: "Giao tới 89 Điện Biên Phủ, Bình Thạnh",
        createdAt: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
      },
    ],
  },
  {
    id: "chat-bep-moc",
    buyerName: "Bếp Mộc",
    buyerLabel: "Nhà hàng · Quận 1",
    status: "Ưu tiên",
    unread: 1,
    messages: [
      {
        id: "moc-1",
        from: "buyer",
        type: "text",
        text: "Bên mình cần báo giá sỉ tôm sú 15kg mỗi ngày.",
        createdAt: new Date(Date.now() - 1000 * 60 * 78).toISOString(),
      },
      {
        id: "moc-2",
        from: "buyer",
        type: "file",
        fileName: "yeu-cau-nha-hang.docx",
        fileSize: "71 KB",
        createdAt: new Date(Date.now() - 1000 * 60 * 72).toISOString(),
      },
    ],
  },
  {
    id: "chat-lan-anh",
    buyerName: "Lan Anh",
    buyerLabel: "Buyer đã xác minh",
    status: "Video call",
    unread: 0,
    messages: [
      {
        id: "lan-1",
        from: "buyer",
        type: "text",
        text: "Mình muốn gọi video xem mẻ hàng trước khi chốt.",
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
      {
        id: "lan-2",
        from: "seller",
        type: "text",
        text: "Được nhé, mình rảnh trong 10 phút nữa.",
        createdAt: new Date(Date.now() - 1000 * 60 * 116).toISOString(),
      },
    ],
  },
];

const demoBuyerConversations = [
  {
    id: "buyer-chat-coba",
    sellerId: "demo-seller-1",
    sellerName: "Tàu Cô Ba Cần Giờ",
    sellerLabel: "Seller đã xác minh · Cần Giờ",
    status: "Đang hoạt động",
    unread: 1,
    messages: [
      {
        id: "buyer-coba-1",
        from: "seller",
        type: "text",
        text: "Cua gạch sáng nay còn khoảng 11kg, em muốn giữ mấy kg?",
        createdAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
      },
      {
        id: "buyer-coba-2",
        from: "buyer",
        type: "text",
        text: "Cho em giữ 2kg, giao Bình Thạnh trước 10h được không?",
        createdAt: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
      },
      {
        id: "buyer-coba-3",
        from: "seller",
        type: "location",
        text: "Điểm xuất hàng: Cảng cá Cần Giờ, TP.HCM",
        createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      },
    ],
  },
  {
    id: "buyer-chat-baclieu",
    sellerId: "demo-seller-2",
    sellerName: "Vựa Biển Bạc Liêu",
    sellerLabel: "Giao oxy · Tôm sú",
    status: "Báo giá sỉ",
    unread: 0,
    messages: [
      {
        id: "buyer-baclieu-1",
        from: "buyer",
        type: "text",
        text: "Mình cần giá sỉ tôm sú 15kg mỗi ngày cho quán.",
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      },
      {
        id: "buyer-baclieu-2",
        from: "seller",
        type: "file",
        fileName: "bao-gia-tom-su.pdf",
        fileSize: "92 KB",
        createdAt: new Date(Date.now() - 1000 * 60 * 84).toISOString(),
      },
    ],
  },
];

const demoBuyerUser = {
  id: "demo-buyer-1",
  name: "Buyer Minh",
  role: "Buyer",
  accountType: "Buyer",
  email: "buyer@haisan.vn",
  isDemo: true,
  createdAt: new Date("2026-06-01T09:00:00.000Z").toISOString(),
  hasPassword: true,
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
  createdAt: new Date("2026-05-15T09:00:00.000Z").toISOString(),
  hasPassword: true,
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
  createdAt: new Date("2026-04-01T09:00:00.000Z").toISOString(),
  hasPassword: true,
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
  if (user.sessionRole) {
    return user.sessionRole;
  }
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
  if (audience === "admin") return ["admin", "login", "profile-update"];
  if (audience === "seller") return ["seller", "login", "profile-update"];
  return ["market", "fishermen", "recipes", "community", "saved-products", "login", "profile-update"];
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

function cloneConversation(thread) {
  return {
    ...thread,
    messages: thread.messages.map((message) => ({ ...message })),
  };
}

function ensureSellerConversations() {
  if (!state.seller.conversations.length) {
    state.seller.conversations = demoSellerConversations.map(cloneConversation);
  }
  return state.seller.conversations;
}

function sellerConversationById(id = state.seller.activeThreadId) {
  return ensureSellerConversations().find((thread) => thread.id === id) || null;
}

function ensureBuyerConversations() {
  if (!state.buyer.conversations.length) {
    state.buyer.conversations = demoBuyerConversations.map(cloneConversation);
  }
  return state.buyer.conversations;
}

function buyerConversationById(id = state.buyer.activeThreadId) {
  return ensureBuyerConversations().find((thread) => thread.id === id) || null;
}

function ensureBuyerConversationForSeller(sellerId, sellerName = "Seller") {
  const existing =
    buyerConversationById(sellerId) ||
    ensureBuyerConversations().find((thread) => thread.sellerId === sellerId);
  if (existing) return existing;

  const thread = {
    id: `buyer-chat-${sellerId || Date.now()}`,
    sellerId,
    sellerName,
    sellerLabel: "Seller",
    status: "Chat mới",
    unread: 0,
    messages: [
      {
        id: `buyer-chat-welcome-${Date.now()}`,
        from: "seller",
        type: "text",
        text: `${sellerName} đã sẵn sàng nhận tin nhắn. Bạn có thể gửi hình ảnh, tệp, vị trí hoặc gọi demo tại đây.`,
        createdAt: new Date().toISOString(),
      },
    ],
  };

  state.buyer.conversations = [thread, ...state.buyer.conversations];
  return thread;
}

function activeChatScope() {
  if (state.buyer.activeThreadId) return "buyer";
  if (state.seller.activeThreadId) return "seller";
  return null;
}

function conversationPreview(message) {
  if (!message) return "Chưa có tin nhắn.";
  if (message.type === "file") return `Tệp: ${message.fileName || "file đính kèm"}`;
  if (message.type === "image") return "Đã gửi hình ảnh";
  if (message.type === "location") return "Đã gửi vị trí";
  if (message.type === "audio") return "Tin nhắn ghi âm";
  return message.text || "Tin nhắn mới";
}

function formatChatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatBytes(bytes) {
  const size = Number(bytes || 0);
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} B`;
}

function addSellerChatMessage(threadId, message) {
  const now = new Date().toISOString();
  state.seller.conversations = ensureSellerConversations().map((thread) => {
    if (thread.id !== threadId) return thread;
    return {
      ...thread,
      unread: 0,
      messages: [
        ...thread.messages,
        {
          id: `seller-chat-${Date.now()}-${thread.messages.length}`,
          from: "seller",
          createdAt: now,
          ...message,
        },
      ],
    };
  });
}

function addBuyerChatMessage(threadId, message) {
  const now = new Date().toISOString();
  state.buyer.conversations = ensureBuyerConversations().map((thread) => {
    if (thread.id !== threadId) return thread;
    return {
      ...thread,
      unread: 0,
      messages: [
        ...thread.messages,
        {
          id: `buyer-chat-${Date.now()}-${thread.messages.length}`,
          from: "buyer",
          createdAt: now,
          ...message,
        },
      ],
    };
  });
}

function addScopedChatMessage(scope, threadId, message) {
  if (scope === "buyer") addBuyerChatMessage(threadId, message);
  else addSellerChatMessage(threadId, message);
}

function notificationItemsForAudience(audience = userAudience()) {
  if (audience === "admin") {
    const pendingReports = state.admin.reports.filter((item) => item.status === "Pending").length || 2;
    return [
      {
        id: "admin-report-alert",
        title: `${pendingReports} báo cáo cần xử lý`,
        body: "Có sản phẩm hoặc seller cần admin kiểm tra.",
        time: "Vừa xong",
        unread: true,
        action: "admin-reports",
      },
      {
        id: "admin-broadcast-alert",
        title: "Broadcast đã sẵn sàng",
        body: "Có thể gửi thông báo hệ thống cho Buyer hoặc Seller.",
        time: "Hôm nay",
        unread: false,
        action: "admin-broadcasts",
      },
    ];
  }

  if (audience === "seller") {
    return ensureSellerConversations()
      .slice(0, 4)
      .map((thread) => ({
        id: `seller-notice-${thread.id}`,
        title: thread.unread ? `${thread.unread} tin mới từ ${thread.buyerName}` : thread.buyerName,
        body: conversationPreview(thread.messages.at(-1)),
        time: formatChatTime(thread.messages.at(-1)?.createdAt) || "Hôm nay",
        unread: Number(thread.unread || 0) > 0,
        action: "seller-chat",
        threadId: thread.id,
      }));
  }

  return ensureBuyerConversations()
    .slice(0, 4)
    .map((thread) => ({
      id: `buyer-notice-${thread.id}`,
      title: thread.unread ? `${thread.unread} tin mới từ ${thread.sellerName}` : thread.sellerName,
      body: conversationPreview(thread.messages.at(-1)),
      time: formatChatTime(thread.messages.at(-1)?.createdAt) || "Hôm nay",
      unread: Number(thread.unread || 0) > 0,
      action: "buyer-chat",
      threadId: thread.id,
    }));
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

function imageFilesFromInput(input, maxFiles = 1) {
  return Array.from(input?.files || []).slice(0, maxFiles);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Vui lòng chọn đúng file ảnh."));
      return;
    }
    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
      reject(new Error("Mỗi ảnh tối đa 4MB."));
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(new Error("Không đọc được file ảnh.")));
    reader.readAsDataURL(file);
  });
}

async function readImageFiles(input, maxFiles = 1) {
  const files = imageFilesFromInput(input, maxFiles);
  return Promise.all(files.map(fileToDataUrl));
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
    if (options.body instanceof FormData) {
      init.body = options.body;
    } else {
      headers.set("Content-Type", "application/json");
      init.body = JSON.stringify(options.body);
    }
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

function formatRelativeTime(value) {
  if (!value) return "vài giây";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "vài giây";
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "vài giây";
  if (diffMin < 60) return `${diffMin} phút`;
  if (diffHour < 24) return `${diffHour} giờ`;
  if (diffDay < 30) return `${diffDay} ngày`;
  
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function renderProductStatus(status) {
  if (status === "Active" || status === "active" || status === 1 || status === true) {
    return `<span class="product-status-badge in-stock" style="background-color: #f0fdf4; color: #16803d; border: 1px solid #bbf7d0; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; display: inline-block;">Còn hàng</span>`;
  } else {
    return `<span class="product-status-badge out-of-stock" style="background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; display: inline-block;">Hết hàng</span>`;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMarkdown(text) {
  if (!text) return "";
  let html = escapeHtml(text);
  // Replace **bold** with <strong>bold</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Replace *italic* with <em>italic</em>
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  // Handle lists: lines starting with "-"
  const lines = html.split("\n");
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      return `<div style="margin-left: 10px; text-indent: -10px; margin-bottom: 4px;">• ${trimmed.substring(2)}</div>`;
    }
    return line;
  });
  return processedLines.join("\n").replace(/\n/g, "<br>");
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

function saveFollowingSellers() {
  localStorage.setItem("haisan-following-sellers", JSON.stringify([...state.followingSellers]));
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

async function updateImageUploadPreview(input) {
  const previewId = input.dataset.imagePreview;
  const target = Array.from(document.querySelectorAll("[data-image-preview-target]")).find(
    (node) => node.dataset.imagePreviewTarget === previewId,
  );
  if (!target) return;

  const maxFiles = Number(input.dataset.imageMax || 1);
  try {
    const images = await readImageFiles(input, maxFiles);
    target.innerHTML = images.length
      ? images.map((src) => `<img src="${escapeHtml(src)}" alt="Ảnh đã chọn" />`).join("")
      : `<span>Chưa chọn ảnh</span>`;
  } catch (error) {
    input.value = "";
    target.innerHTML = `<span>Chưa chọn ảnh</span>`;
    showToast(error.message || "Không đọc được ảnh.", "warn");
  }
}

function addChatFileAttachments(input, scope = activeChatScope()) {
  const chatState = scope === "buyer" ? state.buyer : state.seller;
  const threadId = chatState.activeThreadId;
  if (!threadId) return;
  const files = Array.from(input?.files || []).slice(0, 6);
  if (!files.length) return;

  files.forEach((file) => {
    if (file.size > 12 * 1024 * 1024) {
      showToast(`${file.name} vượt quá 12MB.`, "warn");
      return;
    }
    addScopedChatMessage(scope, threadId, {
      type: "file",
      fileName: file.name,
      fileSize: formatBytes(file.size),
    });
  });

  input.value = "";
  chatState.emojiOpen = false;
  render();
}

async function addChatImageAttachments(input, scope = activeChatScope()) {
  const chatState = scope === "buyer" ? state.buyer : state.seller;
  const threadId = chatState.activeThreadId;
  if (!threadId) return;
  const files = Array.from(input?.files || []).slice(0, 6);
  if (!files.length) return;

  try {
    const images = await readImageFiles(input, 6);
    images.forEach((src, index) => {
      addScopedChatMessage(scope, threadId, {
        type: "image",
        src,
        fileName: files[index]?.name || "Ảnh đã gửi",
      });
    });
    input.value = "";
    chatState.emojiOpen = false;
    render();
  } catch (error) {
    input.value = "";
    showToast(error.message || "Không đọc được ảnh chat.", "warn");
  }
}

function activateSectionForCurrentUser() {
  let section = sectionFromHash();
  if (state.user && section === "login") {
    section = defaultSectionForAudience(userAudience());
  }
  state.activeSection = normalizeSectionForAudience(section);
  const desiredHash = `#${state.activeSection}`;
  if (window.location.hash !== desiredHash) {
    window.history.replaceState(null, "", desiredHash);
  }
}

function setDemoUser(audience) {
  state.user = demoUserForAudience(audience);
  state.auth.loginReasonMessage = "";
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(state.user));
  state.auth.modalOpen = false;
  state.notifications.open = false;
  state.selectedProduct = null;
  state.selectedSeller = null;
  state.seller.activeThreadId = null;
  state.seller.emojiOpen = false;
  state.seller.recording = false;
  state.buyer.activeThreadId = null;
  state.buyer.emojiOpen = false;
  state.buyer.recording = false;
  state.activeSection = "profile-update";
  window.history.replaceState(null, "", `#profile-update`);
  render();
  if (userAudience() === "seller") loadSellerData();
  if (userAudience() === "admin") loadAdminData();
  showToast(`Đã đăng nhập demo ${roleLabel(state.user)}. Vui lòng cập nhật thông tin.`);
}

function requireLogin(message) {
  state.auth.loginReasonMessage = message || "Bạn phải đăng nhập để trò chuyện, theo dõi và lưu sản phẩm";
  window.location.hash = "#login";
  state.auth.modalOpen = true;
  render();
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
  state.auth.loginReasonMessage = "";
  state.auth.modalOpen = false;
  state.notifications.open = false;
  state.selectedProduct = null;
  state.selectedSeller = null;
  state.seller.activeThreadId = null;
  state.seller.emojiOpen = false;
  state.seller.recording = false;
  state.buyer.activeThreadId = null;
  state.buyer.emojiOpen = false;
  state.buyer.recording = false;
  state.activeSection = "market";
  window.history.replaceState(null, "", "#market");
  render();
  showToast("Đã về chế độ Guest/Buyer.");
}

async function handleGoogleCredentialResponse(response) {
  const idToken = response.credential;
  const roleEl = document.querySelector('input[name="google-role-select"]:checked');
  const selectedRole = roleEl ? roleEl.value : "buyer";
  try {
    showToast("Đang xác thực tài khoản Google...", "info");
    await apiFetch("/auth/google", {
      method: "POST",
      body: { idToken, selectedRole },
      timeoutMs: 15000
    });
    localStorage.removeItem(DEMO_USER_KEY);
    await loadUser();
    state.auth.loginReasonMessage = "";
    state.auth.modalOpen = false;
    render();
    showToast(`Đăng nhập Google thành công! Chào ${state.user.name || "bạn"}.`);
  } catch (err) {
    showToast(`Lỗi đăng nhập Google: ${err.message}`, "error");
  }
}

function initializeGoogleSignIn() {
  const container = document.getElementById("google-signin-btn");
  if (!container) return;

  if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
    google.accounts.id.initialize({
      client_id: "127985992166-vq1uppd3smf6jt7aulumgo33lrbn7abo.apps.googleusercontent.com",
      callback: handleGoogleCredentialResponse,
    });
    google.accounts.id.renderButton(container, {
      theme: "outline",
      size: "large",
      width: 280,
    });
  } else {
    setTimeout(initializeGoogleSignIn, 300);
  }
}

async function toggleLike(postId) {
  if (!state.user) {
    state.auth.modalOpen = true;
    render();
    showToast("Vui lòng đăng nhập để thích bài viết.");
    return;
  }
  const currentUserId = getId(state.user);
  let post = state.data.posts.find(p => getId(p) === postId);
  if (!post) {
    post = state.seller.posts.find(p => getId(p) === postId);
  }
  if (post) {
    if (!Array.isArray(post.likes)) {
      post.likes = [];
    }
    const idx = post.likes.indexOf(currentUserId);
    if (idx !== -1) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push(currentUserId);
    }
    if (state.selectedPost && getId(state.selectedPost) === postId) {
      state.selectedPost = { ...post };
    }
    render();
  }
  if (!postId.startsWith("demo-") && state.apiOnline) {
    try {
      await apiFetch(`/posts/${postId}/like`, { method: "POST" });
    } catch (err) {
      showToast(`Không thể đồng bộ lượt thích lên server: ${err.message}`, "warn");
    }
  } else {
    showToast(post && post.likes.includes(currentUserId) ? "Đã thích bài viết." : "Đã bỏ thích.");
  }
}

async function toggleLikeRecipe(recipeId) {
  if (!state.user) {
    state.auth.modalOpen = true;
    render();
    showToast("Vui lòng đăng nhập để thích công thức.");
    return;
  }
  const currentUserId = getId(state.user);
  let recipe = state.data.recipes.find(r => getId(r) === recipeId);
  if (!recipe && state.seller && state.seller.recipes) {
    recipe = state.seller.recipes.find(r => getId(r) === recipeId);
  }
  if (recipe) {
    if (!Array.isArray(recipe.likes)) {
      recipe.likes = [];
    }
    const idx = recipe.likes.indexOf(currentUserId);
    if (idx !== -1) {
      recipe.likes.splice(idx, 1);
    } else {
      recipe.likes.push(currentUserId);
    }
    if (state.selectedRecipe && getId(state.selectedRecipe) === recipeId) {
      state.selectedRecipe = { ...recipe };
    }
    render();
  }
  if (!recipeId.startsWith("demo-") && state.apiOnline) {
    try {
      await apiFetch(`/recipes/${recipeId}/like`, { method: "POST" });
    } catch (err) {
      showToast(`Không thể đồng bộ lượt thích lên server: ${err.message}`, "warn");
    }
  } else {
    showToast(recipe && recipe.likes.includes(currentUserId) ? "Đã thích công thức." : "Đã bỏ thích.");
  }
}

async function submitComment(postId, text, parentId = null) {
  if (!text.trim()) return;
  if (!state.user) {
    state.auth.modalOpen = true;
    render();
    showToast("Vui lòng đăng nhập để bình luận.");
    return;
  }
  const userName = state.user.name || "Cộng tác viên";
  const currentUserId = getId(state.user);
  const newComment = {
    id: `comment-${Date.now()}`,
    userId: currentUserId,
    userName: userName,
    text: text.trim(),
    parentId: parentId,
    createdAt: new Date().toISOString()
  };
  let post = state.data.posts.find(p => getId(p) === postId);
  if (!post) {
    post = state.seller.posts.find(p => getId(p) === postId);
  }
  if (post) {
    if (!Array.isArray(post.comments)) {
      post.comments = [];
    }
    post.comments.push(newComment);
    if (state.selectedPost && getId(state.selectedPost) === postId) {
      state.selectedPost = { ...post };
    }
    render();
  }
  if (!postId.startsWith("demo-") && state.apiOnline) {
    try {
      await apiFetch(`/posts/${postId}/comments`, {
        method: "POST",
        body: { text: text.trim(), parentId: parentId }
      });
      const refreshedPost = await apiFetch(`/posts/${postId}`);
      if (refreshedPost) {
        let pIndex = state.data.posts.findIndex(p => getId(p) === postId);
        if (pIndex !== -1) {
          state.data.posts[pIndex] = refreshedPost;
        }
        if (state.selectedPost && getId(state.selectedPost) === postId) {
          state.selectedPost = refreshedPost;
        }
        render();
      }
    } catch (err) {
      showToast(`Không thể gửi bình luận: ${err.message}`, "warn");
    }
  } else {
    showToast("Đã đăng bình luận.");
  }
}

function renderPostModal(post) {
  const currentUserId = state.user ? getId(state.user) : null;
  const likes = Array.isArray(post.likes) ? post.likes.length : Number(post.likeCount || 0);
  const liked = Array.isArray(post.likes) && currentUserId && post.likes.includes(currentUserId);
  const comments = Array.isArray(post.comments) ? post.comments : [];
  const images = Array.isArray(post.images) ? post.images.filter(Boolean) : [];
  const tags = Array.isArray(post.tags) ? post.tags : [];

  const isEditingThisPost = state.activeInlinePostEditId === getId(post);
  if (isEditingThisPost) {
    return `
      <div class="modal-layer" role="dialog" aria-modal="true" aria-label="Chỉnh sửa bài viết">
        <div class="modal-panel post-detail-modal" style="max-width: 650px; padding: 24px; border-radius: 12px; background: #fff; position: relative;">
          <button class="icon-button close-button" type="button" data-close-modal aria-label="Đóng">×</button>
          <div style="display: grid; gap: 20px;">
            <div class="section-title-row compact-title" style="margin: 0; border-bottom: 1px solid var(--line); padding-bottom: 12px;">
              <div>
                <span class="eyebrow">Chỉnh sửa</span>
                <h3 style="margin: 4px 0 0;">Chỉnh sửa bài đăng</h3>
              </div>
            </div>
            <form class="seller-form" data-inline-post-edit-form="${escapeHtml(getId(post))}" style="display: grid; gap: 14px;">
              <label style="display: grid; gap: 6px;">
                <span style="font-size: 13px; font-weight: bold; color: var(--ink);">Tiêu đề</span>
                <input name="title" required value="${escapeHtml(post.title || '')}" style="padding: 10px; border: 1px solid var(--line); border-radius: 6px; font-size: 14px;" />
              </label>
              <label style="display: grid; gap: 6px;">
                <span style="font-size: 13px; font-weight: bold; color: var(--ink);">Nội dung</span>
                <textarea name="content" required rows="6" style="padding: 10px; border: 1px solid var(--line); border-radius: 6px; font-size: 14px; resize: vertical;">${escapeHtml(post.content || '')}</textarea>
              </label>
              <label style="display: grid; gap: 6px;">
                <span style="font-size: 13px; font-weight: bold; color: var(--ink);">Thẻ (cách nhau bằng dấu phẩy)</span>
                <input name="tags" value="${escapeHtml(Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''))}" style="padding: 10px; border: 1px solid var(--line); border-radius: 6px; font-size: 14px;" />
              </label>
              <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="primary-button" type="submit" style="flex: 1; height: 38px;">Lưu thay đổi</button>
                <button class="ghost-button" type="button" data-inline-cancel-edit style="height: 38px;">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="modal-layer" role="dialog" aria-modal="true" aria-label="Chi tiết bài viết">
      <div class="modal-panel post-detail-modal" style="max-width: 650px; padding: 24px; border-radius: 12px; background: #fff; position: relative;">
        <button class="icon-button close-button" type="button" data-close-modal aria-label="Đóng">×</button>
        <div style="display: grid; gap: 20px;">
          <div class="post-author" style="margin-bottom: 0;">
            <span class="avatar xl">${escapeHtml(initials(post.userName || post.authorName))}</span>
            <div>
              <strong style="font-size: 16px;">${escapeHtml(post.userName || post.authorName || "Người dùng")}</strong>
              <small style="display: block; color: var(--muted); font-size: 13px;">${formatDate(post.createdAt)}</small>
            </div>
          </div>
          <div>
            <h2 style="font-size: 22px; margin: 0 0 12px; color: var(--ink); font-weight: 800; line-height: 1.3;">${escapeHtml(post.title || "Bài viết")}</h2>
            <p style="color: var(--ink); line-height: 1.6; margin: 0 0 20px; font-size: 15px; white-space: pre-line;">${escapeHtml(post.content || "")}</p>
            ${
              images.length
                ? `<div style="display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); margin-bottom: 16px;">
                    ${images.map(src => `<img src="${escapeHtml(src)}" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 8px;" alt="Ảnh bài viết" />`).join("")}
                   </div>`
                : ""
            }
            <div class="tag-row" style="margin-bottom: 16px;">
              ${tags.map(tag => `<span class="pill" style="background: var(--bg); color: var(--ink); border: 1px solid var(--line); font-weight: normal;">${escapeHtml(tag)}</span>`).join("")}
            </div>
            <div style="display: flex; gap: 16px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 12px 0; margin-bottom: 20px;">
              <button class="action-btn like-btn ${liked ? 'is-liked' : ''}" type="button" data-post-like="${escapeHtml(getId(post))}" style="border: none; background: transparent; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: bold; color: ${liked ? 'var(--coral)' : 'var(--muted)'};">
                <span style="font-size: 18px;">${liked ? '❤️' : '🤍'}</span>
                <span>${likes} thích</span>
              </button>
              <div style="display: flex; align-items: center; gap: 6px; color: var(--muted); font-weight: bold;">
                <span style="font-size: 18px;">💬</span>
                <span>${comments.length} bình luận</span>
              </div>
            </div>
            ${
              userAudience() === "seller" || (state.user && (post.userId === getId(state.user) || post.authorId === getId(state.user)))
                ? `
                <div class="post-admin-actions" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--line); padding-bottom: 16px;">
                  <button class="ghost-button" type="button" data-seller-edit-post="${escapeHtml(getId(post))}" style="display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                    <span>Chỉnh sửa</span>
                  </button>
                  <button class="ghost-button danger" type="button" data-seller-delete-post="${escapeHtml(getId(post))}" style="display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                    <span>Xóa</span>
                  </button>
                </div>
                `
                : `
                <div class="post-admin-actions" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--line); padding-bottom: 16px;">
                  <button class="ghost-button danger" type="button" data-report-post="${escapeHtml(getId(post))}" style="display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="flag" style="width: 14px; height: 14px;"></i>
                    <span>Báo cáo vi phạm</span>
                  </button>
                </div>
                `
            }
            <h4 style="margin: 0 0 12px; color: var(--ink); font-weight: bold; font-size: 16px;">Ý kiến thảo luận (${comments.length})</h4>
            <div style="display: grid; gap: 16px; max-height: 380px; overflow-y: auto; padding-right: 4px; margin-bottom: 20px;">
              ${
                comments.length === 0
                  ? `<p style="color: var(--muted); font-style: italic; font-size: 14px;">Chưa có bình luận nào. Hãy là người đầu tiên nêu ý kiến!</p>`
                  : (() => {
                      const topLevel = comments.filter(c => !c.parentId);
                      const repliesByParent = {};
                      comments.forEach(c => {
                        if (c.parentId) {
                          const pIdStr = String(c.parentId);
                          if (!repliesByParent[pIdStr]) {
                            repliesByParent[pIdStr] = [];
                          }
                          repliesByParent[pIdStr].push(c);
                        }
                      });

                      const currentUserId = state.user ? getId(state.user) : null;

                      return topLevel.map(c => {
                        const commentId = getId(c);
                        const liked = c.likes && currentUserId && c.likes.includes(currentUserId);
                        const threadReplies = repliesByParent[commentId] || [];
                        const isExpanded = state.expandedCommentReplies.has(commentId);
                        const isReplying = state.activeCommentReplyId === commentId;

                        return `
                          <div class="comment-thread" style="display: grid; gap: 8px; position: relative;">
                            <!-- Bình luận gốc -->
                            <div style="display: flex; gap: 10px; align-items: flex-start;">
                              <span class="avatar" style="width: 32px; height: 32px; font-size: 12px; flex-shrink: 0; background: var(--line); color: var(--ink);">${escapeHtml(initials(c.userName || "C"))}</span>
                              <div style="display: flex; flex-direction: column; max-width: calc(100% - 42px); align-items: flex-start;">
                                <!-- Bong bóng chat -->
                                <div style="background: #f0f2f5; border-radius: 18px; padding: 8px 12px; position: relative; width: fit-content; max-width: 100%;">
                                  <strong style="font-size: 13px; color: var(--ink); display: block; margin-bottom: 2px;">${escapeHtml(c.userName || "Người dùng")}</strong>
                                  <p style="margin: 0; font-size: 13px; color: var(--ink); line-height: 1.4; word-break: break-word;">${escapeHtml(c.text || c.content || "")}</p>
                                  
                                  <!-- Badge lượt thích -->
                                  ${c.likes && c.likes.length > 0 ? `
                                    <div style="position: absolute; right: 4px; bottom: -8px; background: #fff; border-radius: 10px; padding: 1px 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 2px; font-size: 10px; pointer-events: none; z-index: 1;">
                                      <span>👍</span>
                                      <span style="color: var(--muted); font-weight: bold;">${c.likes.length}</span>
                                    </div>
                                  ` : ""}
                                </div>
                                
                                <!-- Dòng hành động (Actions Row) -->
                                <div style="display: flex; gap: 12px; margin-top: 4px; padding-left: 10px; align-items: center; font-size: 11px;">
                                  <span style="color: var(--muted);">${formatRelativeTime(c.createdAt)}</span>
                                  <button type="button" class="comment-like-btn" data-comment-like-postId="${escapeHtml(getId(post))}" data-comment-like-commentId="${escapeHtml(commentId)}" style="background: none; border: none; padding: 0; color: ${liked ? '#1877f2' : 'var(--muted)'}; cursor: pointer; font-weight: bold; outline: none;">
                                    Thích
                                  </button>
                                  <button type="button" class="reply-trigger-btn" data-comment-reply-trigger="${escapeHtml(commentId)}" style="background: none; border: none; padding: 0; color: var(--muted); cursor: pointer; font-weight: bold; outline: none;">
                                    Trả lời
                                  </button>
                                </div>
                              </div>
                            </div>

                            <!-- Danh sách phản hồi -->
                            ${threadReplies.length > 0 ? (
                              isExpanded ? `
                                <div class="replies-list" style="margin-left: 16px; display: grid; gap: 8px; border-left: 2px solid #e4e6eb; padding-left: 16px; margin-top: 4px; position: relative;">
                                  ${threadReplies.map(r => {
                                    const rId = getId(r);
                                    const rLiked = r.likes && currentUserId && r.likes.includes(currentUserId);
                                    return `
                                      <div style="display: flex; gap: 8px; align-items: flex-start; position: relative;">
                                        <!-- Connector line -->
                                        <div style="position: absolute; left: -16px; top: 12px; width: 16px; border-top: 2px solid #e4e6eb; pointer-events: none;"></div>
                                        
                                        <span class="avatar" style="width: 24px; height: 24px; font-size: 10px; line-height: 24px; flex-shrink: 0; background: var(--line); color: var(--ink);">${escapeHtml(initials(r.userName || "R"))}</span>
                                        <div style="display: flex; flex-direction: column; max-width: calc(100% - 32px); align-items: flex-start;">
                                          <!-- Bong bóng chat -->
                                          <div style="background: #f0f2f5; border-radius: 18px; padding: 6px 10px; position: relative; width: fit-content; max-width: 100%;">
                                            <strong style="font-size: 12px; color: var(--ink); display: block; margin-bottom: 2px;">${escapeHtml(r.userName || "Người dùng")}</strong>
                                            <p style="margin: 0; font-size: 12px; color: var(--ink); line-height: 1.3; word-break: break-word;">
                                              <span style="font-weight: bold; color: var(--ink); margin-right: 4px;">${escapeHtml(c.userName)}</span>${escapeHtml(r.text || r.content || "")}
                                            </p>
                                            
                                            <!-- Badge lượt thích -->
                                            ${r.likes && r.likes.length > 0 ? `
                                              <div style="position: absolute; right: 4px; bottom: -8px; background: #fff; border-radius: 10px; padding: 1px 5px; box-shadow: 0 1px 2px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 2px; font-size: 9px; pointer-events: none; z-index: 1;">
                                                <span>👍</span>
                                                <span style="color: var(--muted); font-weight: bold;">${r.likes.length}</span>
                                              </div>
                                            ` : ""}
                                          </div>
                                          
                                          <!-- Actions Row -->
                                          <div style="display: flex; gap: 12px; margin-top: 2px; padding-left: 8px; align-items: center; font-size: 10px;">
                                            <span style="color: var(--muted);">${formatRelativeTime(r.createdAt)}</span>
                                            <button type="button" class="comment-like-btn" data-comment-like-postId="${escapeHtml(getId(post))}" data-comment-like-commentId="${escapeHtml(rId)}" style="background: none; border: none; padding: 0; color: ${rLiked ? '#1877f2' : 'var(--muted)'}; cursor: pointer; font-weight: bold; outline: none;">
                                              Thích
                                            </button>
                                            <button type="button" class="reply-trigger-btn" data-comment-reply-trigger="${escapeHtml(commentId)}" style="background: none; border: none; padding: 0; color: var(--muted); cursor: pointer; font-weight: bold; outline: none;">
                                              Trả lời
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    `;
                                  }).join("")}
                                  
                                  <!-- Nút ẩn phản hồi -->
                                  <div style="display: flex; align-items: center; position: relative;">
                                    <div style="position: absolute; left: -16px; top: 10px; width: 16px; border-top: 2px solid #e4e6eb; pointer-events: none;"></div>
                                    <button type="button" class="collapse-replies-btn" data-comment-collapse="${escapeHtml(commentId)}" style="background: none; border: none; padding: 0; color: var(--primary); cursor: pointer; font-size: 11px; font-weight: bold; outline: none; margin-left: 8px;">
                                      Ẩn phản hồi
                                    </button>
                                  </div>
                                </div>
                              ` : `
                                <!-- Nút xem phản hồi dạng rút gọn -->
                                <div style="margin-left: 16px; padding-left: 16px; position: relative; display: flex; align-items: center; margin-top: 4px;">
                                  <div style="position: absolute; left: 0; top: -12px; width: 16px; height: 22px; border-left: 2px solid #e4e6eb; border-bottom: 2px solid #e4e6eb; border-bottom-left-radius: 8px; pointer-events: none;"></div>
                                  <button type="button" class="expand-replies-btn" data-comment-expand="${escapeHtml(commentId)}" style="background: none; border: none; padding: 0; color: var(--primary); cursor: pointer; font-size: 11px; font-weight: bold; outline: none; display: flex; align-items: center; gap: 4px; margin-left: 8px;">
                                    Xem tất cả ${threadReplies.length} phản hồi
                                  </button>
                                </div>
                              `
                            ) : ""}

                            <!-- Form nhập phản hồi -->
                            ${isReplying ? `
                              <div style="margin-left: 16px; padding-left: 16px; position: relative; display: flex; align-items: center; margin-top: 4px;">
                                <div style="position: absolute; left: 0; top: -12px; width: 16px; height: 22px; border-left: 2px solid #e4e6eb; border-bottom: 2px solid #e4e6eb; border-bottom-left-radius: 8px; pointer-events: none;"></div>
                                <form data-post-reply-form="${escapeHtml(getId(post))}" data-parent-id="${escapeHtml(commentId)}" style="display: flex; gap: 8px; flex: 1; margin-left: 8px;">
                                  <input type="text" name="replyText" placeholder="Viết phản hồi..." required style="flex: 1; padding: 6px 12px; border: 1px solid var(--line); border-radius: 16px; font-size: 12px; outline: none; background: #fff;" />
                                  <button class="primary-button" type="submit" style="border-radius: 16px; padding: 0 12px; font-size: 11px; height: 28px;">Gửi</button>
                                  <button type="button" data-cancel-reply style="background: none; border: none; color: var(--muted); font-size: 11px; cursor: pointer; padding: 0 4px; outline: none;">Hủy</button>
                                </form>
                              </div>
                            ` : ""}
                          </div>
                        `;
                      }).join("");
                    })()
              }
            </div>
            <form data-post-comment-form="${escapeHtml(getId(post))}" style="display: flex; gap: 8px; border-top: 1px solid var(--line); padding-top: 16px;">
              <input type="text" name="commentText" placeholder="${state.user ? 'Viết ý kiến thảo luận của bạn...' : 'Vui lòng đăng nhập để bình luận...'}" required style="flex: 1; padding: 10px 14px; border: 1px solid var(--line); border-radius: 20px; font-size: 14px; outline: none; background: ${state.user ? '#fff' : 'var(--bg)'};" ${state.user ? '' : 'disabled'} />
              <button class="primary-button" type="submit" ${state.user ? '' : 'disabled'} style="border-radius: 20px; padding: 0 18px; font-size: 13px; height: 38px;">Gửi</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
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

    // Use database results directly when API is online.
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
    try {
      const backendFavs = await apiFetch("/favorites/ids");
      if (Array.isArray(backendFavs)) {
        state.favorites = new Set(backendFavs.map(String));
        saveFavorites();
      }
    } catch (e) {
      console.warn("Could not sync favorites from backend:", e);
    }
  } catch {
    state.user = storedDemoUser();
  }
  activateSectionForCurrentUser();
  render();
  if (userAudience() === "seller") loadSellerData();
  if (userAudience() === "admin") loadAdminData();
  initSocket();
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
    const matchesFollowing = !state.filters.followingOnly || state.followingSellers.has(item.sellerId);
    return matchesText && matchesType && matchesCategory && matchesFollowing;
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

function renderReportModal() {
  if (!state.reportModal.open) return "";

  const options = [
    "Vấn đề liên quan đến người dưới 18 tuổi",
    "Bắt nạt, quấy rối hoặc lăng mạ/lạm dụng/ngược đãi",
    "Tự tử hoặc tự hại bản thân",
    "Nội dung mang tính bạo lực, thù ghét hoặc gây phiền toái",
    "Bán hoặc quảng bá mặt hàng bị hạn chế",
    "Nội dung người lớn",
    "Thông tin sai sự thật, lừa đảo hoặc gian lận",
    "Quyền sở hữu trí tuệ",
    "Tôi không muốn xem nội dung này"
  ];

  return `
    <div class="modal-layer active" style="display: flex; align-items: center; justify-content: center; z-index: 2000; background: rgba(0,0,0,0.5);">
      <div class="modal-panel" style="max-width: 500px; width: 90%; padding: 24px; border-radius: 12px; background: #fff; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); position: relative; animation: slideInUp 0.3s ease;">
        <button class="icon-button close-button" type="button" data-close-report-modal style="position: absolute; right: 16px; top: 16px; font-size: 24px; background: transparent; border: none; cursor: pointer; color: var(--muted);">&times;</button>
        <div style="text-align: center; border-bottom: 1px solid var(--line); padding-bottom: 12px; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 20px; font-weight: 800; color: var(--ink);">Báo cáo</h3>
        </div>
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 6px; font-size: 16px; font-weight: bold; color: var(--ink);">Tại sao bạn báo cáo nội dung này?</h4>
          <p style="margin: 0; font-size: 13px; color: var(--muted); line-height: 1.5;">
            Nếu bạn nhận thấy ai đó đang gặp nguy hiểm, đừng chần chừ mà hãy tìm ngay sự giúp đỡ trước khi báo cáo với HảiSản.vn.
          </p>
        </div>
        <div style="display: grid; gap: 8px; max-height: 350px; overflow-y: auto; padding-right: 4px;">
          ${options.map(opt => `
            <button class="report-option-btn" type="button" data-report-reason="${escapeHtml(opt)}" style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 14px 16px; border: 1px solid var(--line); border-radius: 8px; background: #f9fafb; font-size: 14px; font-weight: 600; color: var(--ink); text-align: left; cursor: pointer; transition: background 0.2s, border-color 0.2s; outline: none; border-color: transparent;">
              <span>${escapeHtml(opt)}</span>
              <span style="font-size: 16px; color: var(--muted); margin-left: 10px;">&rsaquo;</span>
            </button>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function render() {
  if (state.activeSection === "login") {
    app.innerHTML = renderLoginPage();
    bindEvents();
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  if (state.activeSection === "profile-update") {
    app.innerHTML = renderProfileUpdatePage();
    bindEvents();
    if (window.lucide) window.lucide.createIcons();
    return;
  }

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

    ${state.user && audience === "buyer" && !state.buyer.activeThreadId ? renderBuyerChatLauncher() : ""}
    ${renderAIChatbot()}

    <footer class="site-footer">
      <span>HaiSan.vn phase 3 role split</span>
      <span>${state.apiOnline ? "API online" : "Đang dùng dữ liệu mẫu"}</span>
      <span>${escapeHtml(API_BASE)}</span>
    </footer>

    ${state.selectedProduct ? renderProductModal(state.selectedProduct) : ""}
    ${state.selectedSeller ? renderSellerModal(state.selectedSeller) : ""}
    ${state.auth.modalOpen ? renderLoginModal() : ""}
    ${state.seller.activeThreadId ? renderSellerChatModal() : ""}
    ${state.buyer.activeThreadId ? renderBuyerChatModal() : ""}
    ${state.activeCall?.open ? renderVideoCallModal() : ""}
    ${state.selectedRecipe ? renderRecipeModal(state.selectedRecipe) : ""}
    ${state.selectedPost ? renderPostModal(state.selectedPost) : ""}
    ${state.profileModalOpen ? renderProfileModal() : ""}
    ${state.followedModalOpen ? renderFollowedModal() : ""}
    ${state.premiumModalOpen ? renderPremiumModal() : ""}
    ${state.reportModal.open ? renderReportModal() : ""}
    ${state.activeImageViewerSrc ? renderImageViewerModal() : ""}
    ${renderChatHeads()}
  `;

  bindEvents();
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderNavForAudience(audience) {
  if (audience === "admin") return renderAdminHeaderTabs();
  if (audience === "seller") return renderSellerHeaderTabs();
  return `
    ${navButton("market", "Chợ biển")}
    ${navButton("fishermen", "Ngư dân")}
    ${navButton("recipes", "Bếp biển")}
    ${navButton("community", "Cộng đồng")}
    ${navButton("saved-products", "Sản phẩm đã lưu")}
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
    ${renderSavedProducts()}
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
  const bell = renderNotificationBell();
  if (state.user) {
    const menuOpen = !!state.userMenuOpen;
    return `
      <div class="auth-actions" style="position: relative;">
        ${bell}
        <button class="user-chip" type="button" data-toggle-user-menu>
          ${state.user.avatarUrl
            ? `<img src="${escapeHtml(state.user.avatarUrl)}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid var(--line);" />`
            : `<span class="avatar mini">${escapeHtml(initials(state.user.name))}</span>`
          }
          <span>
            ${escapeHtml(state.user.name || "User")}
            <small>${escapeHtml(roleLabel(state.user))}${state.user.isDemo ? " demo" : ""}</small>
          </span>
        </button>
        
        ${menuOpen ? `
          <div class="user-dropdown-menu" style="position: absolute; right: 0; top: calc(100% + 8px); background: #fff; border: 1px solid var(--line); border-radius: 8px; box-shadow: var(--shadow); z-index: 100; min-width: 220px; padding: 6px 0; display: grid;">
            ${(function() {
              const audience = userAudience(state.user);
              if (audience === "admin") {
                return `
                  <button class="dropdown-item" type="button" data-logout style="text-align: left; background: none; border: none; padding: 12px 16px; font-size: 14px; color: var(--coral); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; font-weight: bold; width: 100%;">
                    <i data-lucide="log-out" style="width: 14px; height: 14px;"></i>
                    <span>Đăng xuất</span>
                  </button>
                `;
              } else if (audience === "seller") {
                const stats = state.user.stats || {};
                const postCount = stats.postCount !== undefined ? stats.postCount : (state.user.productsCount || 0);
                const totalViews = stats.totalViews !== undefined ? stats.totalViews : 0;
                const followers = stats.followers !== undefined ? stats.followers : (state.user.followersCount || 0);
                return `
                  <!-- Widget Hồ sơ -->
                  <div style="padding: 12px 16px; border-bottom: 1px solid var(--line); background: var(--seller-orange-soft, #f0f9ff); border-radius: 8px 8px 0 0; margin-top: -6px; margin-bottom: 6px;">
                    <div style="font-size: 11px; font-weight: 700; color: var(--seller-orange-ink, #0c4a6e); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
                      <i data-lucide="bar-chart-2" style="width: 14px; height: 14px;"></i> Hồ sơ Ngư dân
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; text-align: center;">
                      <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 16px; font-weight: 800; color: var(--seller-orange, #0ea5e9);">${postCount}</span>
                        <span style="font-size: 9px; color: var(--muted); font-weight: 600;">Bài đăng</span>
                      </div>
                      <div style="display: flex; flex-direction: column; border-left: 1px solid var(--line); border-right: 1px solid var(--line);">
                        <span style="font-size: 16px; font-weight: 800; color: var(--seller-orange, #0ea5e9);">${totalViews}</span>
                        <span style="font-size: 9px; color: var(--muted); font-weight: 600;">Lượt xem</span>
                      </div>
                      <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 16px; font-weight: 800; color: var(--seller-orange, #0ea5e9);">${followers}</span>
                        <span style="font-size: 9px; color: var(--muted); font-weight: 600;">Theo dõi</span>
                      </div>
                    </div>
                  </div>
                  <button class="dropdown-item" type="button" data-user-menu-item="profile" style="text-align: left; background: none; border: none; padding: 10px 16px; font-size: 14px; color: var(--ink); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; width: 100%;">
                    <i data-lucide="user" style="width: 14px; height: 14px;"></i>
                    <span style="font-weight: 500;">Thông tin cá nhân</span>
                  </button>
                  <button class="dropdown-item" type="button" data-user-menu-item="premium" style="text-align: left; background: none; border: none; padding: 10px 16px; font-size: 14px; color: var(--ink); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; width: 100%;">
                    <i data-lucide="award" style="width: 14px; height: 14px;"></i>
                    <span style="font-weight: 500;">Đăng kí Premium</span>
                  </button>
                  <button class="dropdown-item" type="button" data-user-menu-item="account" style="text-align: left; background: none; border: none; padding: 10px 16px; font-size: 14px; color: var(--ink); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; width: 100%;">
                    <i data-lucide="settings" style="width: 14px; height: 14px;"></i>
                    <span style="font-weight: 500;">Cài đặt</span>
                  </button>
                  <div style="border-top: 1px solid var(--line); margin: 4px 0;"></div>
                  <button class="dropdown-item" type="button" data-logout style="text-align: left; background: none; border: none; padding: 10px 16px; font-size: 14px; color: var(--coral); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; width: 100%;">
                    <i data-lucide="log-out" style="width: 14px; height: 14px;"></i>
                    <span style="font-weight: bold;">Đăng xuất</span>
                  </button>
                `;
              } else {
                return `
                  <button class="dropdown-item" type="button" data-user-menu-item="profile" style="text-align: left; background: none; border: none; padding: 10px 16px; font-size: 14px; color: var(--ink); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; width: 100%;">
                    <i data-lucide="user" style="width: 14px; height: 14px;"></i>
                    <span style="font-weight: 500;">Thông tin cá nhân</span>
                  </button>
                  <button class="dropdown-item" type="button" data-user-menu-item="followed" style="text-align: left; background: none; border: none; padding: 10px 16px; font-size: 14px; color: var(--ink); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; width: 100%;">
                    <i data-lucide="anchor" style="width: 14px; height: 14px;"></i>
                    <span style="font-weight: 500;">Đã theo dõi và đã lưu</span>
                  </button>
                  <button class="dropdown-item" type="button" data-user-menu-item="premium" style="text-align: left; background: none; border: none; padding: 10px 16px; font-size: 14px; color: var(--ink); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; width: 100%;">
                    <i data-lucide="award" style="width: 14px; height: 14px;"></i>
                    <span style="font-weight: 500;">Đăng kí Premium</span>
                  </button>
                  <button class="dropdown-item" type="button" data-user-menu-item="account" style="text-align: left; background: none; border: none; padding: 10px 16px; font-size: 14px; color: var(--ink); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; width: 100%;">
                    <i data-lucide="settings" style="width: 14px; height: 14px;"></i>
                    <span style="font-weight: 500;">Cài đặt</span>
                  </button>
                  <div style="border-top: 1px solid var(--line); margin: 4px 0;"></div>
                  <button class="dropdown-item" type="button" data-logout style="text-align: left; background: none; border: none; padding: 10px 16px; font-size: 14px; color: var(--coral); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; width: 100%;">
                    <i data-lucide="log-out" style="width: 14px; height: 14px;"></i>
                    <span style="font-weight: bold;">Đăng xuất</span>
                  </button>
                `;
              }
            })()}
          </div>
        ` : ""}
      </div>
    `;
  }

  return `
    <div class="auth-actions">
      ${bell}
      <button class="ghost-button" type="button" data-login title="Đăng nhập buyer" style="display: flex; align-items: center; gap: 6px;">
        <i data-lucide="log-in" style="width: 14px; height: 14px;"></i>
        <span>Đăng nhập</span>
      </button>
    </div>
  `;
}

function renderImageViewerModal() {
  if (!state.activeImageViewerSrc) return "";
  return `
    <div class="modal-layer" style="background: rgba(0,0,0,0.85); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: zoom-out;" role="dialog" aria-modal="true" data-close-image-viewer>
      <button class="icon-button close-button" style="position: absolute; top: 20px; right: 20px; font-size: 32px; color: #fff; background: none; border: none; cursor: pointer; z-index: 10001;" data-close-image-viewer>×</button>
      <img src="${escapeHtml(state.activeImageViewerSrc)}" style="max-width: 90%; max-height: 90vh; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 24px rgba(0,0,0,0.6); pointer-events: none;" />
    </div>
  `;
}

function renderProfileModal() {
  return `
    <div class="modal-layer" role="dialog" aria-modal="true" aria-label="Thông tin cá nhân">
      <div class="modal-panel" style="max-width: 450px; padding: 24px; border-radius: 12px; background: #fff; position: relative;">
        <button class="icon-button close-button" type="button" data-close-profile-modal aria-label="Đóng">×</button>
        <div style="display: grid; gap: 16px;">
          <h2 style="font-size: 20px; margin: 0; font-weight: 800; color: var(--ink);">Thông tin cá nhân</h2>
          
          <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--bg); border-radius: 8px;">
            <div style="position: relative; width: 64px; height: 64px; flex-shrink: 0;">
              ${state.user.avatarUrl
                ? `<img src="${escapeHtml(state.user.avatarUrl)}" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid var(--line);" id="profile-avatar-preview" />`
                : `<span class="avatar xl" style="margin: 0; width: 64px; height: 64px; font-size: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--teal); color: #fff;" id="profile-avatar-preview-text">${escapeHtml(initials(state.user.name))}</span>`
              }
              <label for="profile-avatar-input" style="position: absolute; bottom: -2px; right: -2px; width: 24px; height: 24px; background: var(--teal, #0ea5e9); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid #fff; color: #fff; font-size: 11px; box-shadow: 0 1px 4px rgba(0,0,0,0.2);" title="Thay đổi ảnh đại diện">
                📷
              </label>
              <input type="file" id="profile-avatar-input" accept="image/*" style="display: none;" />
            </div>
            <div>
              <strong style="display: block; font-size: 16px; color: var(--ink);">${escapeHtml(state.user.name || "Chưa đặt tên")}</strong>
              <small style="color: var(--muted); font-size: 13px; display: block; margin-top: 2px;">Vai trò: ${escapeHtml(roleLabel(state.user))}</small>
              <small style="color: var(--muted); font-size: 13px; display: block; margin-top: 2px;">Ngày đăng ký: ${state.user.createdAt ? formatDate(state.user.createdAt) : "Không rõ"}</small>
            </div>
          </div>

          <form data-profile-update-form style="display: grid; gap: 14px;">
            <label style="display: grid; gap: 6px; font-size: 13px; font-weight: bold; color: var(--ink);">
              Họ và tên
              <input type="text" name="profileName" value="${escapeHtml(state.user.name || "")}" required style="padding: 10px 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 14px; outline: none;" />
            </label>
            <label style="display: grid; gap: 6px; font-size: 13px; font-weight: bold; color: var(--ink);">
              Email liên hệ
              <input type="email" name="profileEmail" value="${escapeHtml(state.user.email || "")}" required style="padding: 10px 12px; border: 1px solid var(--line); border-radius: 6px; font-size: 14px; outline: none;" />
            </label>
            <button class="primary-button" type="submit" style="margin-top: 8px; width: 100%; height: 42px;">Lưu thay đổi</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

function renderFollowedModal() {
  const followedIds = Array.from(state.followingSellers);
  const followedFishermen = followedIds.map(id => {
    return state.data.fishermen.find(f => getId(f) === id) || 
           fallbackFishermen.find(f => getId(f) === id) || 
           { id, name: "Ngư dân ẩn danh", bio: "Đang hoạt động trên biển." };
  });

  return `
    <div class="modal-layer" role="dialog" aria-modal="true" aria-label="Đã theo dõi ngư dân">
      <div class="modal-panel" style="max-width: 450px; padding: 24px; border-radius: 12px; background: #fff; position: relative;">
        <button class="icon-button close-button" type="button" data-close-followed-modal aria-label="Đóng">×</button>
        <div style="display: grid; gap: 16px;">
          <h2 style="font-size: 20px; margin: 0; font-weight: 800; color: var(--ink);">Ngư dân đã theo dõi</h2>
          
          <div style="max-height: 300px; overflow-y: auto; display: grid; gap: 12px; padding-right: 4px;">
            ${
              followedFishermen.length === 0
                ? `<p style="color: var(--muted); font-style: italic; text-align: center; padding: 20px 0; font-size: 14px;">Bạn chưa theo dõi ngư dân nào.</p>`
                : followedFishermen.map(f => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: var(--bg); border-radius: 8px; gap: 12px;">
                      <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                        <span class="avatar mini" style="margin: 0; flex-shrink: 0;">${escapeHtml(initials(f.name))}</span>
                        <div style="min-width: 0;">
                          <strong style="font-size: 14px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(f.name)}</strong>
                          <small style="color: var(--muted); font-size: 12px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">${escapeHtml(f.bio || "")}</small>
                        </div>
                      </div>
                      <button class="ghost-button" type="button" data-unfollow-profile="${escapeHtml(getId(f))}" style="padding: 6px 12px; font-size: 12px; height: 28px; color: var(--coral); flex-shrink: 0; border: none; background: transparent; cursor: pointer;">Bỏ theo dõi</button>
                    </div>
                  `).join("")
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPremiumModal() {
  const isPremium = !!state.user.isPremium;
  return `
    <div class="modal-layer" role="dialog" aria-modal="true" aria-label="Gói Premium">
      <div class="modal-panel" style="max-width: 450px; padding: 24px; border-radius: 12px; background: #fff; position: relative; text-align: center;">
        <button class="icon-button close-button" type="button" data-close-premium-modal aria-label="Đóng">×</button>
        <div style="display: grid; gap: 16px; justify-items: center;">
          <span style="font-size: 48px; line-height: 1;">👑</span>
          <h2 style="font-size: 22px; margin: 0; font-weight: 800; color: var(--ink);">Gói Tài Khoản Premium</h2>
          
          ${
            isPremium
              ? `
                <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 16px; border-radius: 8px; text-align: left; width: 100%;">
                  <p style="color: #065f46; font-weight: bold; margin: 0 0 6px 0; font-size: 15px;">🌟 Bạn đang là hội viên Premium!</p>
                  <p style="margin: 0; font-size: 13px; color: #047857; line-height: 1.5;">Tài khoản của bạn đã được nâng cấp lên thẻ đặc quyền vàng, miễn phí vận chuyển cho mọi mẻ hàng hải sản tươi.</p>
                </div>
              `
              : `
                <p style="color: var(--muted); font-size: 14px; line-height: 1.6; margin: 0;">
                  Nâng cấp lên hội viên **Premium** để nhận huy hiệu vương miện nổi bật, xem độc quyền các mẻ cá hiếm ngay khi vừa cập cảng và giảm 100% chi phí vận chuyển.
                </p>
                <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; width: 100%; padding: 12px; display: grid; justify-items: start; gap: 8px; font-size: 13px; color: #92400e; text-align: left;">
                  <span>✓ Ưu tiên kết nối trực tiếp với ngư dân</span>
                  <span>✓ Miễn phí vận chuyển cho đơn hàng từ 300k</span>
                  <span>✓ Nhận cảnh báo sớm khi có hải sản hiếm độc quyền</span>
                </div>
                <button class="primary-button" type="button" data-upgrade-premium-confirm style="width: 100%; height: 42px; font-size: 15px; font-weight: bold; background: #eab308; border-color: #eab308; color: #fff;">Nâng cấp ngay (Miễn phí)</button>
              `
          }
        </div>
      </div>
    </div>
  `;
}

function renderNotificationBell() {
  const items = notificationItemsForAudience();
  const unread = items.filter((item) => item.unread).length;
  return `
    <div class="notification-wrap">
      <button
        class="notification-bell ${state.notifications.open ? "is-active" : ""}"
        type="button"
        data-toggle-notifications
        title="Thông báo"
        aria-label="Thông báo"
      >
        <span aria-hidden="true">&#128276;</span>
        ${unread ? `<b>${unread}</b>` : ""}
      </button>
      ${state.notifications.open ? renderNotificationPanel(items) : ""}
    </div>
  `;
}

function renderNotificationPanel(items) {
  return `
    <section class="notification-panel" aria-label="Danh sách thông báo">
      <header>
        <strong>Thông báo</strong>
        <small>${escapeHtml(roleLabel(state.user))}</small>
      </header>
      <div class="notification-list">
        ${
          items.length
            ? items.map(renderNotificationItem).join("")
            : `<p class="notification-empty">Chưa có thông báo mới.</p>`
        }
      </div>
    </section>
  `;
}

function renderNotificationItem(item) {
  const actionAttrs = item.action
    ? `data-notification-action="${escapeHtml(item.action)}" data-thread-id="${escapeHtml(item.threadId || "")}"`
    : "";
  return `
    <button class="notification-item ${item.unread ? "is-unread" : ""}" type="button" ${actionAttrs}>
      <span class="notification-dot" aria-hidden="true"></span>
      <span>
        <strong>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(item.body)}</small>
      </span>
      <time>${escapeHtml(item.time || "")}</time>
    </button>
  `;
}

function handleCustomLogin(email, role) {
  const id = `user-${Date.now()}`;
  const name = email.split("@")[0];
  const cleanEmail = email.toLowerCase().trim();
  const finalRole = cleanEmail === "tominhcuong5g@gmail.com" ? "Admin" : role;
  state.user = {
    id,
    _id: id,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    email: cleanEmail,
    role: finalRole,
    isDemo: false,
    createdAt: new Date().toISOString(),
    hasPassword: true,
  };
  
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(state.user));
  
  state.auth.modalOpen = false;
  state.notifications.open = false;
  state.selectedProduct = null;
  state.selectedSeller = null;
  state.seller.activeThreadId = null;
  state.buyer.activeThreadId = null;
  
  state.activeSection = "profile-update";
  window.history.replaceState(null, "", `#profile-update`);
  render();
  showToast(`Đăng nhập thành công! Vui lòng thiết lập thông tin.`);
}

function renderLoginModal() {
  return `
    <div class="modal-layer active" style="display: flex; align-items: center; justify-content: center; z-index: 2000; background: rgba(0,0,0,0.5);">
      <div class="modal-panel" style="max-width: 400px; width: 90%; padding: 24px; border-radius: 12px; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative; text-align: center;">
        <button class="icon-button close-button" type="button" data-close-modal style="position: absolute; right: 16px; top: 16px; font-size: 24px; background: transparent; border: none; cursor: pointer; color: var(--muted);">&times;</button>
        <h3 style="margin: 0 0 8px; font-size: 20px; font-weight: 800; color: var(--ink);">Yêu cầu đăng nhập</h3>
        <p style="margin: 0 0 20px; font-size: 14px; color: var(--muted);">Vui lòng đăng nhập bằng Google để tiếp tục tương tác trên hệ thống.</p>
        
        <div style="margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; align-items: center; background: #f3f4f6; padding: 16px; border-radius: 8px;">
          <span style="font-size: 14px; font-weight: bold; color: var(--ink);">Chọn vai trò khi đăng nhập Google:</span>
          <div style="display: flex; gap: 16px;">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 14px; color: var(--ink);">
              <input type="radio" name="google-role-select" value="buyer" checked style="accent-color: var(--teal);" />
              Người mua
            </label>
            <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 14px; color: var(--ink);">
              <input type="radio" name="google-role-select" value="seller" style="accent-color: var(--teal);" />
              Ngư dân
            </label>
          </div>
        </div>

        <div style="display: flex; justify-content: center; align-items: center; min-height: 40px; margin-bottom: 16px;">
          <div id="google-signin-btn" style="width: 100%; display: flex; justify-content: center;"></div>
        </div>
        
        ${state.auth.loginReasonMessage ? `
          <div style="margin-bottom: 16px; padding: 10px; border-radius: 6px; background: #fff1f2; border: 1px solid #fecaca; color: #dc2626; font-size: 13px; font-weight: 500; text-align: center; line-height: 1.4;">
            ${escapeHtml(state.auth.loginReasonMessage)}
          </div>
        ` : ""}
        
        <button type="button" class="ghost-button" data-close-modal style="width: 100%;">Đóng</button>
      </div>
    </div>
  `;
}

function renderLoginPage() {
  return `
    <div class="auth-page-wrapper" style="min-height: 100vh; padding: 20px; box-sizing: border-box; width: 100%; display: flex; justify-content: center; align-items: center;">
      <div class="auth-card-single">
        <div class="auth-header-logo" style="margin-bottom: 32px;">
          <a href="#market" style="text-decoration: none;">
            <h1 style="color: #fff; font-size: 32px; font-weight: 800; margin: 0 0 8px 0; background: linear-gradient(135deg, #2dd4bf, #0ea5e9); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">HaiSan.vn</h1>
          </a>
          <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; margin: 0;">Hệ thống kết nối trực tiếp Người mua & Ngư dân</p>
        </div>

        <div style="margin: 28px 0; text-align: left;">
          <label style="display: block; margin-bottom: 12px; font-weight: 700; color: #fff; font-size: 14px; letter-spacing: 0.5px; text-transform: uppercase; opacity: 0.9;">
            Chọn vai trò đăng nhập:
          </label>
          
          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px;">
            <label style="color: #fff; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 15px; background: rgba(255, 255, 255, 0.05); padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.2s;">
              <input type="radio" name="google-role-select" value="buyer" checked style="accent-color: var(--teal); scale: 1.2;" />
              <span>🛍️ Người mua (Buyer)</span>
            </label>
            <label style="color: #fff; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 15px; background: rgba(255, 255, 255, 0.05); padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.2s;">
              <input type="radio" name="google-role-select" value="seller" style="accent-color: var(--teal); scale: 1.2;" />
              <span>🚢 Ngư dân (Seller)</span>
            </label>
          </div>

          <div style="display: flex; justify-content: center; margin-bottom: 12px;">
            <div id="google-signin-btn" style="min-height: 44px; display: flex; justify-content: center; align-items: center; width: 100%;"></div>
          </div>
          
          ${state.auth.loginReasonMessage ? `
            <div style="margin-top: 16px; margin-bottom: 16px; padding: 12px; border-radius: 8px; background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); color: #fda4af; font-size: 13px; font-weight: 500; text-align: center; line-height: 1.4;">
              ${escapeHtml(state.auth.loginReasonMessage)}
            </div>
          ` : ""}
          
          <small style="color: rgba(255, 255, 255, 0.45); display: block; text-align: center; font-size: 12px; margin-top: 8px; line-height: 1.4;">
            Đăng nhập nhanh chóng và bảo mật qua Google để truy cập đầy đủ tính năng online.
          </small>
        </div>

        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px; margin-top: 28px;">
          <a href="#market" style="color: var(--teal); font-size: 14px; font-weight: bold; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: color 0.2s;">
            <span>← Quay lại trang chủ</span>
          </a>
        </div>
      </div>
    </div>
  `;
}

function renderProfileUpdatePage() {
  const audience = userAudience();
  const title = audience === "seller" ? "Thiết lập gian hàng Ngư Dân" : "Hoàn thiện thông tin Người Mua";
  const icon = audience === "seller" ? "🚢" : "🛍️";
  const description = audience === "seller"
    ? "Để hỗ trợ người mua liên hệ và xem thông tin xuất xứ mẻ hải sản, vui lòng điền thêm thông tin gian hàng của bạn."
    : "Vui lòng hoàn tất thông tin giao nhận hàng để hỗ trợ ngư dân vận chuyển hải sản tươi ngon nhất đến bạn.";

  const formFields = audience === "seller"
    ? `
      <div class="auth-form-group">
        <label for="profile-name">Họ và tên ngư dân / Chủ tàu</label>
        <input type="text" id="profile-name" name="name" value="${escapeHtml(state.user?.name || "")}" required placeholder="Nguyễn Văn A" class="form-glow-input" />
      </div>
      <div class="auth-form-group">
        <label for="profile-email">Email liên hệ</label>
        <input type="email" id="profile-email" name="email" value="${escapeHtml(state.user?.email || "")}" required placeholder="email@domain.com" class="form-glow-input" />
      </div>
      <div class="auth-form-group">
        <label for="profile-phone">Số điện thoại liên hệ</label>
        <input type="tel" id="profile-phone" name="phone" value="${escapeHtml(state.user?.phone || "")}" required placeholder="0901234567" class="form-glow-input" />
      </div>
      <div class="auth-form-group">
        <label for="profile-vessel">Số hiệu tàu đánh bắt / Giấy đăng ký</label>
        <input type="text" id="profile-vessel" name="vesselNumber" value="${escapeHtml(state.user?.vesselNumber || "")}" required placeholder="KH-99221-TS" class="form-glow-input" />
      </div>
      <div class="auth-form-group">
        <label for="profile-port">Cảng neo đậu chính</label>
        <input type="text" id="profile-port" name="portOfOrigin" value="${escapeHtml(state.user?.portOfOrigin || "")}" required placeholder="Cảng Hòn Rớ, Nha Trang" class="form-glow-input" />
      </div>
      <div class="auth-form-group">
        <label for="profile-specialty">Chuyên kinh doanh nhóm hải sản nào?</label>
        <select id="profile-specialty" name="specialty" class="form-glow-input">
          <option value="Đánh bắt xa bờ" ${state.user?.specialty === "Đánh bắt xa bờ" ? "selected" : ""}>Đánh bắt xa bờ (Cá thu, Cá ngừ,...)</option>
          <option value="Nuôi trồng lồng bè" ${state.user?.specialty === "Nuôi trồng lồng bè" ? "selected" : ""}>Nuôi trồng lồng bè (Tôm hùm, Cá bớp,...)</option>
          <option value="Đánh bắt gần bờ" ${state.user?.specialty === "Đánh bắt gần bờ" ? "selected" : ""}>Đánh bắt gần bờ & Ven đảo (Ghẹ, Mực lá,...)</option>
          <option value="Hải sản khô & Chế biến" ${state.user?.specialty === "Hải sản khô & Chế biến" ? "selected" : ""}>Hải sản khô & Chế biến sẵn</option>
        </select>
      </div>
    `
    : `
      <div class="auth-form-group">
        <label for="profile-name">Họ và tên</label>
        <input type="text" id="profile-name" name="name" value="${escapeHtml(state.user?.name || "")}" required placeholder="Trần Thị B" class="form-glow-input" />
      </div>
      <div class="auth-form-group">
        <label for="profile-email">Email nhận hóa đơn</label>
        <input type="email" id="profile-email" name="email" value="${escapeHtml(state.user?.email || "")}" required placeholder="email@domain.com" class="form-glow-input" />
      </div>
      <div class="auth-form-group">
        <label for="profile-phone">Số điện thoại giao nhận</label>
        <input type="tel" id="profile-phone" name="phone" value="${escapeHtml(state.user?.phone || "")}" required placeholder="0987654321" class="form-glow-input" />
      </div>
      <div class="auth-form-group">
        <label for="profile-address">Địa chỉ nhận hàng mặc định</label>
        <input type="text" id="profile-address" name="shippingAddress" value="${escapeHtml(state.user?.shippingAddress || "")}" required placeholder="Số 123 Đường Trần Phú, Nha Trang" class="form-glow-input" />
      </div>
      <div class="auth-form-group">
        <label for="profile-favorite">Nhóm hải sản bạn yêu thích nhất</label>
        <select id="profile-favorite" name="favoriteSeafood" class="form-glow-input">
          <option value="Tôm" ${state.user?.favoriteSeafood === "Tôm" ? "selected" : ""}>Các loại tôm (Tôm sú, Tôm hùm, Tôm thẻ,...)</option>
          <option value="Cua/Ghẹ" ${state.user?.favoriteSeafood === "Cua/Ghẹ" ? "selected" : ""}>Cua & Ghẹ biển</option>
          <option value="Cá" ${state.user?.favoriteSeafood === "Cá" ? "selected" : ""}>Cá tươi (Cá bớp, Cá ngừ, Cá hồng,...)</option>
          <option value="Mực/Bạch tuộc" ${state.user?.favoriteSeafood === "Mực/Bạch tuộc" ? "selected" : ""}>Mực lá, Mực ống & Bạch tuộc</option>
          <option value="Sò/Ốc" ${state.user?.favoriteSeafood === "Sò/Ốc" ? "selected" : ""}>Nghêu, Sò, Ốc & Hàu</option>
        </select>
      </div>
    `;

  return `
    <div class="setup-profile-wrapper">
      <div class="setup-profile-card">
        <div class="role-icon-badge">${icon}</div>
        <h2>${title}</h2>
        <p class="setup-desc">${description}</p>
        
        <form class="auth-form" data-setup-profile-form>
          ${formFields}
          <button type="submit" class="setup-profile-submit-btn">Hoàn tất & Tiếp tục</button>
        </form>
      </div>
    </div>
  `;
}

function renderMarket(products) {
  const categories = categoryOptions(state.data.products);
  const latestProducts = [...state.data.products]
    .filter(p => (p.status || "Active") === "Active")
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const activeIdx = latestProducts.length > 0 ? ((state.buyer.featuredIndex || 0) % latestProducts.length + latestProducts.length) % latestProducts.length : 0;
  const featuredProduct = latestProducts.length > 0 ? latestProducts[activeIdx] : null;

  return `
    <section id="market" class="hero-band section-band" data-section="market" style="position: relative;">
      ${latestProducts.length > 1 ? `
        <button type="button" class="hero-nav-btn prev" data-hero-prev aria-label="Mẻ hàng trước" style="position: absolute; left: 24px; top: 50%; transform: translateY(-50%); z-index: 100; width: 48px; height: 48px; border-radius: 50%; background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.25); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; backdrop-filter: blur(4px);">
          <i data-lucide="chevron-left" style="width: 24px; height: 24px;"></i>
        </button>
        <button type="button" class="hero-nav-btn next" data-hero-next aria-label="Mẻ hàng sau" style="position: absolute; right: 24px; top: 50%; transform: translateY(-50%); z-index: 100; width: 48px; height: 48px; border-radius: 50%; background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.25); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; backdrop-filter: blur(4px);">
          <i data-lucide="chevron-right" style="width: 24px; height: 24px;"></i>
        </button>
      ` : ""}
      <div class="hero-visual" aria-hidden="true">
        ${
          latestProducts.length > 0
            ? latestProducts.map((p, idx) => `
              <div class="hero-bg-layer ${idx === activeIdx ? 'active' : ''}" style="background-image: url('${escapeHtml(productImage(p))}');"></div>
            `).join("")
            : `<div class="hero-bg-layer active" style="background-image: url('./assets/seafood-market.png');"></div>`
        }
        <div class="hero-overlay"></div>
      </div>
      <div class="hero-content">
        <div class="hero-copy">
          <span class="eyebrow">Guest và Buyer</span>
          <h1>Chợ hải sản tươi theo mẻ, theo vị trí, theo người bán thật.</h1>
          <p>
            Xem mẻ hàng đang bán, so sánh giá, mở hồ sơ ngư dân và lưu sản phẩm quan tâm trong cùng một giao diện.
          </p>
          ${
            featuredProduct
              ? `
              <div class="hero-featured-card" data-hero-product="${escapeHtml(getId(featuredProduct))}">
                <img src="${escapeHtml(productImage(featuredProduct))}" alt="${escapeHtml(featuredProduct.name)}" />
                <div class="hero-featured-info">
                  <span class="hero-featured-tag">🔥 MỚI CẬP BẾN</span>
                  <h4 class="hero-featured-title">${escapeHtml(featuredProduct.name)}</h4>
                  <span class="hero-featured-price">${formatCurrency(featuredProduct.price)} / kg · ${escapeHtml(featuredProduct.sellerName || "Ngư dân")}</span>
                </div>
                <button class="hero-featured-btn" type="button">Xem ngay ➔</button>
              </div>
              `
              : ""
          }
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
          <button class="primary-button" type="submit" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="search" style="width: 14px; height: 14px;"></i>
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
        <label class="switch-row">
          <input type="checkbox" data-following-only ${state.filters.followingOnly ? "checked" : ""} />
          <span class="switch-ui"></span>
          <span>Đang theo dõi</span>
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
          <button class="ghost-button" type="button" data-refresh title="Tải lại dữ liệu" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i>
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
    <article class="product-card" data-product="${escapeHtml(id)}" style="cursor: pointer;">
      <div class="product-image-container" style="position: relative; aspect-ratio: 4/3; overflow: hidden; border-radius: 8px 8px 0 0;">
        <img src="${escapeHtml(productImage(product))}" alt="${escapeHtml(product.name)}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;" />
        <span class="type-badge ${product.type === "Fresh" ? "fresh" : "dried"}">${product.type === "Fresh" ? "Tươi" : "Khô"}</span>
      </div>
      <div class="product-body">
        <div class="card-topline" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span>${escapeHtml(product.category || "Hải sản")}</span>
            ${renderProductStatus(product.status)}
          </div>
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
              <strong style="display: inline-flex; align-items: center; gap: 4px; vertical-align: middle;">
                ${escapeHtml(product.sellerName || "Một ngư dân")}
                ${verified ? `
                  <svg viewBox="0 0 24 24" width="14" height="14" style="fill: #1877f2; display: inline-block; flex-shrink: 0; vertical-align: middle;">
                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.936.1-1.354.277C14.777 2.548 13.5 1.7 12 1.7s-2.777.848-3.418 2.087c-.418-.178-.874-.277-1.354-.277-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .936-.1 1.354-.277.64 1.24 1.917 2.087 3.418 2.087s2.777-.848 3.418-2.087c.418.178.874.277 1.354.277 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.8 3.8l-3.3-3.3 1.4-1.4 1.9 1.9 5.3-5.3 1.4 1.4-6.7 6.7z"/>
                  </svg>
                ` : ""}
              </strong>
              <small>${verified ? "" : "Hồ sơ mới"}${premium ? (verified ? "Premium" : " · Premium") : ""}</small>
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

function renderSavedProducts() {
  const savedProducts = state.data.products.filter((p) => state.favorites.has(getId(p)));

  return `
    <section id="saved-products" class="section-band" data-section="saved-products" style="background: var(--paper);">
      <div class="section-container">
        <div class="section-title-row" style="margin-bottom: 24px;">
          <div>
            <span class="eyebrow">Bộ sưu tập</span>
            <h2>Sản phẩm đã lưu</h2>
          </div>
        </div>
        ${
          savedProducts.length === 0
            ? `
            <div class="empty-favorites-card" style="text-align: center; padding: 48px 16px; background: #fff; border-radius: var(--radius); border: 1px solid var(--line);">
              <span style="font-size: 48px; display: block; margin-bottom: 16px; color: var(--coral);">♡</span>
              <p style="color: var(--muted); font-size: 16px; margin: 0 0 16px; font-weight: bold;">Bạn chưa lưu sản phẩm nào.</p>
              <a class="primary-button" href="#market" data-nav="market" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">
                Khám phá chợ biển
              </a>
            </div>
            `
            : `
            <div class="product-grid">
              ${savedProducts.map(renderProductCard).join("")}
            </div>
            `
        }
      </div>
    </section>
  `;
}

function renderFishermen() {
  const followed = state.data.fishermen.filter((f) => state.followingSellers.has(getId(f)));
  const suggested = state.data.fishermen.filter((f) => !state.followingSellers.has(getId(f)));

  return `
    <section id="fishermen" class="section-band" data-section="fishermen">
      <div class="section-container">
        ${
          followed.length > 0
            ? `
            <div class="section-title-row" style="margin-bottom: 16px;">
              <div>
                <span class="eyebrow">Seller network</span>
                <h2>Ngư dân đang theo dõi</h2>
              </div>
            </div>
            <div class="seller-grid" style="margin-bottom: 40px;">
              ${followed.map(renderSellerCard).join("")}
            </div>
            `
            : ""
        }

        <div class="section-title-row">
          <div>
            <span class="eyebrow">Seller network</span>
            <h2>Ngư dân nên theo dõi</h2>
          </div>
          <a class="text-link" href="#market" data-nav="market">Xem hàng đang bán</a>
        </div>
        <div class="seller-grid">
          ${suggested.length > 0 ? suggested.map(renderSellerCard).join("") : `<p class="empty-note">Đã theo dõi tất cả ngư dân đề xuất.</p>`}
        </div>
      </div>
    </section>
  `;
}

function renderSellerCard(seller) {
  const id = getId(seller);
  const isFollowing = state.followingSellers.has(id);
  
  // Calculate dynamic products/catches count from state.data.products
  const sellerProducts = state.data.products.filter((p) => p.sellerId === id || p.sellerId === seller._id);
  const productsCount = sellerProducts.length;
  
  // Calculate dynamic followers count in real-time
  const baseFollowers = seller.followersCount || seller.followers || 0;
  const followersCount = isFollowing ? (baseFollowers + 1) : baseFollowers;
  
  return `
    <article class="seller-card" style="position: relative;">
      <button
        class="ghost-button"
        type="button"
        data-toggle-follow="${escapeHtml(id)}"
        style="position: absolute; top: 12px; right: 12px; padding: 4px 10px; font-size: 11px; border-radius: 999px; min-height: auto; font-weight: bold; ${isFollowing ? "background: var(--teal); color: #fff; border-color: var(--teal);" : "border-color: var(--line); color: var(--muted);"}"
        title="${isFollowing ? "Bỏ theo dõi" : "Theo dõi"}"
      >
        ${isFollowing ? "✓ Đang theo dõi" : "＋ Theo dõi"}
      </button>
      <button class="seller-card-main" type="button" data-seller="${escapeHtml(id)}">
        <span class="avatar large">${escapeHtml(initials(seller.name))}</span>
        <span>
          <strong style="display: flex; align-items: center; gap: 4px;">
            ${escapeHtml(seller.name || "Ngư dân")}
            ${seller.isVerified ? `
              <span class="custom-tooltip">
                <svg viewBox="0 0 24 24" width="14" height="14" style="fill: #1877f2; display: inline-block; flex-shrink: 0; cursor: help;">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.936.1-1.354.277C14.777 2.548 13.5 1.7 12 1.7s-2.777.848-3.418 2.087c-.418-.178-.874-.277-1.354-.277-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .936-.1 1.354-.277.64 1.24 1.917 2.087 3.418 2.087s2.777-.848 3.418-2.087c.418.178.874.277 1.354.277 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.8 3.8l-3.3-3.3 1.4-1.4 1.9 1.9 5.3-5.3 1.4 1.4-6.7 6.7z"/>
                </svg>
                <span class="tooltip-text" style="font-size: 9px; padding: 2px 6px;">Đã xác minh</span>
              </span>
            ` : ""}
            ${seller.isPremium ? `
              <span class="custom-tooltip">
                <svg viewBox="0 0 24 24" width="14" height="14" style="fill: #eab308; display: inline-block; flex-shrink: 0; cursor: help; position: relative;">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.936.1-1.354.277C14.777 2.548 13.5 1.7 12 1.7s-2.777.848-3.418 2.087c-.418-.178-.874-.277-1.354-.277-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .936-.1 1.354-.277.64 1.24 1.917 2.087 3.418 2.087s2.777-.848 3.418-2.087c.418.178.874.277 1.354.277 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.8 3.8l-3.3-3.3 1.4-1.4 1.9 1.9 5.3-5.3 1.4 1.4-6.7 6.7z"/>
                  <text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="900" fill="#fff">P</text>
                </svg>
                <span class="tooltip-text" style="font-size: 9px; padding: 2px 6px;">Premium</span>
              </span>
            ` : ""}
          </strong>
          <small>${seller.isVerified ? "" : "Hồ sơ mới"}${seller.isPremium ? (seller.isVerified ? "Premium" : " · Premium") : ""}</small>
        </span>
      </button>
      <p style="margin-right: 90px; margin-bottom: 12px;">${escapeHtml(seller.bio || seller.description || "Đang cập nhật thông tin hồ sơ.")}</p>
      <div class="seller-stats">
        <span><strong>${Number(seller.ratingAvg || seller.rating || 4.8).toFixed(1)}</strong> sao</span>
        <span><strong>${productsCount}</strong> mẻ</span>
        <span><strong>${followersCount}</strong> theo dõi</span>
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
  
  const diffMap = {
    easy: { text: "Dễ", color: "#15803d", bg: "#f0fdf4" },
    medium: { text: "Trung bình", color: "#a16207", bg: "#fefce8" },
    hard: { text: "Khó", color: "#b91c1c", bg: "#fef2f2" }
  };
  const diffKey = (recipe.difficulty || "medium").toLowerCase();
  const diff = diffMap[diffKey] || diffMap.medium;

  return `
    <article class="recipe-card" data-recipe="${escapeHtml(recipe.id)}" style="cursor: pointer;">
      <div class="recipe-image">
        <img src="${escapeHtml(recipe.imageUrl || "./assets/seafood-market.png")}" alt="${escapeHtml(recipe.title)}" loading="lazy" />
      </div>
      <div class="recipe-body">
        <span class="pill" style="color: ${diff.color}; background: ${diff.bg}; font-weight: 900; border: 1px solid currentColor;">${diff.text}</span>
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
  if (!state.user) {
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

  const isEditing = !!state.seller.editingPostId;
  const editingPost = isEditing
    ? (state.seller.posts.find(p => getId(p) === state.seller.editingPostId) || state.data.posts.find(p => getId(p) === state.seller.editingPostId))
    : null;

  const title = editingPost ? editingPost.title : "";
  const content = editingPost ? editingPost.content : "";
  const tags = editingPost
    ? (Array.isArray(editingPost.tags) ? editingPost.tags.join(", ") : (editingPost.tags || ""))
    : "";

  return `
    <section id="community" class="section-band" data-section="community">
      <div class="section-container">
        <div class="section-title-row">
          <div>
            <span class="eyebrow">Forum</span>
            <h2>Câu chuyện mua bán</h2>
          </div>
        </div>
        <div class="seller-two-column">
          <section class="seller-work-card">
            <div class="section-title-row compact-title">
              <div>
                <span class="eyebrow">${isEditing ? "Community edit" : "Community"}</span>
                <h3>${isEditing ? "Chỉnh sửa bài đăng" : "Chia sẻ câu chuyện"}</h3>
              </div>
            </div>
            <form class="seller-form" data-seller-post-form>
              ${isEditing ? `<input type="hidden" name="postId" value="${escapeHtml(state.seller.editingPostId)}" />` : ""}
              <label>
                <span>Tiêu đề</span>
                <input name="title" required placeholder="Chia sẻ kinh nghiệm mua hải sản..." value="${escapeHtml(title)}" />
              </label>
              <label>
                <span>Nội dung</span>
                <textarea name="content" required rows="7" placeholder="Viết câu chuyện của bạn ở đây...">${escapeHtml(content)}</textarea>
              </label>
              <label class="image-upload-field">
                <span>Ảnh bài viết ${isEditing ? "(Để trống nếu giữ nguyên)" : ""}</span>
                <input name="postImages" type="file" accept="image/*" multiple data-image-preview="post-image-preview" data-image-max="4" />
                <small>Chọn tối đa 4 ảnh. Dung lượng dưới 4MB/ảnh.</small>
              </label>
              <div class="image-upload-preview multi" data-image-preview-target="post-image-preview">
                ${
                  isEditing && editingPost && editingPost.images && editingPost.images.length
                    ? editingPost.images.map(img => `<img src="${escapeHtml(img)}" style="max-height: 80px; border-radius: 4px;" />`).join("")
                    : `<span>Chưa chọn ảnh</span>`
                }
              </div>
              <label>
                <span>Thẻ (cách nhau bằng dấu phẩy)</span>
                <input name="tags" placeholder="kinhnghiem, cuaghe, meo" value="${escapeHtml(tags)}" />
              </label>
              <div style="display: flex; gap: 10px;">
                <button class="primary-button" type="submit" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;">
                  ${isEditing ? `<i data-lucide="check" style="width: 16px; height: 16px;"></i>` : `<i data-lucide="plus" style="width: 16px; height: 16px;"></i>`}
                  <span>${isEditing ? "Lưu thay đổi" : "Đăng bài viết"}</span>
                </button>
                ${
                  isEditing
                    ? `
                    <button class="ghost-button" type="button" data-cancel-post-edit>
                      <span>Hủy</span>
                    </button>
                    `
                    : ""
                }
              </div>
            </form>
          </section>

          <section class="seller-work-card">
            <div class="section-title-row compact-title">
              <div>
                <span class="eyebrow">All posts</span>
                <h3>Danh sách bài viết</h3>
              </div>
            </div>
            <div class="seller-content-list" style="display: grid; gap: 16px;">
              ${
                state.data.posts.length
                  ? state.data.posts.map(renderPostCard).join("")
                  : `<p class="empty-note">Chưa có bài viết nào.</p>`
              }
            </div>
          </section>
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
          <button class="ghost-button" type="button" data-refresh-seller style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i>
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
      ${renderProductStatus(product.status)}
    </article>
  `;
}

function renderSellerProducts() {
  const isEditing = !!state.seller.editingProductId;
  const editingProduct = isEditing
    ? state.seller.products.find(p => getId(p) === state.seller.editingProductId)
    : null;

  const name = editingProduct ? editingProduct.name : "";
  const type = editingProduct ? editingProduct.type : "Fresh";
  const category = editingProduct ? editingProduct.category : "Fish";
  const price = editingProduct ? editingProduct.price : "";
  const totalWeight = editingProduct ? editingProduct.totalWeight : "";
  const salesType = editingProduct ? editingProduct.salesType : "Retail";
  const origin = editingProduct ? editingProduct.origin : "";
  const description = editingProduct ? editingProduct.description || "" : "";
  const lat = editingProduct && editingProduct.location ? editingProduct.location.coordinates[1] : 10.762622;
  const lng = editingProduct && editingProduct.location ? editingProduct.location.coordinates[0] : 106.660172;

  const selectFresh = type === "Fresh" ? "selected" : "";
  const selectDried = type === "Dried" ? "selected" : "";

  const selectRetail = salesType === "Retail" ? "selected" : "";
  const selectWholesale = salesType === "Wholesale" ? "selected" : "";

  return `
    <div class="seller-two-column">
      <section class="seller-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">${isEditing ? "Edit listing" : "Create listing"}</span>
            <h3>${isEditing ? "Chỉnh sửa mẻ hàng" : "Đăng mẻ hàng"}</h3>
          </div>
        </div>
        <form class="seller-form" data-seller-product-form>
          ${isEditing ? `<input type="hidden" name="productId" value="${escapeHtml(state.seller.editingProductId)}" />` : ""}
          <label>
            <span>Tên mẻ hàng</span>
            <input name="name" required minlength="2" placeholder="Cua gạch Cần Giờ" value="${escapeHtml(name)}" />
          </label>
          <div class="form-grid-2">
            <label>
              <span>Loại</span>
              <select name="type">
                <option value="Fresh" ${selectFresh}>Tươi sống</option>
                <option value="Dried" ${selectDried}>Đồ khô</option>
              </select>
            </label>
            <label>
              <span>Danh mục</span>
              <select name="category">
                ${productCategories
                  .map(([value, label]) => `<option value="${value}" ${category === value ? "selected" : ""}>${label}</option>`)
                  .join("")}
              </select>
            </label>
          </div>
          <div class="form-grid-2">
            <label>
              <span>Giá / kg</span>
              <input name="price" type="number" min="1" required placeholder="250000" value="${price}" />
            </label>
            <label>
              <span>Khối lượng kg</span>
              <input name="totalWeight" type="number" min="0.1" step="0.1" required placeholder="20" value="${totalWeight}" />
            </label>
          </div>
          <div class="form-grid-2">
            <label>
              <span>Hình thức</span>
              <select name="salesType">
                <option value="Retail" ${selectRetail}>Bán lẻ</option>
                <option value="Wholesale" ${selectWholesale}>Bán sỉ</option>
              </select>
            </label>
            <label>
              <span>Xuất xứ</span>
              <input name="origin" placeholder="Cần Giờ, TP.HCM" value="${escapeHtml(origin)}" />
            </label>
          </div>
          <input type="hidden" id="seller-lat" name="lat" value="${lat}" />
          <input type="hidden" id="seller-lng" name="lng" value="${lng}" />
          <label style="display: block; margin-bottom: 16px;">
            <span style="font-weight: 700; color: var(--ink); display: block; margin-bottom: 6px;">Vị trí mẻ lưới / Vị trí bán</span>
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <button type="button" class="ghost-button" id="open-map-modal-btn" style="border-color: var(--seller-orange-line); color: var(--seller-orange); display: inline-flex; align-items: center; gap: 6px; font-weight: 700; padding: 10px 16px;">
                📍 Chọn vị trí trên bản đồ
              </button>
              <span id="selected-coords-display" style="font-size: 13px; color: var(--muted); font-weight: 600;">
                ${lat && lng ? `Đã chọn: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}` : "Chưa chọn vị trí"}
              </span>
            </div>
          </label>
          <label class="image-upload-field">
            <span>Ảnh sản phẩm</span>
            <input name="imageFile" type="file" accept="image/*" data-image-preview="product-image-preview" data-image-max="1" />
            <small>Chọn ảnh từ máy tính hoặc thư viện ảnh trên điện thoại. Tối đa 4MB.</small>
          </label>
          <div class="image-upload-preview" data-image-preview-target="product-image-preview">
            ${
              isEditing && editingProduct && editingProduct.images && editingProduct.images.length
                ? `<img src="${escapeHtml(editingProduct.images[0])}" style="max-height: 100px; border-radius: 4px;" />`
                : `<span>Chưa chọn ảnh</span>`
            }
          </div>
          <label>
            <span>Mô tả</span>
            <textarea name="description" rows="4" placeholder="Mô tả độ tươi, cách đóng gói, thời gian giao...">${escapeHtml(description)}</textarea>
          </label>
          <div style="display: flex; gap: 10px;">
            <button class="primary-button" type="submit" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;">
              ${isEditing ? `<i data-lucide="check" style="width: 16px; height: 16px;"></i>` : `<i data-lucide="plus" style="width: 16px; height: 16px;"></i>`}
              <span>${isEditing ? "Lưu thay đổi" : "Đăng mẻ hàng"}</span>
            </button>
            ${
              isEditing
                ? `
                <button class="ghost-button" type="button" data-cancel-product-edit>
                  <span>Hủy</span>
                </button>
                `
                : ""
            }
          </div>
        </form>
      </section>

      <section class="seller-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">Listings</span>
            <h3>Sản phẩm của tôi</h3>
          </div>
          <button class="ghost-button" type="button" data-refresh-seller style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i>
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
    <article class="seller-product-item" data-product="${escapeHtml(id)}" style="cursor: pointer;">
      <div class="seller-product-item-main">
        <img src="${escapeHtml(productImage(product))}" alt="${escapeHtml(product.name)}" />
        <div class="seller-product-item-details" style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px;">
          <div class="card-topline" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; width: 100%;">
            <span style="font-size: 11px; font-weight: 700; color: var(--seller-orange-ink, #0c4a6e); background: var(--seller-orange-soft, #f0f9ff); padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
              ${escapeHtml(categoryLabel(product.category))}
            </span>
            ${renderProductStatus(product.status)}
          </div>
          <h4 style="font-size: 17px; font-weight: 800; color: var(--ink); margin: 4px 0 2px 0;">${escapeHtml(product.name || "Mẻ hàng")}</h4>
          <p style="font-size: 13px; color: var(--muted); margin: 0 0 4px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${escapeHtml(product.description || "Chưa có mô tả.")}
          </p>
          <div class="meta-row" style="display: flex; align-items: center; gap: 14px; font-size: 13px; color: var(--muted); flex-wrap: wrap; margin-top: auto; border: none; padding: 0; background: transparent;">
            <strong style="color: var(--seller-orange, #0ea5e9); font-size: 15px; font-weight: 800;">${formatCurrency(product.price)}</strong>
            <span style="display: flex; align-items: center; gap: 4px;"><i data-lucide="scale" style="width: 14px; height: 14px;"></i> ${Number(product.remainingWeight || product.totalWeight || 0)} kg còn</span>
            <span style="display: flex; align-items: center; gap: 4px;"><i data-lucide="calendar" style="width: 14px; height: 14px;"></i> ${formatDate(product.bumpedAt || product.createdAt)}</span>
          </div>
        </div>
      </div>
      
      <div class="item-actions" style="display: flex; align-items: center; gap: 8px; border-top: 1px solid var(--line, #f1f5f9); padding-top: 12px; margin-top: 4px; flex-wrap: wrap; width: 100%; justify-content: flex-end;">
        <button class="ghost-button" type="button" data-seller-toggle-status="${escapeHtml(id)}" style="display: flex; align-items: center; gap: 6px; padding: 8px 12px; font-size: 13px;">
          <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i>
          <span>${product.status === "Active" ? "Báo hết hàng" : "Báo còn hàng"}</span>
        </button>
        <button class="ghost-button" type="button" data-seller-edit="${escapeHtml(id)}" style="display: flex; align-items: center; gap: 6px; padding: 8px 12px; font-size: 13px;">
          <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
          <span>Sửa</span>
        </button>
        <button class="ghost-button" type="button" data-seller-bump="${escapeHtml(id)}" style="display: flex; align-items: center; gap: 6px; padding: 8px 12px; font-size: 13px;">
          <i data-lucide="arrow-up" style="width: 14px; height: 14px;"></i>
          <span>Đẩy tin</span>
        </button>
        <button class="ghost-button danger" type="button" data-seller-delete="${escapeHtml(id)}" style="display: flex; align-items: center; gap: 6px; padding: 8px 12px; font-size: 13px;">
          <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          <span>Xóa</span>
        </button>
      </div>
    </article>
  `;
}

function renderSellerRecipes() {
  const isEditing = !!state.seller.editingRecipeId;
  const editingRecipe = isEditing
    ? state.seller.recipes.find(r => getId(r) === state.seller.editingRecipeId)
    : null;

  const title = editingRecipe ? editingRecipe.title : "";
  const description = editingRecipe ? editingRecipe.description : "";
  const difficulty = editingRecipe ? editingRecipe.difficulty : "Medium";
  const cookingTime = editingRecipe ? editingRecipe.cookingTime : 30;
  const ingredientsList = editingRecipe
    ? (Array.isArray(editingRecipe.ingredients) ? editingRecipe.ingredients.join("\n") : (editingRecipe.ingredients || ""))
    : "";
  const instructionsList = editingRecipe
    ? (Array.isArray(editingRecipe.instructions || editingRecipe.steps) ? (editingRecipe.instructions || editingRecipe.steps).join("\n") : (editingRecipe.instructions || editingRecipe.steps || ""))
    : "";
  const tags = editingRecipe
    ? (Array.isArray(editingRecipe.tags) ? editingRecipe.tags.join(", ") : (editingRecipe.tags || ""))
    : "";

  const selectEasy = difficulty === "Easy" ? "selected" : "";
  const selectMedium = difficulty === "Medium" ? "selected" : "";
  const selectHard = difficulty === "Hard" ? "selected" : "";

  return `
    <div class="seller-two-column">
      <section class="seller-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">${isEditing ? "Kitchen edit" : "Kitchen content"}</span>
            <h3>${isEditing ? "Chỉnh sửa công thức" : "Viết công thức"}</h3>
          </div>
        </div>
        <form class="seller-form" data-seller-recipe-form>
          ${isEditing ? `<input type="hidden" name="recipeId" value="${escapeHtml(state.seller.editingRecipeId)}" />` : ""}
          <label>
            <span>Tiêu đề</span>
            <input name="title" required placeholder="Cua hấp sả gừng" value="${escapeHtml(title)}" />
          </label>
          <label>
            <span>Mô tả</span>
            <textarea name="description" required rows="3" placeholder="Giới thiệu ngắn về món ăn">${escapeHtml(description)}</textarea>
          </label>
          <div class="form-grid-2">
            <label>
              <span>Độ khó</span>
              <select name="difficulty">
                <option value="Easy" ${selectEasy}>Dễ</option>
                <option value="Medium" ${selectMedium}>Vừa</option>
                <option value="Hard" ${selectHard}>Khó</option>
              </select>
            </label>
            <label>
              <span>Thời gian phút</span>
              <input name="cookingTime" type="number" min="1" value="${cookingTime}" />
            </label>
          </div>
          <label>
            <span>Nguyên liệu mỗi dòng</span>
            <textarea name="ingredients" required rows="4" placeholder="2 con cua&#10;3 cây sả&#10;Gừng, muối tiêu">${escapeHtml(ingredientsList)}</textarea>
          </label>
          <label>
            <span>Các bước mỗi dòng</span>
            <textarea name="instructions" required rows="4" placeholder="Rửa sạch cua&#10;Đập dập sả gừng&#10;Hấp 15 phút">${escapeHtml(instructionsList)}</textarea>
          </label>
          <label>
            <span>Tags</span>
            <input name="tags" placeholder="Cua, Hấp, Nhanh" value="${escapeHtml(tags)}" />
          </label>
          <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
            <button class="primary-button" type="submit" style="display: flex; align-items: center; gap: 6px;">
              ${isEditing ? `<i data-lucide="check" style="width: 16px; height: 16px;"></i>` : `<i data-lucide="plus" style="width: 16px; height: 16px;"></i>`}
              <span>${isEditing ? "Lưu thay đổi" : "Đăng công thức"}</span>
            </button>
            ${
              isEditing
                ? `
                <button class="ghost-button" type="button" data-cancel-recipe-edit style="height: 42px;">
                  <span>Hủy</span>
                </button>
                `
                : ""
            }
          </div>
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
  const id = getId(recipe);
  return `
    <article class="seller-content-item" data-recipe="${escapeHtml(id)}" style="cursor: pointer;">
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
  const isEditing = !!state.seller.editingPostId;
  const editingPost = isEditing
    ? state.seller.posts.find(p => getId(p) === state.seller.editingPostId)
    : null;

  const title = editingPost ? editingPost.title : "";
  const content = editingPost ? editingPost.content : "";
  const tags = editingPost
    ? (Array.isArray(editingPost.tags) ? editingPost.tags.join(", ") : (editingPost.tags || ""))
    : "";

  return `
    <div class="seller-two-column">
      <section class="seller-work-card">
        <div class="section-title-row compact-title">
          <div>
            <span class="eyebrow">${isEditing ? "Community edit" : "Community"}</span>
            <h3>${isEditing ? "Chỉnh sửa bài đăng" : "Viết bài bán hàng"}</h3>
          </div>
        </div>
        <form class="seller-form" data-seller-post-form>
          ${isEditing ? `<input type="hidden" name="postId" value="${escapeHtml(state.seller.editingPostId)}" />` : ""}
          <label>
            <span>Tiêu đề</span>
            <input name="title" required placeholder="Mẻ cua sáng nay đã cập bến" value="${escapeHtml(title)}" />
          </label>
          <label>
            <span>Nội dung</span>
            <textarea name="content" required rows="7" placeholder="Kể câu chuyện mẻ hàng, cách đặt, khu vực giao...">${escapeHtml(content)}</textarea>
          </label>
          <label class="image-upload-field">
            <span>Ảnh bài viết ${isEditing ? "(Để trống nếu giữ nguyên)" : ""}</span>
            <input name="postImages" type="file" accept="image/*" multiple data-image-preview="post-image-preview" data-image-max="4" />
            <small>Chọn tối đa 4 ảnh từ máy tính hoặc điện thoại. Mỗi ảnh tối đa 4MB.</small>
          </label>
          <div class="image-upload-preview multi" data-image-preview-target="post-image-preview">
            <span>${isEditing ? "Giữ nguyên ảnh cũ hoặc chọn ảnh mới" : "Chưa chọn ảnh"}</span>
          </div>
          <label>
            <span>Tags</span>
            <input name="tags" placeholder="Cua, Cần Giờ, Giao sáng" value="${escapeHtml(tags)}" />
          </label>
          <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
            <button class="primary-button" type="submit" style="display: flex; align-items: center; gap: 6px;">
              ${isEditing ? `<i data-lucide="check" style="width: 16px; height: 16px;"></i>` : `<i data-lucide="plus" style="width: 16px; height: 16px;"></i>`}
              <span>${isEditing ? "Lưu thay đổi" : "Đăng bài"}</span>
            </button>
            ${
              isEditing
                ? `
                <button class="ghost-button" type="button" data-cancel-post-edit style="height: 42px;">
                  <span>Hủy</span>
                </button>
                `
                : ""
            }
          </div>
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
  const images = Array.isArray(post.images) ? post.images.filter(Boolean).slice(0, 3) : [];
  const id = getId(post);
  return `
    <article class="seller-content-item" data-post="${escapeHtml(id)}" style="cursor: pointer;">
      <h4>${escapeHtml(post.title || "Bài viết")}</h4>
      <p>${escapeHtml(post.content || "")}</p>
      ${
        images.length
          ? `<div class="seller-post-images">${images
              .map((src) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(post.title || "Ảnh bài viết")}" />`)
              .join("")}</div>`
          : ""
      }
      <div class="meta-row">
        <span>${likes} thích</span>
        <span>${comments} bình luận</span>
        <span>${formatDate(post.createdAt)}</span>
      </div>
    </article>
  `;
}

function renderSellerMessages() {
  const conversations = ensureSellerConversations();
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
          ${conversations.map(renderSellerConversationCard).join("")}
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

function renderSellerConversationCard(thread) {
  const lastMessage = thread.messages.at(-1);
  return `
    <button class="inbox-thread" type="button" data-open-chat="${escapeHtml(thread.id)}">
      <span class="avatar mini">${escapeHtml(initials(thread.buyerName))}</span>
      <span class="inbox-thread-main">
        <strong>${escapeHtml(thread.buyerName)}</strong>
        <span>${escapeHtml(conversationPreview(lastMessage))}</span>
      </span>
      <span class="inbox-thread-meta">
        <small>${formatChatTime(lastMessage?.createdAt)}</small>
        ${thread.unread ? `<b>${Number(thread.unread)}</b>` : ""}
      </span>
    </button>
  `;
}

function renderBuyerChatLauncher() {
  const conversations = ensureBuyerConversations();
  const firstThread = conversations[0];
  if (!firstThread) return "";
  const unread = conversations.reduce((total, thread) => total + Number(thread.unread || 0), 0);
  return `
    <button
      class="buyer-chat-fab"
      type="button"
      data-buyer-open-chat="${escapeHtml(firstThread.id)}"
      title="Mở chat buyer"
      aria-label="Mở chat buyer"
    >
      <span aria-hidden="true">💬</span>
      <strong>Tin nhắn</strong>
      ${unread ? `<b>${unread}</b>` : ""}
    </button>
  `;
}

function renderAIChatbot() {
  const audience = userAudience();
  if (audience !== "buyer" && audience !== "seller") return "";

  const isOpen = !!state.chatbot?.open;
  const messages = state.chatbot?.messages || [];
  const loading = !!state.chatbot?.loading;

  return `
    <!-- Launcher Button -->
    <button
      class="ai-chatbot-launcher"
      type="button"
      data-toggle-ai-chatbot
      title="Trợ lý Hải Sản AI"
      aria-label="Trợ lý Hải Sản AI"
    >
      <span aria-hidden="true">🤖</span>
    </button>

    <!-- Chat Window -->
    ${isOpen ? `
      <div class="ai-chatbot-window" role="dialog" aria-label="Hộp thoại Trợ lý Hải Sản">
        <!-- Header -->
        <header style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--teal); color: white;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">🤖</span>
            <div>
              <strong style="display: block; font-size: 14px; line-height: 1.2;">Trợ lý Hải Sản</strong>
              <small style="font-size: 11px; opacity: 0.9;">AI hỗ trợ trực tuyến</small>
            </div>
          </div>
          <button type="button" data-toggle-ai-chatbot style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0 4px; line-height: 1;">×</button>
        </header>

        <!-- Message List -->
        <div class="ai-chatbot-messages" style="flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: #f8fafc;">
          ${messages.map(msg => `
            <div style="display: flex; flex-direction: column; align-items: ${msg.role === "user" ? "flex-end" : "flex-start"}; max-width: 85%; align-self: ${msg.role === "user" ? "flex-end" : "flex-start"};">
              <div style="padding: 10px 14px; border-radius: 12px; font-size: 13.5px; line-height: 1.5; ${msg.role === "user" ? "background: var(--teal); color: white; border-bottom-right-radius: 2px;" : "background: white; color: var(--ink); border: 1px solid var(--line); border-bottom-left-radius: 2px;"}">
                ${formatMarkdown(msg.content)}
              </div>
            </div>
          `).join("")}
          ${loading ? `
            <div style="display: flex; align-items: center; gap: 4px; padding: 10px 14px; border-radius: 12px; background: white; border: 1px solid var(--line); align-self: flex-start; max-width: 80%; border-bottom-left-radius: 2px;">
              <span class="typing-dot"></span>
              <span class="typing-dot" style="animation-delay: 0.2s;"></span>
              <span class="typing-dot" style="animation-delay: 0.4s;"></span>
            </div>
          ` : ""}
        </div>

        <!-- Input Form -->
        <form data-ai-chatbot-form style="display: flex; padding: 10px 12px; border-top: 1px solid var(--line); background: white; gap: 8px;">
          <input
            type="text"
            name="message"
            required
            placeholder="Hỏi về hải sản, tính năng..."
            autocomplete="off"
            style="flex: 1; padding: 8px 12px; border: 1px solid var(--line); border-radius: 20px; font-size: 13.5px; outline: none;"
          />
          <button class="primary-button" type="submit" style="width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 0; flex-shrink: 0; min-height: unset;">
            <span style="font-size: 14px;">✈</span>
          </button>
        </form>
      </div>
    ` : ""}
  `;
}

function getThreadOnlineStatus(threadId) {
  const idStr = String(threadId || "demo");
  const charCodeSum = Array.from(idStr).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const isOnline = charCodeSum % 2 === 0;
  if (isOnline) {
    return {
      online: true,
      label: "Đang hoạt động"
    };
  } else {
    const minutesAgo = (charCodeSum % 45) + 1;
    return {
      online: false,
      label: `Hoạt động ${minutesAgo} phút trước`
    };
  }
}



function renderChatHeads() {
  const buyerMinimized = Array.from(state.buyer.minimizedThreads);
  const sellerMinimized = Array.from(state.seller.minimizedThreads);
  
  if (buyerMinimized.length === 0 && sellerMinimized.length === 0) {
    return "";
  }
  
  let headsHtml = "";
  
  // Render Buyer Minimized Threads
  buyerMinimized.forEach((threadId) => {
    const thread = ensureBuyerConversations().find(t => t.id === threadId);
    if (!thread) return;
    const status = getThreadOnlineStatus(thread.id);
    headsHtml += `
      <div class="chat-head-item" data-restore-chat="buyer" data-thread-id="${escapeHtml(thread.id)}" style="position: relative; width: 48px; height: 48px; cursor: pointer; transition: transform 0.2s;" title="Trò chuyện với ${escapeHtml(thread.sellerName)}">
        <span class="avatar" style="width: 48px; height: 48px; font-size: 16px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #e0f2fe; color: #0369a1; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 2px solid #fff;">
          ${escapeHtml(initials(thread.sellerName))}
        </span>
        ${status.online ? `
          <span class="online-dot" style="position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px; background: #22c55e; border: 2px solid #fff; border-radius: 50%;"></span>
        ` : ""}
        <button class="chat-head-close" data-close-chat-head="buyer" data-thread-id="${escapeHtml(thread.id)}" style="position: absolute; top: -4px; right: -4px; width: 18px; height: 18px; border-radius: 50%; background: #ef4444; color: #fff; border: none; font-size: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: opacity 0.2s; z-index: 10;">×</button>
      </div>
    `;
  });
  
  // Render Seller Minimized Threads
  sellerMinimized.forEach((threadId) => {
    const thread = ensureSellerConversations().find(t => t.id === threadId);
    if (!thread) return;
    const status = getThreadOnlineStatus(thread.id);
    headsHtml += `
      <div class="chat-head-item" data-restore-chat="seller" data-thread-id="${escapeHtml(thread.id)}" style="position: relative; width: 48px; height: 48px; cursor: pointer; transition: transform 0.2s;" title="Trò chuyện với ${escapeHtml(thread.buyerName)}">
        <span class="avatar" style="width: 48px; height: 48px; font-size: 16px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #e0f2fe; color: #0369a1; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 2px solid #fff;">
          ${escapeHtml(initials(thread.buyerName))}
        </span>
        ${status.online ? `
          <span class="online-dot" style="position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px; background: #22c55e; border: 2px solid #fff; border-radius: 50%;"></span>
        ` : ""}
        <button class="chat-head-close" data-close-chat-head="seller" data-thread-id="${escapeHtml(thread.id)}" style="position: absolute; top: -4px; right: -4px; width: 18px; height: 18px; border-radius: 50%; background: #ef4444; color: #fff; border: none; font-size: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: opacity 0.2s; z-index: 10;">×</button>
      </div>
    `;
  });
  return `
    <div class="chat-heads-container" style="position: fixed; right: 24px; bottom: 80px; display: flex; flex-direction: column; align-items: center; gap: 12px; z-index: 9999;">
      ${headsHtml}
    </div>
  `;
}

function renderSellerChatModal() {
  const thread = sellerConversationById();
  if (!thread) return "";
  const isMinimized = state.seller.minimizedThreads.has(thread.id);
  if (isMinimized) return "";
  const status = getThreadOnlineStatus(thread.id);
  
  const recordLabel = state.seller.recording 
    ? `<span style="color: var(--coral, #f43f5e); display: flex; align-items: center; gap: 4px; font-weight: 700; font-size: 11px;"><i data-lucide="square" style="width: 12px; height: 12px; fill: var(--coral, #f43f5e);"></i> ${state.seller.recordSeconds || 0}s</span>`
    : `<i data-lucide="mic" style="width: 16px; height: 16px;"></i>`;
    
  return `
    <div class="messenger-layer" role="dialog" aria-modal="false" aria-label="Hộp thoại chat với ${escapeHtml(thread.buyerName)}">
      <section class="messenger-window ${isMinimized ? "minimized" : ""}">
        <header class="messenger-head" data-chat-header-toggle="seller" style="cursor: pointer; user-select: none;">
          <div class="messenger-person" style="position: relative;">
            <div style="position: relative; width: 34px; height: 34px; flex-shrink: 0;">
              <span class="avatar" style="width: 34px; height: 34px; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #e0f2fe; color: #0369a1; font-weight: bold;">
                ${escapeHtml(initials(thread.buyerName))}
              </span>
              ${status.online ? `
                <span class="online-dot" style="position: absolute; bottom: -1px; right: -1px; width: 10px; height: 10px; background: #22c55e; border: 2px solid #fff; border-radius: 50%;"></span>
              ` : ""}
            </div>
            <div style="display: flex; flex-direction: column; min-width: 0;">
              <span style="font-weight: 700; font-size: 14.5px; color: #050505; display: inline-flex; align-items: center; gap: 4px;">
                ${escapeHtml(thread.buyerName)} 
                <i data-lucide="chevron-down" style="width: 12px; height: 12px; opacity: 0.6;"></i>
              </span>
              <span style="font-size: 11px; color: #65676b; display: block; font-weight: normal; margin-top: -1px;">
                ${escapeHtml(status.label)}
              </span>
            </div>
          </div>
          <div class="messenger-actions" style="display: flex; align-items: center; gap: 6px;">
            <button type="button" data-chat-action="voice" title="Gọi thoại" style="display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="phone" style="width: 15px; height: 15px;"></i></button>
            <button type="button" data-chat-action="video" title="Gọi video" style="display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="video" style="width: 15px; height: 15px;"></i></button>
            <button type="button" data-chat-action="minimize" data-chat-role="seller" title="Ẩn/Hiện trò chuyện" style="display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="minus" style="width: 15px; height: 15px;"></i></button>
            <button type="button" data-close-chat title="Đóng" style="display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="x" style="width: 15px; height: 15px;"></i></button>
          </div>
        </header>
        <div class="messenger-security" style="background: #f0f2f5; font-size: 11.5px; text-align: center; color: #65676b; padding: 6px 12px;">
          Tin nhắn demo đã sẵn UI realtime.
        </div>
        <div class="messenger-body">
          <div style="flex-grow: 1;"></div>
          ${thread.messages.map((message) => renderChatMessage(message, "seller")).join("")}
        </div>
        ${state.seller.emojiOpen ? renderEmojiPicker() : ""}
        <form class="messenger-compose" data-chat-send-form style="border-top: 1px solid #e4e6eb; background: #fff; padding: 8px 10px;">
          <div class="messenger-tools" aria-label="Công cụ gửi tin" style="display: flex; align-items: center; gap: 4px;">
            <button type="button" data-chat-file-trigger title="Gửi tệp" style="display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i></button>
            <button type="button" data-chat-image-trigger title="Gửi hình ảnh" style="display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="image" style="width: 16px; height: 16px;"></i></button>
            <button type="button" data-chat-action="location" title="Gửi vị trí" style="display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="map-pin" style="width: 16px; height: 16px;"></i></button>
            <button class="${state.seller.recording ? "is-recording" : ""}" type="button" data-chat-action="record" title="Ghi âm" style="display: inline-flex; align-items: center; justify-content: center;">${recordLabel}</button>
          </div>
          <input class="visually-hidden" name="chatFile" type="file" multiple data-chat-file-input />
          <input class="visually-hidden" name="chatImage" type="file" accept="image/*" multiple data-chat-image-input />
          <label class="messenger-input" style="position: relative; display: flex; align-items: center; flex: 1;">
            <input name="message" autocomplete="off" placeholder="Aa" style="width: 100%; min-height: 36px; border: 0; border-radius: 18px; padding: 0 36px 0 12px; background: #f0f2f5; font-size: 14px; color: #050505;" />
            <button type="button" data-chat-action="emoji" title="Gửi emoji" style="position: absolute; right: 4px; top: 4px; width: 28px; height: 28px; background: transparent; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--chat-accent, #0084ff);"><i data-lucide="smile" style="width: 18px; height: 18px;"></i></button>
          </label>
          <button class="messenger-send" type="submit" title="Gửi" style="display: inline-flex; align-items: center; justify-content: center;">
            <i data-lucide="thumbs-up" style="width: 16px; height: 16px;"></i>
          </button>
        </form>
      </section>
    </div>
  `;
}

function renderBuyerChatModal() {
  const thread = buyerConversationById();
  if (!thread) return "";
  const isMinimized = state.buyer.minimizedThreads.has(thread.id);
  if (isMinimized) return "";
  const status = getThreadOnlineStatus(thread.id);
  
  const recordLabel = state.buyer.recording 
    ? `<span style="color: var(--coral, #f43f5e); display: flex; align-items: center; gap: 4px; font-weight: 700; font-size: 11px;"><i data-lucide="square" style="width: 12px; height: 12px; fill: var(--coral, #f43f5e);"></i> ${state.buyer.recordSeconds || 0}s</span>`
    : `<i data-lucide="mic" style="width: 16px; height: 16px;"></i>`;
    
  return `
    <div class="messenger-layer buyer-messenger" role="dialog" aria-modal="false" aria-label="Hộp thoại chat với ${escapeHtml(thread.sellerName)}">
      <section class="messenger-window ${isMinimized ? "minimized" : ""}">
        <header class="messenger-head" data-chat-header-toggle="buyer" style="cursor: pointer; user-select: none;">
          <div class="messenger-person" style="position: relative;">
            <div style="position: relative; width: 34px; height: 34px; flex-shrink: 0;">
              <span class="avatar" style="width: 34px; height: 34px; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #e0f2fe; color: #0369a1; font-weight: bold;">
                ${escapeHtml(initials(thread.sellerName))}
              </span>
              ${status.online ? `
                <span class="online-dot" style="position: absolute; bottom: -1px; right: -1px; width: 10px; height: 10px; background: #22c55e; border: 2px solid #fff; border-radius: 50%;"></span>
              ` : ""}
            </div>
            <div style="display: flex; flex-direction: column; min-width: 0;">
              <span style="font-weight: 700; font-size: 14.5px; color: #050505; display: inline-flex; align-items: center; gap: 4px;">
                ${escapeHtml(thread.sellerName)} 
                <i data-lucide="chevron-down" style="width: 12px; height: 12px; opacity: 0.6;"></i>
              </span>
              <span style="font-size: 11px; color: #65676b; display: block; font-weight: normal; margin-top: -1px;">
                ${escapeHtml(status.label)}
              </span>
            </div>
          </div>
          <div class="messenger-actions" style="display: flex; align-items: center; gap: 6px;">
            <button type="button" data-chat-action="voice" title="Gọi thoại" style="display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="phone" style="width: 15px; height: 15px;"></i></button>
            <button type="button" data-chat-action="video" title="Gọi video" style="display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="video" style="width: 15px; height: 15px;"></i></button>
            <button type="button" data-chat-action="minimize" data-chat-role="buyer" title="Ẩn/Hiện trò chuyện" style="display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="minus" style="width: 15px; height: 15px;"></i></button>
            <button type="button" data-close-chat title="Đóng" style="display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="x" style="width: 15px; height: 15px;"></i></button>
          </div>
        </header>
        <div class="messenger-security" style="background: #f0f2f5; font-size: 11.5px; text-align: center; color: #65676b; padding: 6px 12px;">
          Chat Buyer hỗ trợ tin nhắn, tệp, vị trí, ghi âm và nút gọi.
        </div>
        <div class="messenger-body">
          <div style="flex-grow: 1;"></div>
          ${thread.messages.map((message) => renderChatMessage(message, "buyer")).join("")}
        </div>
        ${state.buyer.emojiOpen ? renderEmojiPicker() : ""}
        <form class="messenger-compose" data-chat-send-form style="border-top: 1px solid #e4e6eb; background: #fff; padding: 8px 10px;">
          <div class="messenger-tools" aria-label="Công cụ gửi tin" style="display: flex; align-items: center; gap: 4px;">
            <button type="button" data-chat-file-trigger title="Gửi tệp" style="display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i></button>
            <button type="button" data-chat-image-trigger title="Gửi hình ảnh" style="display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="image" style="width: 16px; height: 16px;"></i></button>
            <button type="button" data-chat-action="location" title="Gửi vị trí" style="display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="map-pin" style="width: 16px; height: 16px;"></i></button>
            <button class="${state.buyer.recording ? "is-recording" : ""}" type="button" data-chat-action="record" title="Ghi âm" style="display: inline-flex; align-items: center; justify-content: center;">${recordLabel}</button>
          </div>
          <input class="visually-hidden" name="chatFile" type="file" multiple data-chat-file-input />
          <input class="visually-hidden" name="chatImage" type="file" accept="image/*" multiple data-chat-image-input />
          <label class="messenger-input" style="position: relative; display: flex; align-items: center; flex: 1;">
            <input name="message" autocomplete="off" placeholder="Aa" style="width: 100%; min-height: 36px; border: 0; border-radius: 18px; padding: 0 36px 0 12px; background: #f0f2f5; font-size: 14px; color: #050505;" />
            <button type="button" data-chat-action="emoji" title="Gửi emoji" style="position: absolute; right: 4px; top: 4px; width: 28px; height: 28px; background: transparent; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--chat-accent, #0084ff);"><i data-lucide="smile" style="width: 18px; height: 18px;"></i></button>
          </label>
          <button class="messenger-send" type="submit" title="Gửi" style="display: inline-flex; align-items: center; justify-content: center;">
            <i data-lucide="thumbs-up" style="width: 16px; height: 16px;"></i>
          </button>
        </form>
      </section>
    </div>
  `;
}

function initSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  if (!state.user || state.user.isDemo || !state.apiOnline) {
    return;
  }

  const socketUrl = API_BASE.endsWith("/api") ? API_BASE.slice(0, -4) : API_BASE;
  try {
    socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Socket.IO connected to backend, user room:", state.user.id || state.user._id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    socket.on("incoming_call", async (data) => {
      const accept = confirm(`${data.callerName} đang gọi cho bạn. Nhận cuộc gọi?`);
      if (accept) {
        state.activeCall = {
          open: true,
          peerName: data.callerName,
          peerId: data.from,
          isVideo: data.offer.sdp && data.offer.sdp.includes("m=video"),
          localStream: null,
          remoteStream: null,
          pc: null,
          pcLocal: null,
          pcRemote: null,
        };
        render();
        await acceptWebRTCCall(data.from, data.offer);
      } else {
        socket.emit("end_call", { to: data.from });
      }
    });

    socket.on("call_accepted", async (data) => {
      if (peerConnection && data.answer) {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (err) {
          console.error("Error setting remote description inside call_accepted:", err);
        }
      }
    });

    socket.on("ice_candidate", async (data) => {
      if (peerConnection && data.candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error("Error adding ice candidate:", err);
        }
      }
    });

    socket.on("call_ended", () => {
      showToast("Cuộc gọi đã kết thúc từ phía bên kia.", "info");
      cleanupWebRTCCall();
    });

    socket.on("error", (data) => {
      showToast(data.message || "Lỗi socket.", "warn");
    });

  } catch (err) {
    console.error("Failed to initialize Socket.IO client:", err);
  }
}

function renderVideoCallModal() {
  const call = state.activeCall;
  if (!call || !call.open) return "";

  const title = call.isVideo ? "Cuộc gọi video WebRTC" : "Cuộc gọi thoại WebRTC";
  const initials = call.peerName ? call.peerName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "📞";

  const mainContent = call.isVideo
    ? `
      <!-- Remote Video (Big Screen) -->
      <video id="webrtc-remote-video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover; background: #111;"></video>
      
      <!-- Local Video (PiP) -->
      <video id="webrtc-local-video" autoplay playsinline muted style="position: absolute; bottom: 16px; right: 16px; width: 130px; aspect-ratio: 4/3; object-fit: cover; border-radius: 6px; border: 2px solid #fff; background: #222; box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index: 10;"></video>
    `
    : `
      <!-- Voice Call Avatar (Initials) -->
      <div id="webrtc-voice-avatar-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; min-height: 250px; background: radial-gradient(circle, #1a3c54 0%, #0b1c26 100%); width: 100%;">
        <div style="width: 110px; height: 110px; border-radius: 50%; background: linear-gradient(135deg, var(--teal) 0%, #0d9488 100%); display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: bold; color: #fff; box-shadow: 0 0 15px rgba(20, 184, 166, 0.4); margin-bottom: 16px; animation: pulse-webrtc 2s infinite ease-in-out;">
          ${escapeHtml(initials)}
        </div>
        <div style="font-size: 14px; color: rgba(255,255,255,0.7); animation: blink-webrtc 1.5s infinite;">Đang thoại...</div>
      </div>
      <!-- Hidden Elements for WebRTC tracks -->
      <audio id="webrtc-remote-audio" autoplay></audio>
      <video id="webrtc-local-video" autoplay playsinline muted style="display: none;"></video>
      <video id="webrtc-remote-video" autoplay playsinline style="display: none;"></video>
    `;

  return `
    <div class="modal-layer" style="z-index: 100;" role="dialog" aria-modal="true">
      <div class="modal-panel" style="width: min(600px, 100%); padding: 0; background: #0f2533; color: #fff; overflow: hidden; border-radius: 12px; box-shadow: var(--shadow);">
        <div style="padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <strong style="font-size: 16px;">${title}</strong>
          <span style="font-size: 13px; color: var(--teal); font-weight: bold;">Kết nối trực tiếp Peer-to-Peer</span>
        </div>
        <div style="position: relative; aspect-ratio: 4/3; background: #0b1c26; display: flex; align-items: center; justify-content: center;">
          ${mainContent}
          
          <div id="webrtc-loading" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(15, 37, 51, 0.9); z-index: 5;">
            <div style="font-size: 48px; margin-bottom: 16px;">📞</div>
            <strong style="font-size: 18px; margin-bottom: 8px;">Đang gọi cho ${escapeHtml(call.peerName)}</strong>
            <span style="font-size: 13px; color: rgba(255,255,255,0.6);">Đang thiết lập kết nối WebRTC...</span>
          </div>
        </div>
        <div style="padding: 16px; display: flex; justify-content: center; background: rgba(0,0,0,0.3);">
          <button id="webrtc-hangup" class="ghost-button" style="background: #ef4444; color: #fff; border: none; padding: 10px 24px; border-radius: 999px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px;">
            <span>❌</span>
            <span>Kết thúc cuộc gọi</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

async function startWebRTCCall(peerName, isVideo = true, peerId = null) {
  state.activeCall = {
    open: true,
    peerName: peerName,
    peerId: peerId,
    isVideo: isVideo,
    localStream: null,
    remoteStream: null,
    pc: null,
    pcLocal: null,
    pcRemote: null,
  };
  render();

  try {
    const constraints = { video: isVideo, audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    state.activeCall.localStream = stream;

    const localVideo = document.getElementById("webrtc-local-video");
    if (localVideo) {
      localVideo.srcObject = stream;
      if (isVideo) localVideo.style.display = "block";
    }

    if (socket && peerId && state.apiOnline && !state.user?.isDemo) {
      console.log(`Starting real WebRTC call to user_${peerId}`);
      peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
      state.activeCall.pc = peerConnection;

      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      peerConnection.ontrack = (event) => {
        console.log("Remote track received online");
        const remoteVideo = document.getElementById("webrtc-remote-video");
        const remoteAudio = document.getElementById("webrtc-remote-audio");
        if (isVideo) {
          if (remoteVideo) {
            remoteVideo.srcObject = event.streams[0];
            remoteVideo.style.display = "block";
          }
        } else {
          if (remoteAudio) {
            remoteAudio.srcObject = event.streams[0];
          }
        }
        const loadingEl = document.getElementById("webrtc-loading");
        if (loadingEl) loadingEl.style.display = "none";
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("ice_candidate", { to: peerId, candidate: event.candidate });
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit("call_user", {
        to: peerId,
        offer,
        callerName: state.user?.name || "Một người dùng",
      });

    } else {
      console.log("Starting local loopback call for demo mode");
      const pcLocal = new RTCPeerConnection();
      const pcRemote = new RTCPeerConnection();

      state.activeCall.pcLocal = pcLocal;
      state.activeCall.pcRemote = pcRemote;

      stream.getTracks().forEach((track) => pcLocal.addTrack(track, stream));

      pcRemote.ontrack = (event) => {
        const remoteVideo = document.getElementById("webrtc-remote-video");
        const remoteAudio = document.getElementById("webrtc-remote-audio");
        if (isVideo) {
          if (remoteVideo) {
            remoteVideo.srcObject = event.streams[0];
            remoteVideo.style.display = "block";
          }
        } else {
          if (remoteAudio) {
            remoteAudio.srcObject = event.streams[0];
          }
        }
        const loadingEl = document.getElementById("webrtc-loading");
        if (loadingEl) loadingEl.style.display = "none";
      };

      pcLocal.onicecandidate = (event) => {
        if (event.candidate) {
          pcRemote.addIceCandidate(event.candidate).catch(console.error);
        }
      };
      pcRemote.onicecandidate = (event) => {
        if (event.candidate) {
          pcLocal.addIceCandidate(event.candidate).catch(console.error);
        }
      };

      const offer = await pcLocal.createOffer();
      await pcLocal.setLocalDescription(offer);
      await pcRemote.setRemoteDescription(offer);

      const answer = await pcRemote.createAnswer();
      await pcRemote.setLocalDescription(answer);
      await pcLocal.setRemoteDescription(answer);
    }

  } catch (error) {
    showToast("Không khởi tạo được WebRTC (kiểm tra quyền Camera/Micro): " + error.message, "warn");
    endWebRTCCall();
  }
}

async function acceptWebRTCCall(callerId, offer) {
  try {
    const isVideo = state.activeCall.isVideo;
    const constraints = { video: isVideo, audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    state.activeCall.localStream = stream;

    const localVideo = document.getElementById("webrtc-local-video");
    if (localVideo) {
      localVideo.srcObject = stream;
      if (isVideo) localVideo.style.display = "block";
    }

    peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });
    state.activeCall.pc = peerConnection;

    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    peerConnection.ontrack = (event) => {
      console.log("Remote track received on answer side");
      const remoteVideo = document.getElementById("webrtc-remote-video");
      const remoteAudio = document.getElementById("webrtc-remote-audio");
      if (isVideo) {
        if (remoteVideo) {
          remoteVideo.srcObject = event.streams[0];
          remoteVideo.style.display = "block";
        }
      } else {
        if (remoteAudio) {
          remoteAudio.srcObject = event.streams[0];
        }
      }
      const loadingEl = document.getElementById("webrtc-loading");
      if (loadingEl) loadingEl.style.display = "none";
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice_candidate", { to: callerId, candidate: event.candidate });
      }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("answer_call", { to: callerId, answer });

  } catch (error) {
    showToast("Không trả lời cuộc gọi WebRTC: " + error.message, "warn");
    endWebRTCCall();
  }
}

function endWebRTCCall() {
  const call = state.activeCall;
  if (!call) return;

  const targetId = call.peerId;
  if (socket && targetId && state.apiOnline && !state.user?.isDemo) {
    socket.emit("end_call", { to: targetId });
  }

  cleanupWebRTCCall();
}

function cleanupWebRTCCall() {
  const call = state.activeCall;
  if (!call) return;

  if (call.localStream) {
    call.localStream.getTracks().forEach((track) => track.stop());
  }
  if (call.pcLocal) call.pcLocal.close();
  if (call.pcRemote) call.pcRemote.close();
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  state.activeCall = {
    open: false,
    peerName: "",
    localStream: null,
    remoteStream: null,
    pcLocal: null,
    pcRemote: null,
    pc: null,
  };
  render();
}

function renderRecipeModal(recipe) {
  const currentUserId = state.user ? getId(state.user) : null;
  const likes = Array.isArray(recipe.likes) ? recipe.likes.length : Number(recipe.likeCount || 0);
  const liked = Array.isArray(recipe.likes) && currentUserId && recipe.likes.includes(currentUserId);
  
  const recipeDataMap = {
    "demo-recipe-1": {
      ingredients: ["Cua biển (1-2 con)", "Sả (5 nhánh)", "Gừng (1 củ)", "Ớt (1-2 quả)", "Chanh", "Gia vị (muối, tiêu, chanh)"],
      steps: [
        "Cua biển dùng bàn chải cọ sạch rêu bẩn dưới vòi nước, để ráo.",
        "Sả rửa sạch, đập dập cắt khúc ngắn. Gừng gọt vỏ thái sợi chỉ mỏng.",
        "Xếp sả đập dập và một phần gừng thái sợi vào đáy nồi/vỉ hấp cách thủy.",
        "Đặt cua lên trên sả gừng, rải phần gừng sợi còn lại lên mình cua.",
        "Hấp cách thủy ở lửa vừa trong khoảng 15 - 20 phút cho đến khi cua chín đỏ hoàn toàn.",
        "Gắp cua ra đĩa, dùng nóng chấm muối tiêu chanh hoặc muối ớt xanh."
      ]
    },
    "demo-recipe-2": {
      ingredients: ["Mực một nắng loại ngon (1 con)", "Nước cốt me chua (3 thìa súp)", "Tỏi băm (1 thìa)", "Ớt băm (1/2 thìa)", "Nước mắm, đường, dầu ăn, hạt tiêu"],
      steps: [
        "Mực một nắng rã đông (nếu có), rửa sạch, dùng khăn thấm khô nước.",
        "Dùng dao khía các đường chéo dạng vảy rồng trên thân mực rồi cắt miếng vuông vừa ăn.",
        "Pha nước sốt me: Hòa cốt me với 2 thìa đường, 1 thìa nước mắm, 1 thìa nước ấm và ớt băm.",
        "Đun nóng dầu ăn, cho mực vào chiên áp chảo hơi vàng hai mặt rồi vớt ra.",
        "Phi thơm tỏi băm trong chảo, đổ sốt me vào đun sôi lăn tăn.",
        "Cho mực đã áp chảo vào chảo sốt me, đảo đều tay ở lửa nhỏ cho nước me keo lại bám đều quanh mực thì tắt bếp."
      ]
    },
    "demo-recipe-3": {
      ingredients: ["Cá thu cắt lát (500g)", "Cà chua (2 quả)", "Dứa quả/khóm (1/4 quả)", "Măng chua (100g)", "Hành lá, thì là, rau ngổ", "Tỏi băm, hành tím", "Hạt nêm, nước mắm, ớt tươi"],
      steps: [
        "Cá thu rửa qua nước muối loãng, rửa sạch lại và để ráo nước.",
        "Ướp cá với chút hành tím băm, tiêu và hạt nêm trong 15 phút.",
        "Cà chua bổ múi cau, dứa cắt lát mỏng. Các loại rau thơm rửa sạch thái khúc.",
        "Phi thơm hành tỏi băm, cho cà chua và khóm vào xào chín mềm để tạo màu nước lẩu tự nhiên.",
        "Cho măng chua vào xào cùng 2 phút, đổ lượng nước vừa đủ ăn vào đun sôi.",
        "Nêm nếm gia vị chua cay vừa miệng. Khi nước sôi bùng lên, thả cá thu vào nấu chín kỹ.",
        "Khi chuẩn bị tắt bếp, thả hành lá, thì là và rau ngổ vào để tạo hương thơm đặc trưng."
      ]
    }
  };

  const currentDetails = recipeDataMap[recipe.id] || {
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : (typeof recipe.ingredients === "string" ? recipe.ingredients.split(",") : []),
    steps: Array.isArray(recipe.steps) ? recipe.steps : (typeof recipe.steps === "string" ? recipe.steps.split("\n") : [])
  };

  const diffMap = {
    easy: { text: "Dễ", color: "#15803d", bg: "#f0fdf4" },
    medium: { text: "Trung bình", color: "#a16207", bg: "#fefce8" },
    hard: { text: "Khó", color: "#b91c1c", bg: "#fef2f2" }
  };
  const diffKey = (recipe.difficulty || "medium").toLowerCase();
  const diff = diffMap[diffKey] || diffMap.medium;

  return `
    <div class="modal-layer" role="dialog" aria-modal="true" aria-label="Chi tiết công thức">
      <div class="modal-panel recipe-detail-modal" style="max-width: 600px; padding: 24px; border-radius: 12px; background: #fff;">
        <button class="icon-button close-button" type="button" data-close-modal aria-label="Đóng">×</button>
        <div style="display: grid; gap: 20px;">
          <div style="position: relative; width: 100%; aspect-ratio: 16/9; overflow: hidden; border-radius: 8px; background: #f0f9ff;">
            <img src="${escapeHtml(recipe.imageUrl || "./assets/seafood-market.png")}" alt="${escapeHtml(recipe.title)}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <div>
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
              <span class="pill" style="color: ${diff.color}; background: ${diff.bg}; font-weight: 900; border: 1px solid currentColor;">${diff.text}</span>
              <span style="color: var(--muted); font-size: 13px;">⏱ ${Number(recipe.cookingTime || 30)} phút · 👥 ${Number(recipe.servings || 2)} phần</span>
            </div>
            <h2 style="font-size: 22px; margin: 0 0 12px; color: var(--ink); font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
              <span>${escapeHtml(recipe.title || "Công thức hải sản")}</span>
              <button class="recipe-like-btn ${liked ? 'is-liked' : ''}" type="button" data-recipe-like="${escapeHtml(recipe.id)}" style="border: none; background: transparent; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: bold; color: ${liked ? 'var(--coral)' : 'var(--muted)'}; outline: none;">
                <span style="font-size: 20px;">${liked ? '❤️' : '🤍'}</span>
                <span style="font-size: 14px; color: var(--ink); font-weight: bold;">${likes} thích</span>
              </button>
            </h2>
            <p style="color: var(--muted); line-height: 1.6; margin: 0 0 20px; font-size: 14px;">${escapeHtml(recipe.description || "")}</p>
            
            <h4 style="margin: 0 0 10px; color: var(--ink); border-bottom: 2px solid var(--line); padding-bottom: 6px; font-weight: bold;">Nguyên liệu cần chuẩn bị</h4>
            <ul style="margin: 0 0 20px; padding-left: 20px; line-height: 1.6; font-size: 14px; color: var(--ink);">
              ${currentDetails.ingredients.map(ing => `<li>${escapeHtml(ing.trim())}</li>`).join("")}
            </ul>

            <h4 style="margin: 0 0 10px; color: var(--ink); border-bottom: 2px solid var(--line); padding-bottom: 6px; font-weight: bold;">Hướng dẫn chế biến</h4>
            <ol style="margin: 0; padding-left: 20px; line-height: 1.7; font-size: 14px; color: var(--ink);">
              ${currentDetails.steps.map(step => `<li>${escapeHtml(step.trim())}</li>`).join("")}
            </ol>
            ${
              userAudience() === "seller"
                ? `
                <div class="recipe-admin-actions" style="display: flex; gap: 10px; margin-top: 24px; border-top: 1px solid var(--line); padding-top: 16px;">
                  <button class="ghost-button" type="button" data-seller-edit-recipe="${escapeHtml(recipe.id)}" style="display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                    <span>Chỉnh sửa</span>
                  </button>
                  <button class="ghost-button danger" type="button" data-seller-delete-recipe="${escapeHtml(recipe.id)}" style="display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                    <span>Xóa</span>
                  </button>
                </div>
                `
                : `
                <div class="recipe-admin-actions" style="display: flex; gap: 10px; margin-top: 24px; border-top: 1px solid var(--line); padding-top: 16px;">
                  <button class="ghost-button danger" type="button" data-report-recipe="${escapeHtml(recipe.id)}" style="display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="flag" style="width: 14px; height: 14px;"></i>
                    <span>Báo cáo vi phạm</span>
                  </button>
                </div>
                `
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderChatMessage(message, mineFrom = "seller") {
  const ownSide = typeof mineFrom === "string" ? mineFrom : "seller";
  const mine = message.from === ownSide;
  
  if (mine) {
    return `
      <article class="chat-message is-mine" style="display: flex; flex-direction: column; align-items: flex-end; max-width: 85%; margin-left: auto; gap: 2px; margin-bottom: 6px;">
        <div class="chat-bubble" style="background: var(--chat-accent, #0084ff); color: #fff; border-radius: 18px; padding: 8px 12px; font-size: 14px; line-height: 1.4; word-break: break-word; display: flex; align-items: center; gap: 8px; min-width: 0;">
          ${renderChatMessageContent(message)}
        </div>
        <small style="color: var(--muted); font-size: 11px; margin-right: 4px;">${formatChatTime(message.createdAt)}</small>
      </article>
    `;
  } else {
    const thread = ownSide === "seller" ? sellerConversationById() : buyerConversationById();
    const peerName = ownSide === "seller" ? (thread?.buyerName || "Buyer") : (thread?.sellerName || "Seller");
    const avatarHtml = `<span class="avatar mini" style="width: 28px; height: 28px; font-size: 11px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #e4e6eb; color: #050505; font-weight: 700; margin-top: auto; margin-bottom: 2px; user-select: none;">${escapeHtml(initials(peerName))}</span>`;
    
    return `
      <article class="chat-message is-theirs" style="display: flex; gap: 8px; max-width: 85%; align-items: flex-end; margin-bottom: 6px; margin-right: auto;">
        ${avatarHtml}
        <div style="display: flex; flex-direction: column; gap: 2px; align-items: flex-start; min-width: 0;">
          <div class="chat-bubble" style="background: #e4e6eb; color: #050505; border-radius: 18px; padding: 8px 12px; font-size: 14px; line-height: 1.4; word-break: break-word; display: flex; align-items: center; gap: 8px; min-width: 0;">
            ${renderChatMessageContent(message)}
          </div>
          <small style="color: var(--muted); font-size: 11px; margin-left: 4px;">${formatChatTime(message.createdAt)}</small>
        </div>
      </article>
    `;
  }
}

function renderChatMessageContent(message) {
  if (message.type === "image") {
    return `<img class="chat-image" src="${escapeHtml(message.src)}" alt="${escapeHtml(message.fileName || "Ảnh đã gửi")}" style="cursor: pointer; transition: opacity 0.2s;" data-chat-image-click="${escapeHtml(message.src)}" title="Nhấn để phóng to ảnh" />`;
  }
  if (message.type === "file") {
    return `
      <span class="chat-file-icon" style="display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="file-text" style="width: 16px; height: 16px;"></i></span>
      <span>
        <strong>${escapeHtml(message.fileName || "Tệp đính kèm")}</strong>
        <small>${escapeHtml(message.fileSize || "")}</small>
      </span>
    `;
  }
  if (message.type === "location") {
    const lat = message.lat;
    const lng = message.lng;
    const mapUrl = (lat && lng) ? `https://www.google.com/maps?q=${lat},${lng}` : "#";
    return `
      <a href="${mapUrl}" target="_blank" class="chat-location-click-block" style="display: flex; align-items: center; gap: 10px; color: inherit; text-decoration: none; width: 100%; cursor: pointer;" title="Nhấn để xem chi tiết vị trí trên bản đồ">
        <span class="chat-location-map" style="display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.25); width: 28px; height: 28px; border-radius: 50%;"><i data-lucide="map-pin" style="width: 16px; height: 16px;"></i></span>
        <span style="display: flex; flex-direction: column; text-align: left;">
          <strong style="font-size: 14px; display: block;">Vị trí</strong>
          <small style="font-size: 11px; opacity: 0.95; display: block; text-decoration: underline;">Nhấn để xem chi tiết</small>
        </span>
      </a>
    `;
  }
  if (message.type === "audio") {
    if (message.audioUrl) {
      return `
        <div style="display: flex; flex-direction: column; gap: 6px; padding: 4px 0; min-width: 220px;">
          <div style="display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 13px;">
            <i data-lucide="mic" style="width: 14px; height: 14px;"></i>
            <span>Tin nhắn thoại (${escapeHtml(message.duration || "")})</span>
          </div>
          <audio controls src="${escapeHtml(message.audioUrl)}" style="width: 100%; height: 32px; border-radius: 4px;"></audio>
        </div>
      `;
    }
    return `
      <span class="chat-wave" aria-hidden="true" style="display: inline-flex; align-items: center; justify-content: center;"><i data-lucide="mic" style="width: 14px; height: 14px;"></i></span>
      <span>
        <strong>Ghi âm</strong>
        <small>${escapeHtml(message.duration || "00:08")}</small>
      </span>
    `;
  }
  return `<span>${escapeHtml(message.text || "")}</span>`;
}

function renderEmojiPicker() {
  const emojis = ["👍", "❤️", "😂", "😮", "🙏", "🦀", "🦐", "🐟"];
  return `
    <div class="emoji-picker" aria-label="Chọn emoji">
      ${emojis.map((emoji) => `<button type="button" data-chat-emoji="${escapeHtml(emoji)}">${emoji}</button>`).join("")}
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
          <button class="ghost-button" type="button" data-refresh-admin style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i>
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
          <button class="primary-button" type="submit" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="search" style="width: 14px; height: 14px;"></i>
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
          <button class="ghost-button" type="button" data-refresh-admin style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i>
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
  const premium = Number(user.isPremium) === 1 || user.isPremium === true;
  return `
    <article class="admin-row">
      <div>
        <strong style="display: flex; align-items: center; gap: 4px;">
          ${escapeHtml(user.name || "Người dùng")}
          ${verified ? `
            <span class="custom-tooltip">
              <svg viewBox="0 0 24 24" width="16" height="16" style="fill: #1877f2; display: inline-block; flex-shrink: 0; cursor: help;">
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.936.1-1.354.277C14.777 2.548 13.5 1.7 12 1.7s-2.777.848-3.418 2.087c-.418-.178-.874-.277-1.354-.277-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .936-.1 1.354-.277.64 1.24 1.917 2.087 3.418 2.087s2.777-.848 3.418-2.087c.418.178.874.277 1.354.277 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.8 3.8l-3.3-3.3 1.4-1.4 1.9 1.9 5.3-5.3 1.4 1.4-6.7 6.7z"/>
              </svg>
              <span class="tooltip-text">Đã xác minh</span>
            </span>
          ` : ""}
          ${premium ? `
            <span class="custom-tooltip">
              <svg viewBox="0 0 24 24" width="16" height="16" style="fill: #eab308; display: inline-block; flex-shrink: 0; cursor: help; position: relative;">
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.936.1-1.354.277C14.777 2.548 13.5 1.7 12 1.7s-2.777.848-3.418 2.087c-.418-.178-.874-.277-1.354-.277-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .936-.1 1.354-.277.64 1.24 1.917 2.087 3.418 2.087s2.777-.848 3.418-2.087c.418.178.874.277 1.354.277 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.8 3.8l-3.3-3.3 1.4-1.4 1.9 1.9 5.3-5.3 1.4 1.4-6.7 6.7z"/>
                <text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" font-weight="900" fill="#fff">P</text>
              </svg>
              <span class="tooltip-text">Premium</span>
            </span>
          ` : ""}
        </strong>
        <span>${escapeHtml(user.email || "Chưa có email")}</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <span style="font-weight: 700; font-size: 13px; color: var(--ink);">${escapeHtml(user.role || "User")}</span>
        <span style="font-size: 11px; color: var(--sub-text); font-weight: 500;">${Number(user.postCount || 0)} bài</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-start; justify-content: center;">
        ${verified ? `
          <span style="color: #16a34a; font-weight: 700; background: #dcfce7; padding: 4px 8px; border-radius: 999px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px; border: 1px solid #bbf7d0; white-space: nowrap;">
            <svg viewBox="0 0 24 24" width="12" height="12" style="fill: currentColor; flex-shrink: 0;">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Đã xác minh
          </span>
        ` : `
          <span style="color: #4b5563; font-weight: 700; background: #f3f4f6; padding: 4px 8px; border-radius: 999px; font-size: 11px; display: inline-flex; align-items: center; border: 1px solid #e5e7eb; white-space: nowrap;">
            Chưa xác minh
          </span>
        `}
        ${active ? `
          <span style="color: #2563eb; font-weight: 700; background: #dbeafe; padding: 4px 8px; border-radius: 999px; font-size: 11px; display: inline-flex; align-items: center; border: 1px solid #bfdbfe; white-space: nowrap;">
            Đang hoạt động
          </span>
        ` : `
          <span style="color: #dc2626; font-weight: 700; background: #fee2e2; padding: 4px 8px; border-radius: 999px; font-size: 11px; display: inline-flex; align-items: center; border: 1px solid #fecaca; white-space: nowrap;">
            Đang khóa
          </span>
        `}
      </div>
      <div class="item-actions">
        <button class="ghost-button" type="button" data-admin-verify="${escapeHtml(id)}" style="display: flex; align-items: center; gap: 6px;">
          <i data-lucide="check" style="width: 14px; height: 14px;"></i>
          <span>${verified ? "Thu hồi" : "Duyệt"}</span>
        </button>
        <button class="ghost-button danger" type="button" data-admin-toggle-user="${escapeHtml(id)}" style="display: flex; align-items: center; gap: 6px;">
          ${active ? `<i data-lucide="shield-alert" style="width: 14px; height: 14px;"></i>` : `<i data-lucide="shield-check" style="width: 14px; height: 14px;"></i>`}
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
          <button class="primary-button" type="submit" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="filter" style="width: 14px; height: 14px;"></i>
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
        <button class="ghost-button danger" type="button" data-admin-delete-listing="${escapeHtml(id)}" style="display: flex; align-items: center; gap: 6px;">
          <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
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
          <button class="primary-button" type="submit" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="filter" style="width: 14px; height: 14px;"></i>
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
  const type = report.targetType || "Product";
  let typeLabel = "Mẻ hàng";
  let targetName = report.productName || "Mẻ hàng đã bị xoá";
  let sellerName = report.sellerName || "Ngư dân";

  if (type === "Post") {
    typeLabel = "Bài viết";
    targetName = report.postName || "Bài viết đã bị xoá";
    sellerName = report.postAuthorName || "Tác giả";
  } else if (type === "Recipe") {
    typeLabel = "Công thức";
    targetName = report.recipeName || "Công thức đã bị xoá";
    sellerName = report.sellerName || "Tác giả";
  }

  return `
    <article class="admin-row report-row">
      <div>
        <strong><span style="color: var(--coral); font-weight: bold;">[${typeLabel}]</span> ${escapeHtml(targetName)}</strong>
        <span>${escapeHtml(report.reason || "Không có lý do")}</span>
      </div>
      <span>${escapeHtml(report.reporterName || "Người báo cáo")}</span>
      <span>${escapeHtml(sellerName)}</span>
      <span>${escapeHtml(adminStatusLabels[report.status] || report.status || "Chờ xử lý")}</span>
      <span>${formatDate(report.createdAt)}</span>
      <div class="item-actions">
        <button class="ghost-button danger" type="button" data-admin-resolve-report="${escapeHtml(id)}" style="display: flex; align-items: center; gap: 6px;">
          <i data-lucide="alert-triangle" style="width: 14px; height: 14px;"></i>
          <span>Giải quyết</span>
        </button>
        <button class="ghost-button" type="button" data-admin-dismiss-report="${escapeHtml(id)}" style="display: flex; align-items: center; gap: 6px;">
          <i data-lucide="check" style="width: 14px; height: 14px;"></i>
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
          <button class="primary-button" type="submit" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="send" style="width: 14px; height: 14px;"></i>
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
  const currentUserId = state.user ? getId(state.user) : null;
  const tags = Array.isArray(post.tags) ? post.tags.slice(0, 4) : [];
  const likes = Array.isArray(post.likes) ? post.likes.length : Number(post.likeCount || 0);
  const liked = Array.isArray(post.likes) && currentUserId && post.likes.includes(currentUserId);
  const comments = Array.isArray(post.comments) ? post.comments.length : 0;
  const images = Array.isArray(post.images) ? post.images.filter(Boolean).slice(0, 3) : [];
  return `
    <article class="post-card" data-post="${escapeHtml(getId(post))}" style="cursor: pointer;">
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
        ${
          images.length
            ? `<div class="post-image-strip">${images
                .map((src) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(post.title || "Ảnh bài viết")}" />`)
                .join("")}</div>`
            : ""
        }
        <div class="tag-row">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
      <div class="post-actions" style="gap: 12px;">
        <button class="action-btn like-btn ${liked ? 'is-liked' : ''}" type="button" data-post-like="${escapeHtml(getId(post))}" style="border: none; background: transparent; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; color: ${liked ? 'var(--coral)' : 'var(--muted)'};">
          <span>${liked ? '❤️' : '🤍'}</span>
          <span>${likes} thích</span>
        </button>
        <button class="action-btn comment-btn" type="button" style="border: none; background: transparent; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--muted);">
          <span>💬</span>
          <span>${comments} bình luận</span>
        </button>
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
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
            <span class="type-badge ${product.type === "Fresh" ? "fresh" : "dried"}">${product.type === "Fresh" ? "Hải sản tươi" : "Hải sản khô"}</span>
            ${renderProductStatus(product.status)}
          </div>
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
            <button
              class="primary-button"
              type="button"
              data-buyer-open-chat="${escapeHtml(product.sellerId || "")}"
              data-seller-id="${escapeHtml(product.sellerId || "")}"
              data-seller-name="${escapeHtml(product.sellerName || "Seller")}"
              style="display: flex; align-items: center; justify-content: center; gap: 6px;"
            >
              <i data-lucide="phone" style="width: 14px; height: 14px;"></i>
              <span>Liên hệ</span>
            </button>
            <button class="ghost-button" type="button" data-favorite="${escapeHtml(getId(product))}" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
              ${favorite ? `<i data-lucide="heart" style="width: 14px; height: 14px; fill: var(--coral, #f43f5e); color: var(--coral, #f43f5e);"></i>` : `<i data-lucide="heart" style="width: 14px; height: 14px;"></i>`}
              <span>${favorite ? "Đã lưu" : "Lưu"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSellerModal(seller) {
  const userObj = seller.user || seller;
  const statsObj = seller.stats || {};
  
  const sellerId = String(userObj.id || userObj._id || seller.id || seller._id || "");
  const name = userObj.name || "Ngư dân";
  const isPremium = userObj.isPremium || false;
  const isVerified = userObj.isVerified || false;
  const bio = userObj.bio || userObj.description || seller.bio || seller.description || "Đang cập nhật hồ sơ.";
  
  const isFollowing = state.followingSellers.has(sellerId);
  const rating = (statsObj.avgRating !== undefined && statsObj.avgRating > 0) ? statsObj.avgRating : (seller.ratingAvg || seller.rating || 4.8);
  const productsCount = statsObj.activeProducts !== undefined ? statsObj.activeProducts : (seller.productsCount || seller.productCount || 0);
  const baseFollowers = statsObj.followersCount !== undefined ? statsObj.followersCount : (seller.followersCount || seller.followers || 0);
  const followersCount = isFollowing ? (baseFollowers + 1) : baseFollowers;

  return `
    <div class="modal-layer" role="dialog" aria-modal="true" aria-label="Hồ sơ người bán">
      <div class="modal-panel seller-modal" style="max-height: 90vh; overflow-y: auto; max-width: 650px; width: 95%;">
        <button class="icon-button close-button" type="button" data-close-modal aria-label="Đóng">×</button>
        <div class="seller-profile-head">
          <span class="avatar xl">${escapeHtml(initials(name))}</span>
          <div>
            <span class="eyebrow">${isPremium ? "Premium seller" : "Seller"}</span>
            <h2 style="display: flex; align-items: center; gap: 6px;">
              ${escapeHtml(name)}
              ${isVerified ? `
                <span class="custom-tooltip">
                  <svg viewBox="0 0 24 24" width="18" height="18" style="fill: #1877f2; display: inline-block; flex-shrink: 0; cursor: help;">
                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.936.1-1.354.277C14.777 2.548 13.5 1.7 12 1.7s-2.777.848-3.418 2.087c-.418-.178-.874-.277-1.354-.277-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .936-.1 1.354-.277.64 1.24 1.917 2.087 3.418 2.087s2.777-.848 3.418-2.087c.418.178.874.277 1.354.277 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.8 3.8l-3.3-3.3 1.4-1.4 1.9 1.9 5.3-5.3 1.4 1.4-6.7 6.7z"/>
                  </svg>
                  <span class="tooltip-text" style="font-size: 11px; padding: 4px 8px;">Đã xác minh</span>
                </span>
              ` : ""}
              ${isPremium ? `
                <span class="custom-tooltip">
                  <svg viewBox="0 0 24 24" width="18" height="18" style="fill: #eab308; display: inline-block; flex-shrink: 0; cursor: help; position: relative;">
                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.936.1-1.354.277C14.777 2.548 13.5 1.7 12 1.7s-2.777.848-3.418 2.087c-.418-.178-.874-.277-1.354-.277-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .936-.1 1.354-.277.64 1.24 1.917 2.087 3.418 2.087s2.777-.848 3.418-2.087c.418.178.874.277 1.354.277 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.8 3.8l-3.3-3.3 1.4-1.4 1.9 1.9 5.3-5.3 1.4 1.4-6.7 6.7z"/>
                    <text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" font-weight="900" fill="#fff">P</text>
                  </svg>
                  <span class="tooltip-text" style="font-size: 11px; padding: 4px 8px;">Premium</span>
                </span>
              ` : ""}
            </h2>
            <p>${escapeHtml(bio)}</p>
          </div>
        </div>
        <div class="seller-stats big">
          <span><strong>${Number(rating).toFixed(1)}</strong> sao</span>
          <span><strong>${productsCount}</strong> mẻ hàng</span>
          <span><strong>${followersCount}</strong> theo dõi</span>
        </div>
        <div class="modal-actions">
          <button class="primary-button" type="button" data-filter-seller="${escapeHtml(sellerId)}" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
            <i data-lucide="store" style="width: 14px; height: 14px;"></i>
            <span>Xem hàng</span>
          </button>
          <button
            class="ghost-button"
            type="button"
            data-buyer-open-chat="${escapeHtml(sellerId)}"
            data-seller-id="${escapeHtml(sellerId)}"
            data-seller-name="${escapeHtml(name)}"
            style="display: flex; align-items: center; justify-content: center; gap: 6px;"
          >
            <i data-lucide="message-square" style="width: 14px; height: 14px;"></i>
            <span>Chat</span>
          </button>
          <button
            class="ghost-button"
            type="button"
            data-toggle-follow="${escapeHtml(sellerId)}"
            style="display: flex; align-items: center; justify-content: center; gap: 6px; ${state.followingSellers.has(sellerId) ? "background: var(--teal); color: #fff; border-color: var(--teal);" : ""}"
          >
            ${state.followingSellers.has(sellerId) ? `<i data-lucide="check" style="width: 14px; height: 14px;"></i>` : `<i data-lucide="plus" style="width: 14px; height: 14px;"></i>`}
            <span>${state.followingSellers.has(sellerId) ? "Đang theo dõi" : "Theo dõi"}</span>
          </button>
        </div>
        
        <!-- REVIEWS BLOCK -->
        ${renderSellerReviewsBlock(sellerId, rating, followersCount)}
      </div>
    </div>
  `;
}

function renderSellerReviewsBlock(sellerId, rating, followersCount) {
  let reviews = state.sellerReviews.formatted || [];
  if (reviews.length === 0) {
    // Generate realistic Shopee-style mock reviews matching the user's screenshot
    reviews = [
      {
        ReviewID: "mock_rev_1",
        Rating: 5,
        Comment: "Bộ cốc dùng đc. Nói chung dùng cho gia đình OK. Giá và chất lượng tương đương",
        ImageURL: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150",
        CreatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        ReviewerName: "ducanh139",
        ProductName: "Hải sản tươi sống"
      },
      {
        ReviewID: "mock_rev_2",
        Rating: 5,
        Comment: "Sản phẩm dùng tốt nên mua shippo thân thiện\nCông dụng: hút gió\nMùi hương: chẳng có mùi j",
        ImageURL: null,
        CreatedAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
        ReviewerName: "e5ww44mzd9",
        ProductName: "Cá mú đỏ tự nhiên"
      },
      {
        ReviewID: "mock_rev_3",
        Rating: 4,
        Comment: "Hải sản Cần Giờ đóng thùng xốp nhiều đá rất tươi ngon. Giao hàng nhanh và tư vấn nhiệt tình.",
        ImageURL: null,
        CreatedAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
        ReviewerName: "hoang_huy_vungtau",
        ProductName: "Tôm he biển tươi"
      }
    ];
  }
  
  // Counts by star
  const countAll = reviews.length;
  const count5 = reviews.filter(r => r.Rating === 5).length;
  const count4 = reviews.filter(r => r.Rating === 4).length;
  const count3 = reviews.filter(r => r.Rating === 3).length;
  const count2 = reviews.filter(r => r.Rating === 2).length;
  const count1 = reviews.filter(r => r.Rating === 1).length;
  
  // Filter reviews
  let filteredReviews = reviews;
  const filter = state.reviewFilter || "all";
  if (filter !== "all") {
    filteredReviews = reviews.filter(r => r.Rating === Number(filter));
  }
  
  // Generate filter tabs
  const tabActive = (t) => filter === t ? "active" : "";
  const tabsHtml = `
    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
      <button class="review-filter-btn ${tabActive("all")}" type="button" data-review-filter="all">Tất Cả (${countAll})</button>
      <button class="review-filter-btn ${tabActive("5")}" type="button" data-review-filter="5">5 Sao (${count5})</button>
      <button class="review-filter-btn ${tabActive("4")}" type="button" data-review-filter="4">4 Sao (${count4})</button>
      <button class="review-filter-btn ${tabActive("3")}" type="button" data-review-filter="3">3 Sao (${count3})</button>
      <button class="review-filter-btn ${tabActive("2")}" type="button" data-review-filter="2">2 Sao (${count2})</button>
      <button class="review-filter-btn ${tabActive("1")}" type="button" data-review-filter="1">1 Sao (${count1})</button>
    </div>
  `;
  
  // Stars icons for overall rating
  let overallStarsHtml = "";
  const roundedRating = Math.round(rating);
  for (let i = 1; i <= 5; i++) {
    const color = i <= roundedRating ? "#ee4d2d" : "#cbd5e1";
    overallStarsHtml += `<i data-lucide="star" style="width: 20px; height: 20px; fill: ${color}; color: ${color}; margin-right: 4px;"></i>`;
  }
  
  // Write a Review form (only if logged in)
  let writeFormHtml = "";
  if (state.user) {
    const draftRating = state.draftReviewRating || 5;
    let draftStarsHtml = "";
    for (let i = 1; i <= 5; i++) {
      const color = i <= draftRating ? "#ee4d2d" : "#cbd5e1";
      draftStarsHtml += `
        <span data-draft-star="${i}" style="cursor: pointer; padding: 2px;">
          <i data-lucide="star" style="width: 24px; height: 24px; fill: ${color}; color: ${color};"></i>
        </span>
      `;
    }
    
    writeFormHtml = `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #0f172a;">Viết đánh giá của bạn</h4>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <span style="font-size: 13px; color: #475569;">Chọn số sao:</span>
          <div style="display: flex;">${draftStarsHtml}</div>
        </div>
        <textarea
          data-review-comment
          placeholder="Hãy chia sẻ nhận xét của bạn về ngư dân này (ví dụ: hải sản tươi, thái độ phục vụ tốt...)"
          style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; outline: none; resize: vertical; margin-bottom: 12px;"
        ></textarea>
        <button class="primary-button" type="button" data-submit-review="${escapeHtml(sellerId)}" style="padding: 8px 16px; font-size: 13px; min-height: auto; width: auto; background: #ee4d2d; border-color: #ee4d2d;">Gửi đánh giá</button>
      </div>
    `;
  } else {
    writeFormHtml = `
      <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center; font-size: 13px; color: #64748b;">
        Bạn phải đăng nhập để viết đánh giá cho ngư dân này.
      </div>
    `;
  }
  
  // Reviews List
  let reviewsListHtml = "";
  if (filteredReviews.length === 0) {
    reviewsListHtml = `
      <div style="padding: 40px 20px; text-align: center; color: #64748b; font-size: 14px; background: #f8fafc; border-radius: 8px;">
        Chưa có đánh giá nào cho bộ lọc này.
      </div>
    `;
  } else {
    reviewsListHtml = filteredReviews.map(r => {
      let rStarsHtml = "";
      for (let i = 1; i <= 5; i++) {
        const color = i <= r.Rating ? "#ee4d2d" : "#cbd5e1";
        rStarsHtml += `<i data-lucide="star" style="width: 14px; height: 14px; fill: ${color}; color: ${color}; margin-right: 2px;"></i>`;
      }
      
      const timeStr = r.CreatedAt ? new Date(r.CreatedAt).toLocaleDateString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }) : "Vừa xong";
      
      return `
        <div style="padding: 16px 0; border-bottom: 1px solid #f1f5f9; display: flex; gap: 12px; align-items: flex-start;">
          <span class="avatar" style="width: 36px; height: 36px; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #f0f2f5; color: #050505; font-weight: bold; flex-shrink: 0;">
            ${escapeHtml(initials(r.ReviewerName))}
          </span>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${escapeHtml(r.ReviewerName)}</div>
            <div style="display: flex; align-items: center; margin-bottom: 4px;">${rStarsHtml}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
              ${escapeHtml(timeStr)} | Phân loại hàng: ${escapeHtml(r.ProductName || "Sản phẩm")}
            </div>
            <p style="font-size: 13px; color: #334155; margin: 0 0 12px 0; line-height: 1.5; white-space: pre-line;">${escapeHtml(r.Comment || "Người mua không để lại bình luận.")}</p>
            
            ${r.ImageURL ? `
              <div style="margin-bottom: 12px;">
                <img src="${escapeHtml(r.ImageURL)}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 1px solid #e2e8f0;" data-chat-image-click="${escapeHtml(r.ImageURL)}" />
              </div>
            ` : ""}
            
            <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b;">
              ${(() => {
                const isLiked = state.likedReviews && state.likedReviews.has(r.ReviewID);
                const likeText = isLiked ? "Đã thích" : "Hữu ích?";
                const likeColor = isLiked ? "#ee4d2d" : "inherit";
                return `
                  <button type="button" class="ghost-button" data-like-review="${escapeHtml(r.ReviewID || "")}" style="padding: 4px 8px; min-height: auto; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; color: ${likeColor};">
                    <i data-lucide="thumbs-up" style="width: 12px; height: 12px; ${isLiked ? "fill: #ee4d2d;" : ""}"></i>
                    <span>${likeText}</span>
                  </button>
                `;
              })()}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }
  
  return `
    <div class="seller-reviews-section" style="margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 24px; text-align: left;">
      <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">ĐÁNH GIÁ SẢN PHẨM & NGƯ DÂN</h3>
      
      <!-- Overview rating -->
      <div style="display: flex; gap: 24px; background: #fffbfb; border: 1px solid #fce8e6; border-radius: 8px; padding: 20px; margin-bottom: 24px; align-items: center;">
        <div style="text-align: center; min-width: 100px;">
          <div style="font-size: 32px; font-weight: 800; color: #ee4d2d; line-height: 1;">${Number(rating).toFixed(1)}</div>
          <div style="font-size: 13px; color: #ee4d2d; margin-top: 4px; font-weight: 500;">trên 5</div>
          <div style="display: flex; justify-content: center; margin-top: 6px;">${overallStarsHtml}</div>
        </div>
        <div style="flex: 1;">
          ${tabsHtml}
        </div>
      </div>
      
      <!-- Write Form -->
      ${writeFormHtml}
      
      <!-- List -->
      <div style="padding-right: 4px;">
        ${reviewsListHtml}
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

  document.querySelector("[data-following-only]")?.addEventListener("change", (event) => {
    state.filters.followingOnly = event.target.checked;
    render();
  });

  document.querySelectorAll("[data-toggle-follow]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!state.user) {
        requireLogin("Bạn phải đăng nhập để trò chuyện, theo dõi và lưu sản phẩm");
        return;
      }
      const id = button.dataset.toggleFollow;
      if (!id) return;

      if (state.followingSellers.has(id)) {
        state.followingSellers.delete(id);
        showToast("Đã bỏ theo dõi ngư dân.");
      } else {
        state.followingSellers.add(id);
        showToast("Đã theo dõi ngư dân.");
      }
      saveFollowingSellers();
      render();
    });
  });

  document.querySelector("[data-refresh]")?.addEventListener("click", () => loadData());

  document.querySelectorAll("[data-refresh-seller]").forEach((button) => {
    button.addEventListener("click", () => loadSellerData());
  });

  document.querySelectorAll("[data-refresh-admin]").forEach((button) => {
    button.addEventListener("click", () => loadAdminData());
  });

  document.querySelectorAll("[data-image-preview]").forEach((input) => {
    input.addEventListener("change", () => updateImageUploadPreview(input));
  });

  document.querySelector("[data-toggle-notifications]")?.addEventListener("click", () => {
    state.notifications.open = !state.notifications.open;
    render();
  });

  document.querySelectorAll("[data-notification-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.notificationAction;
      const threadId = button.dataset.threadId;
      state.notifications.open = false;

      if (action === "seller-chat" && threadId) {
        state.buyer.activeThreadId = null;
        state.seller.activeThreadId = threadId;
        state.seller.tab = "messages";
        state.activeSection = "seller";
        state.seller.emojiOpen = false;
        state.seller.recording = false;
        state.seller.conversations = ensureSellerConversations().map((thread) =>
          thread.id === threadId ? { ...thread, unread: 0 } : thread,
        );
        render();
        return;
      }

      if (action === "buyer-chat" && threadId) {
        const thread = buyerConversationById(threadId);
        if (!thread) return;
        state.seller.activeThreadId = null;
        state.buyer.activeThreadId = thread.id;
        state.buyer.emojiOpen = false;
        state.buyer.recording = false;
        state.buyer.conversations = ensureBuyerConversations().map((item) =>
          item.id === thread.id ? { ...item, unread: 0 } : item,
        );
        render();
        return;
      }

      if (action === "admin-reports") {
        state.admin.tab = "reports";
        state.activeSection = "admin";
        render();
        return;
      }

      if (action === "admin-broadcasts") {
        state.admin.tab = "broadcasts";
        state.activeSection = "admin";
        render();
      }
    });
  });

  document.querySelectorAll("[data-buyer-open-chat]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.user) {
        requireLogin("Bạn phải đăng nhập để trò chuyện, theo dõi và lưu sản phẩm");
        return;
      }
      const requested = button.dataset.buyerOpenChat || "";
      const sellerId = button.dataset.sellerId || requested;
      const sellerName = button.dataset.sellerName || "Seller";
      const thread = buyerConversationById(requested) || ensureBuyerConversationForSeller(sellerId, sellerName);
      state.seller.activeThreadId = null;
      state.buyer.activeThreadId = thread.id;
      state.buyer.emojiOpen = false;
      state.buyer.recording = false;
      state.notifications.open = false;
      state.selectedProduct = null;
      state.selectedSeller = null;
      state.buyer.conversations = ensureBuyerConversations().map((item) =>
        item.id === thread.id ? { ...item, unread: 0 } : item,
      );
      render();
    });
  });

  document.querySelectorAll("[data-open-chat]").forEach((button) => {
    button.addEventListener("click", () => {
      const threadId = button.dataset.openChat;
      if (!threadId) return;
      state.buyer.activeThreadId = null;
      state.seller.activeThreadId = threadId;
      state.seller.emojiOpen = false;
      state.seller.recording = false;
      state.notifications.open = false;
      state.seller.conversations = ensureSellerConversations().map((thread) =>
        thread.id === threadId ? { ...thread, unread: 0 } : thread,
      );
      render();
    });
  });

  document.querySelectorAll("[data-close-chat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.seller.activeThreadId = null;
      state.seller.emojiOpen = false;
      state.seller.recording = false;
      state.buyer.activeThreadId = null;
      state.buyer.emojiOpen = false;
      state.buyer.recording = false;
      render();
    });
  });

  document.querySelectorAll("[data-chat-header-toggle]").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest('.messenger-actions')) return;
      const role = el.dataset.chatHeaderToggle;
      const chatState = role === "buyer" ? state.buyer : state.seller;
      const threadId = chatState.activeThreadId;
      if (threadId) {
        chatState.minimizedThreads.add(threadId);
        render();
      }
    });
  });

  document.querySelectorAll("[data-chat-action='minimize']").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const role = btn.dataset.chatRole;
      const chatState = role === "buyer" ? state.buyer : state.seller;
      const threadId = chatState.activeThreadId;
      if (threadId) {
        chatState.minimizedThreads.add(threadId);
        render();
      }
    });
  });

  document.querySelectorAll("[data-restore-chat]").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest('[data-close-chat-head]')) return;
      const role = el.dataset.restoreChat;
      const threadId = el.dataset.threadId;
      const chatState = role === "buyer" ? state.buyer : state.seller;
      chatState.activeThreadId = threadId;
      chatState.minimizedThreads.delete(threadId);
      render();
    });
  });

  document.querySelectorAll("[data-close-chat-head]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const role = btn.dataset.closeChatHead;
      const threadId = btn.dataset.threadId;
      const chatState = role === "buyer" ? state.buyer : state.seller;
      chatState.minimizedThreads.delete(threadId);
      if (chatState.activeThreadId === threadId) {
        chatState.activeThreadId = null;
      }
      render();
    });
  });



  document.querySelector("[data-chat-send-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const messageInput = form.message;
    const message = String(messageInput.value || "").trim();
    const scope = activeChatScope();
    const chatState = scope === "buyer" ? state.buyer : state.seller;
    if (!scope || !chatState.activeThreadId) return;
    const textToSend = message === "" ? "👍" : message;
    addScopedChatMessage(scope, chatState.activeThreadId, { type: "text", text: textToSend });
    chatState.emojiOpen = false;
    form.reset();
    render();
  });

  const chatForm = document.querySelector("[data-chat-send-form]");
  if (chatForm) {
    const inputEl = chatForm.querySelector('input[name="message"]');
    const sendBtn = chatForm.querySelector('.messenger-send');
    if (inputEl && sendBtn) {
      if (inputEl.value.trim() === '') {
        sendBtn.innerHTML = '<i data-lucide="thumbs-up" style="width: 16px; height: 16px;"></i>';
      } else {
        sendBtn.innerHTML = '<i data-lucide="send" style="width: 16px; height: 16px;"></i>';
      }
      if (window.lucide) window.lucide.createIcons();

      inputEl.addEventListener('input', () => {
        if (inputEl.value.trim() === '') {
          sendBtn.innerHTML = '<i data-lucide="thumbs-up" style="width: 16px; height: 16px;"></i>';
        } else {
          sendBtn.innerHTML = '<i data-lucide="send" style="width: 16px; height: 16px;"></i>';
        }
        if (window.lucide) window.lucide.createIcons();
      });
    }
  }

  document.querySelector("[data-chat-file-trigger]")?.addEventListener("click", () => {
    document.querySelector("[data-chat-file-input]")?.click();
  });

  document.querySelector("[data-chat-image-trigger]")?.addEventListener("click", () => {
    document.querySelector("[data-chat-image-input]")?.click();
  });

  document.querySelector("[data-chat-file-input]")?.addEventListener("change", (event) => {
    addChatFileAttachments(event.currentTarget);
  });

  document.querySelector("[data-chat-image-input]")?.addEventListener("change", (event) => {
    addChatImageAttachments(event.currentTarget);
  });

  document.querySelectorAll("[data-chat-emoji]").forEach((button) => {
    button.addEventListener("click", () => {
      const scope = activeChatScope();
      const chatState = scope === "buyer" ? state.buyer : state.seller;
      if (!scope || !chatState.activeThreadId) return;
      addScopedChatMessage(scope, chatState.activeThreadId, {
        type: "text",
        text: button.dataset.chatEmoji || "👍",
      });
      chatState.emojiOpen = false;
      render();
    });
  });

  document.querySelectorAll("[data-chat-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.chatAction;
      const scope = activeChatScope();
      const chatState = scope === "buyer" ? state.buyer : state.seller;
      const threadId = chatState.activeThreadId;
      if (!scope || !threadId) return;

      if (action === "emoji") {
        chatState.emojiOpen = !chatState.emojiOpen;
        render();
        return;
      }

      if (action === "location") {
        if (!navigator.geolocation) {
          showToast("Trình duyệt không hỗ trợ định vị vị trí.", "warn");
          return;
        }
        showToast("Đang lấy vị trí hiện tại...");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            addScopedChatMessage(scope, threadId, {
              type: "location",
              text: `Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              lat,
              lng,
            });
            chatState.emojiOpen = false;
            showToast("Đã gửi vị trí hiện tại.");
            render();
          },
          (error) => {
            showToast("Không lấy được vị trí: " + error.message, "warn");
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
        return;
      }

      if (action === "record") {
        if (!chatState.recording) {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast("Trình duyệt không hỗ trợ ghi âm.", "warn");
            return;
          }
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
              chatState.recording = true;
              chatState.recordSeconds = 0;
              audioChunks = [];
              
              mediaRecorder = new MediaRecorder(stream);
              mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                  audioChunks.push(e.data);
                }
              };
              
              mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunks, { type: "audio/ogg; codecs=opus" });
                const audioUrl = URL.createObjectURL(blob);
                
                const secs = chatState.recordSeconds || 0;
                const mm = String(Math.floor(secs / 60)).padStart(2, '0');
                const ss = String(secs % 60).padStart(2, '0');
                const durationStr = `${mm}:${ss}`;
                
                addScopedChatMessage(scope, threadId, {
                  type: "audio",
                  audioUrl: audioUrl,
                  duration: durationStr,
                });
                
                chatState.recordSeconds = 0;
                render();
                showToast("Đã gửi ghi âm thoại.");
              };

              mediaRecorder.start();

              recordingInterval = setInterval(() => {
                chatState.recordSeconds = (chatState.recordSeconds || 0) + 1;
                render();
              }, 1000);

              chatState.emojiOpen = false;
              render();
              showToast("Đang ghi âm... Nhấn lại nút để dừng và gửi.");
            })
            .catch((err) => {
              showToast("Không truy cập được microphone: " + err.message, "warn");
            });
        } else {
          if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach((track) => track.stop());
          }
          if (recordingInterval) {
            clearInterval(recordingInterval);
            recordingInterval = null;
          }
          chatState.recording = false;
          render();
        }
        return;
      }

      if (action === "voice") {
        const thread = scope === "buyer" ? buyerConversationById(threadId) : sellerConversationById(threadId);
        const peerName = scope === "buyer" ? (thread?.sellerName || "Seller") : (thread?.buyerName || "Buyer");
        const peerId = scope === "buyer" ? thread?.sellerId : thread?.buyerId;
        startWebRTCCall(peerName, false, peerId);
        return;
      }

      if (action === "video") {
        const thread = scope === "buyer" ? buyerConversationById(threadId) : sellerConversationById(threadId);
        const peerName = scope === "buyer" ? (thread?.sellerName || "Seller") : (thread?.buyerName || "Buyer");
        const peerId = scope === "buyer" ? thread?.sellerId : thread?.buyerId;
        startWebRTCCall(peerName, true, peerId);
        return;
      }
    });
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

  document.querySelector("[data-seller-product-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const totalWeight = Number(formData.get("totalWeight") || 0);
    const isEditing = !!state.seller.editingProductId;

    let productImages = [];
    try {
      productImages = await readImageFiles(form.elements.namedItem("imageFile"), 1);
    } catch (error) {
      showToast(error.message || "Không đọc được ảnh sản phẩm.", "warn");
      return;
    }

    let imagesArray = productImages;
    if (isEditing && productImages.length === 0) {
      const oldProd = state.seller.products.find(p => getId(p) === state.seller.editingProductId);
      if (oldProd && oldProd.images) {
        imagesArray = oldProd.images;
      }
    }
    const coverImageData = imagesArray[0] || "";

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
      images: imagesArray,
    };

    if (isDemoSellerMode() || (isEditing && String(state.seller.editingProductId).startsWith("demo-"))) {
      if (isEditing) {
        state.seller.products = state.seller.products.map(p => 
          getId(p) === state.seller.editingProductId 
            ? { ...p, ...body, coverImg: coverImageData || p.coverImg } 
            : p
        );
        state.seller.editingProductId = null;
        showToast("Đã cập nhật mẻ hàng demo.");
      } else {
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
            coverImg: coverImageData || null,
            viewCount: 0,
            createdAt: new Date().toISOString(),
          },
          ...state.seller.products,
        ];
        showToast("Đã thêm mẻ hàng demo.");
      }
      form.reset();
      render();
      return;
    }

    try {
      if (isEditing) {
        await apiFetch(`/products/${state.seller.editingProductId}`, { method: "PUT", body, timeoutMs: 7000 });
        state.seller.editingProductId = null;
        showToast("Đã cập nhật mẻ hàng.");
      } else {
        await apiFetch("/products", { method: "POST", body, timeoutMs: 7000 });
        showToast("Đã đăng mẻ hàng mới.");
      }
      form.reset();
      loadSellerData();
    } catch (error) {
      showToast(error.message || (isEditing ? "Không cập nhật được sản phẩm." : "Không đăng được sản phẩm."), "warn");
    }
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

  document.querySelectorAll("[data-seller-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.sellerEdit;
      if (!id) return;
      state.seller.editingProductId = id;
      render();
      document.querySelector("[data-seller-product-form]")?.scrollIntoView({ behavior: "smooth" });
    });
  });

  document.querySelectorAll("[data-cancel-product-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      state.seller.editingProductId = null;
      render();
    });
  });

  document.querySelectorAll("[data-seller-toggle-status]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.sellerToggleStatus;
      if (!id) return;

      let product = state.seller.products.find((item) => getId(item) === id);
      if (!product) {
        product = state.data.products.find((item) => getId(item) === id);
      }
      if (!product) return;

      const newStatus = product.status === "Active" ? "Expired" : "Active";

      if (isDemoSellerMode() || id.startsWith("demo-")) {
        state.seller.products = state.seller.products.map((item) =>
          getId(item) === id ? { ...item, status: newStatus } : item,
        );
        state.data.products = state.data.products.map((item) =>
          getId(item) === id ? { ...item, status: newStatus } : item,
        );
        showToast("Đã cập nhật trạng thái mẻ hàng demo.");
        render();
        return;
      }

      try {
        await apiFetch(`/products/${id}`, {
          method: "PUT",
          body: { status: newStatus },
          timeoutMs: 7000,
        });
        showToast("Đã cập nhật trạng thái mẻ hàng.");
        loadSellerData();
      } catch (error) {
        showToast(error.message || "Không cập nhật được trạng thái.", "warn");
      }
    });
  });

  document.querySelector("[data-seller-recipe-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const recipeId = formData.get("recipeId");
    const isEditing = !!recipeId;

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

    if (isDemoSellerMode() || (isEditing && String(recipeId).startsWith("demo-"))) {
      if (isEditing) {
        const idx = state.seller.recipes.findIndex((r) => getId(r) === recipeId);
        if (idx !== -1) {
          state.seller.recipes[idx] = {
            ...state.seller.recipes[idx],
            ...body,
          };
        }
        const dataIdx = state.data.recipes.findIndex((r) => getId(r) === recipeId);
        if (dataIdx !== -1) {
          state.data.recipes[dataIdx] = {
            ...state.data.recipes[dataIdx],
            ...body,
          };
        }
        state.seller.editingRecipeId = null;
        showToast("Đã cập nhật công thức demo.");
      } else {
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
        showToast("Đã thêm công thức demo.");
      }
      form.reset();
      render();
      return;
    }

    try {
      if (isEditing) {
        await apiFetch(`/recipes/${recipeId}`, { method: "PUT", body, timeoutMs: 7000 });
        state.seller.editingRecipeId = null;
        showToast("Đã cập nhật công thức.");
      } else {
        await apiFetch("/recipes", { method: "POST", body, timeoutMs: 7000 });
        showToast("Đã đăng công thức.");
      }
      form.reset();
      loadSellerData();
    } catch (error) {
      showToast(error.message || (isEditing ? "Không cập nhật được công thức." : "Không đăng được công thức."), "warn");
    }
  });

  document.querySelector("[data-seller-post-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const postId = formData.get("postId");
    const isEditing = !!postId;

    let postImages = [];
    try {
      postImages = await readImageFiles(form.elements.namedItem("postImages"), 4);
    } catch (error) {
      showToast(error.message || "Không đọc được ảnh bài viết.", "warn");
      return;
    }

    const existingPost = isEditing
      ? (state.seller.posts.find(p => getId(p) === postId) || state.data.posts.find(p => getId(p) === postId))
      : null;

    const body = {
      title: String(formData.get("title") || "").trim(),
      content: String(formData.get("content") || "").trim(),
      images: postImages.length > 0 ? postImages : (existingPost ? existingPost.images : []),
      tags: splitTags(formData.get("tags")),
    };

    if (isDemoSellerMode() || (isEditing && String(postId).startsWith("demo-")) || !state.apiOnline) {
      if (isEditing) {
        const idx = state.seller.posts.findIndex((p) => getId(p) === postId);
        if (idx !== -1) {
          state.seller.posts[idx] = {
            ...state.seller.posts[idx],
            ...body,
          };
        }
        const dataIdx = state.data.posts.findIndex((p) => getId(p) === postId);
        if (dataIdx !== -1) {
          state.data.posts[dataIdx] = {
            ...state.data.posts[dataIdx],
            ...body,
          };
        }
        state.seller.editingPostId = null;
        showToast("Đã cập nhật bài viết demo.");
      } else {
        const authorProfile = state.user || { id: "demo-buyer-1", name: "Người dùng demo" };
        const demoPost = {
          ...body,
          id: `demo-post-${Date.now()}`,
          userId: authorProfile.id,
          userName: authorProfile.name,
          likes: [],
          comments: [],
          createdAt: new Date().toISOString(),
        };
        state.seller.posts = [demoPost, ...state.seller.posts];
        state.data.posts = [demoPost, ...state.data.posts];
        showToast("Đã thêm bài viết demo.");
      }
      form.reset();
      render();
      return;
    }

    try {
      if (isEditing) {
        await apiFetch(`/posts/${postId}`, { method: "PUT", body, timeoutMs: 7000 });
        state.seller.editingPostId = null;
        showToast("Đã cập nhật bài viết.");
      } else {
        await apiFetch("/posts", { method: "POST", body, timeoutMs: 7000 });
        showToast("Đã đăng bài viết.");
      }
      form.reset();
      if (userAudience() === "seller") {
        loadSellerData();
      } else {
        loadData();
      }
    } catch (error) {
      showToast(error.message || (isEditing ? "Không cập nhật được bài viết." : "Không đăng được bài viết."), "warn");
    }
  });

  document.querySelectorAll("[data-product]").forEach((card) => {
    card.addEventListener("click", async (event) => {
      if (
        event.target.closest("[data-favorite]") ||
        event.target.closest("[data-seller]") ||
        event.target.closest(".seller-link") ||
        event.target.closest("[data-seller-bump]") ||
        event.target.closest("[data-seller-delete]") ||
        event.target.closest("[data-seller-edit]") ||
        event.target.closest("[data-seller-toggle-status]")
      ) {
        return;
      }
      const productId = card.dataset.product;
      let product = state.data.products.find((item) => getId(item) === productId);
      if (!product && state.seller && state.seller.products) {
        product = state.seller.products.find((item) => getId(item) === productId);
      }
      if (!product) return;

      state.selectedProduct = product;
      render();
      if (String(getId(product)).startsWith("demo-")) return;
      try {
        state.selectedProduct = await apiFetch(`/products/${getId(product)}`);
        render();
      } catch {
        showToast("Không tải được chi tiết từ backend.", "warn");
      }
    });
  });

  document.querySelectorAll("[data-recipe]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.recipe;
      let recipe = state.data.recipes.find((item) => getId(item) === id);
      if (!recipe && state.seller && state.seller.recipes) {
        recipe = state.seller.recipes.find((item) => getId(item) === id);
      }
      if (recipe) {
        state.selectedRecipe = recipe;
        render();
      }
    });
  });

  document.querySelectorAll("[data-seller-delete-recipe]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.sellerDeleteRecipe;
      if (!id) return;
      if (!window.confirm("Bạn có chắc chắn muốn xóa công thức này?")) return;

      if (isDemoSellerMode() || id.startsWith("demo-")) {
        state.seller.recipes = state.seller.recipes.filter((item) => getId(item) !== id);
        state.data.recipes = state.data.recipes.filter((item) => getId(item) !== id);
        state.selectedRecipe = null;
        showToast("Đã xóa công thức demo.");
        render();
        return;
      }

      try {
        await apiFetch(`/recipes/${id}`, { method: "DELETE", timeoutMs: 7000 });
        state.selectedRecipe = null;
        showToast("Đã xóa công thức.");
        loadSellerData();
      } catch (error) {
        showToast(error.message || "Không xóa được công thức.", "warn");
      }
    });
  });

  document.querySelectorAll("[data-seller-edit-recipe]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.sellerEditRecipe;
      if (!id) return;
      state.seller.editingRecipeId = id;
      state.selectedRecipe = null;
      render();
      document.querySelector("[data-seller-recipe-form]")?.scrollIntoView({ behavior: "smooth" });
    });
  });

  document.querySelectorAll("[data-cancel-recipe-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.seller.editingRecipeId = null;
      render();
    });
  });

  document.querySelectorAll("[data-seller-delete-post]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.sellerDeletePost;
      if (!id) return;
      if (!window.confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) return;

      if (isDemoSellerMode() || id.startsWith("demo-") || !state.apiOnline) {
        state.seller.posts = state.seller.posts.filter((item) => getId(item) !== id);
        state.data.posts = state.data.posts.filter((item) => getId(item) !== id);
        state.selectedPost = null;
        showToast("Đã xóa bài viết demo.");
        render();
        return;
      }

      try {
        await apiFetch(`/posts/${id}`, { method: "DELETE", timeoutMs: 7000 });
        state.selectedPost = null;
        showToast("Đã xóa bài viết.");
        if (userAudience() === "seller") {
          loadSellerData();
        } else {
          loadData();
        }
      } catch (error) {
        showToast(error.message || "Không xóa được bài viết.", "warn");
      }
    });
  });

  document.querySelectorAll("[data-seller-edit-post]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.sellerEditPost;
      if (!id) return;
      state.activeInlinePostEditId = id;
      render();
    });
  });

  document.querySelectorAll("[data-inline-cancel-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeInlinePostEditId = null;
      render();
    });
  });

  document.querySelectorAll("[data-inline-post-edit-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const postId = form.dataset.inlinePostEditForm;
      const formData = new FormData(form);
      const title = String(formData.get("title")).trim();
      const content = String(formData.get("content")).trim();
      const tags = splitTags(formData.get("tags"));

      const existingPost = isDemoSellerMode() || postId.startsWith("demo-") || !state.apiOnline
        ? (state.seller.posts.find(p => getId(p) === postId) || state.data.posts.find(p => getId(p) === postId))
        : null;

      const body = {
        title,
        content,
        images: existingPost ? existingPost.images : [],
        tags
      };

      if (isDemoSellerMode() || postId.startsWith("demo-") || !state.apiOnline) {
        const idx = state.seller.posts.findIndex((p) => getId(p) === postId);
        if (idx !== -1) {
          state.seller.posts[idx] = { ...state.seller.posts[idx], ...body };
        }
        const dataIdx = state.data.posts.findIndex((p) => getId(p) === postId);
        if (dataIdx !== -1) {
          state.data.posts[dataIdx] = { ...state.data.posts[dataIdx], ...body };
        }
        state.activeInlinePostEditId = null;
        if (state.selectedPost && getId(state.selectedPost) === postId) {
          state.selectedPost = { ...state.selectedPost, ...body };
        }
        showToast("Đã cập nhật bài viết demo.");
        render();
        return;
      }

      try {
        await apiFetch(`/posts/${postId}`, { method: "PUT", body, timeoutMs: 7000 });
        state.activeInlinePostEditId = null;
        showToast("Đã cập nhật bài viết.");
        
        const refreshed = await apiFetch(`/posts/${postId}`);
        if (refreshed) {
          if (state.selectedPost && getId(state.selectedPost) === postId) {
            state.selectedPost = refreshed;
          }
          const index = state.data.posts.findIndex((p) => getId(p) === postId);
          if (index !== -1) state.data.posts[index] = refreshed;
        }

        if (userAudience() === "seller") {
          loadSellerData();
        } else {
          loadData();
        }
      } catch (error) {
        showToast(error.message || "Không cập nhật được bài viết.", "warn");
      }
    });
  });

  document.querySelectorAll("[data-cancel-post-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.seller.editingPostId = null;
      render();
    });
  });

  document.querySelectorAll("[data-post]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.post;
      state.activeCommentReplyId = null;
      state.expandedCommentReplies.clear();
      let post = state.data.posts.find((item) => getId(item) === id);
      if (!post && state.seller && state.seller.posts) {
        post = state.seller.posts.find((item) => getId(item) === id);
      }
      if (post) {
        state.selectedPost = post;
        render();
        if (!id.startsWith("demo-") && state.apiOnline) {
          apiFetch(`/posts/${id}`).then((refreshed) => {
            if (refreshed && state.selectedPost && getId(state.selectedPost) === id) {
              state.selectedPost = refreshed;
              const index = state.data.posts.findIndex((p) => getId(p) === id);
              if (index !== -1) state.data.posts[index] = refreshed;
              render();
            }
          }).catch(console.error);
        }
      }
    });
  });

  document.querySelectorAll("[data-post-like]").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.stopPropagation();
      const id = btn.dataset.postLike;
      await toggleLike(id);
    });
  });

  document.querySelectorAll("[data-recipe-like]").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.stopPropagation();
      const id = btn.dataset.recipeLike;
      await toggleLikeRecipe(id);
    });
  });

  document.querySelectorAll("[data-post-comment-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = form.dataset.postCommentForm;
      const input = form.querySelector('input[name="commentText"]');
      const text = input ? input.value : "";
      if (text.trim()) {
        await submitComment(id, text);
      }
    });
  });

  document.querySelectorAll("[data-comment-reply-trigger]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const commentId = btn.dataset.commentReplyTrigger;
      state.activeCommentReplyId = commentId;
      render();
      const input = document.querySelector(`form[data-parent-id="${commentId}"] input[name="replyText"]`);
      if (input) input.focus();
    });
  });

  document.querySelectorAll("[data-cancel-reply]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      state.activeCommentReplyId = null;
      render();
    });
  });

  document.querySelectorAll("[data-post-reply-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const postId = form.dataset.postReplyForm;
      const parentId = form.dataset.parentId;
      const input = form.querySelector('input[name="replyText"]');
      const text = input ? input.value : "";
      if (text.trim()) {
        await submitComment(postId, text, parentId);
        state.activeCommentReplyId = null;
        render();
      }
    });
  });

  document.querySelectorAll(".comment-like-btn").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.stopPropagation();
      if (!state.user) {
        state.auth.modalOpen = true;
        render();
        showToast("Vui lòng đăng nhập để thích bình luận.");
        return;
      }
      const postId = btn.getAttribute("data-comment-like-postId");
      const commentId = btn.getAttribute("data-comment-like-commentId");
      
      // Cập nhật local state trước để UI phản hồi tức thì (optimistic update)
      let post = state.data.posts.find(p => getId(p) === postId);
      if (!post) {
        post = state.seller.posts.find(p => getId(p) === postId);
      }
      if (post && Array.isArray(post.comments)) {
        const comment = post.comments.find(c => getId(c) === commentId);
        if (comment) {
          if (!comment.likes) comment.likes = [];
          const currentUserId = getId(state.user);
          const index = comment.likes.indexOf(currentUserId);
          if (index === -1) {
            comment.likes.push(currentUserId);
          } else {
            comment.likes.splice(index, 1);
          }
          if (state.selectedPost && getId(state.selectedPost) === postId) {
            state.selectedPost = { ...post };
          }
          render();
        }
      }

      if (!postId.startsWith("demo-") && state.apiOnline) {
        try {
          const res = await apiFetch(`/posts/${postId}/comments/${commentId}/like`, { method: "POST" });
          if (res && res.comments) {
            if (post) {
              post.comments = res.comments;
              if (state.selectedPost && getId(state.selectedPost) === postId) {
                state.selectedPost = { ...post };
              }
              render();
            }
          }
        } catch (err) {
          showToast(`Không thể thích bình luận: ${err.message}`, "warn");
        }
      }
    });
  });

  document.querySelectorAll(".expand-replies-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const commentId = btn.getAttribute("data-comment-expand");
      state.expandedCommentReplies.add(commentId);
      render();
    });
  });

  document.querySelectorAll(".collapse-replies-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const commentId = btn.getAttribute("data-comment-collapse");
      state.expandedCommentReplies.delete(commentId);
      render();
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
      state.sellerReviews = { formatted: [], total: 0 };
      state.reviewFilter = "all";
      state.draftReviewRating = 5;
      render();
      if (sellerId.startsWith("demo-")) return;
      try {
        state.selectedSeller = await apiFetch(`/fishermen/${sellerId}/profile`);
        try {
          const reviewData = await apiFetch(`/reviews/seller/${sellerId}?limit=100`);
          state.sellerReviews = reviewData || { formatted: [], total: 0 };
        } catch (e) {
          console.warn("Could not load real reviews, using fallbacks:", e);
        }
        render();
      } catch {
        showToast("Không tải được hồ sơ người bán.", "warn");
      }
    });
  });

  document.querySelectorAll("[data-favorite]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.user) {
        requireLogin("Bạn phải đăng nhập để trò chuyện, theo dõi và lưu sản phẩm");
        return;
      }
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

  document.querySelectorAll("[data-review-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.reviewFilter = btn.dataset.reviewFilter;
      render();
    });
  });

  document.querySelectorAll("[data-draft-star]").forEach((starEl) => {
    starEl.addEventListener("click", () => {
      state.draftReviewRating = Number(starEl.dataset.draftStar || 5);
      render();
    });
  });

  document.querySelectorAll("[data-submit-review]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const sellerId = btn.dataset.submitReview;
      const commentText = document.querySelector("[data-review-comment]")?.value || "";
      const ratingVal = state.draftReviewRating || 5;
      
      if (!commentText.trim()) {
        showToast("Vui lòng nhập nội dung nhận xét.", "warn");
        return;
      }
      
      const sellerProducts = state.data.products.filter((p) => p.sellerId === sellerId);
      const productId = sellerProducts[0] ? getId(sellerProducts[0]) : "6a3f7905f4a36c33c4beb8c7";
      
      try {
        showToast("Đang gửi đánh giá...", "info");
        await apiFetch("/reviews", {
          method: "POST",
          body: {
            productId,
            sellerId,
            rating: ratingVal,
            comment: commentText,
            imageUrl: null
          }
        });
        
        showToast("Đăng đánh giá thành công!", "success");
        state.draftReviewRating = 5;
        
        state.selectedSeller = await apiFetch(`/fishermen/${sellerId}/profile`);
        try {
          const reviewData = await apiFetch(`/reviews/seller/${sellerId}?limit=100`);
          state.sellerReviews = reviewData || { formatted: [], total: 0 };
        } catch (e) {
          console.warn("Could not load real reviews:", e);
        }
        render();
      } catch (err) {
        showToast(`Lỗi gửi đánh giá: ${err.message}`, "error");
      }
    });
  });

  document.querySelectorAll("[data-like-review]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const reviewId = btn.dataset.likeReview;
      if (!reviewId) return;
      
      state.likedReviews = state.likedReviews || new Set();
      if (state.likedReviews.has(reviewId)) {
        state.likedReviews.delete(reviewId);
        showToast("Đã bỏ thích đánh giá.");
      } else {
        state.likedReviews.add(reviewId);
        showToast("Đã thích đánh giá. Cảm ơn phản hồi của bạn!");
      }
      render();
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedProduct = null;
      state.selectedSeller = null;
      state.selectedRecipe = null;
      state.selectedPost = null;
      state.activeInlinePostEditId = null;
      state.activeCommentReplyId = null;
      state.reportModal.open = false;
      state.expandedCommentReplies.clear();
      state.profileModalOpen = false;
      state.followedModalOpen = false;
      state.premiumModalOpen = false;
      render();
    });
  });

  document.querySelectorAll(".modal-layer").forEach((layer) => {
    layer.addEventListener("click", (event) => {
      if (event.target === layer) {
        if (state.activeCall?.open) return;
        state.selectedProduct = null;
        state.selectedSeller = null;
        state.selectedRecipe = null;
        state.selectedPost = null;
        state.activeInlinePostEditId = null;
        state.activeCommentReplyId = null;
        state.reportModal.open = false;
        state.expandedCommentReplies.clear();
        state.profileModalOpen = false;
        state.followedModalOpen = false;
        state.premiumModalOpen = false;
        if (state.auth) {
          state.auth.modalOpen = false;
        }
        render();
      }
    });
  });

  document.querySelectorAll("[data-login]").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.hash = "#login";
    });
  });

  document.querySelectorAll("[data-demo-login]").forEach((button) => {
    button.addEventListener("click", () => {
      setDemoUser(button.dataset.demoLogin || "buyer");
    });
  });

  document.querySelector('[data-login-form="buyer"]')?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = e.currentTarget.email.value.trim();
    handleCustomLogin(email, "buyer");
  });

  document.querySelector('[data-login-form="seller"]')?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = e.currentTarget.email.value.trim();
    handleCustomLogin(email, "seller");
  });

  document.querySelector('[data-setup-profile-form]')?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    
    if (state.user) {
      state.user.name = name;
      state.user.email = email;
      state.user.phone = phone;
      
      if (state.user.role === "seller") {
        state.user.vesselNumber = form.vesselNumber.value.trim();
        state.user.portOfOrigin = form.portOfOrigin.value.trim();
        state.user.specialty = form.specialty.value;
      } else {
        state.user.shippingAddress = form.shippingAddress.value.trim();
        state.user.favoriteSeafood = form.favoriteSeafood.value;
      }
      
      if (!state.user.isDemo && state.apiOnline) {
        try {
          const body = { name, email, phone };
          if (state.user.role === "seller") {
            body.vesselNumber = state.user.vesselNumber;
            body.portOfOrigin = state.user.portOfOrigin;
            body.specialty = state.user.specialty;
          } else {
            body.shippingAddress = state.user.shippingAddress;
            body.favoriteSeafood = state.user.favoriteSeafood;
          }
          await apiFetch("/auth/profile", {
            method: "PUT",
            body
          });
          showToast("Đã đồng bộ thông tin cá nhân lên hệ thống.");
        } catch (err) {
          console.error("Profile sync error:", err);
        }
      } else {
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(state.user));
      }
    }
    
    const nextSection = defaultSectionForAudience(userAudience());
    state.activeSection = nextSection;
    window.history.replaceState(null, "", `#${nextSection}`);
    render();
    showToast("Hoàn tất cập nhật thông tin cá nhân. Chào mừng bạn!");
  });

  document.querySelector("[data-close-auth]")?.addEventListener("click", () => {
    state.auth.modalOpen = false;
    render();
  });

  initializeGoogleSignIn();

  document.querySelector("[data-toggle-user-menu]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    state.userMenuOpen = !state.userMenuOpen;
    render();
  });

  document.querySelectorAll("[data-user-menu-item]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      const action = item.dataset.userMenuItem;
      state.userMenuOpen = false;
      if (action === "account" || action === "profile") {
        state.profileModalOpen = true;
      } else if (action === "followed") {
        state.followedModalOpen = true;
      } else if (action === "premium") {
        state.premiumModalOpen = true;
      }
      render();
    });
  });

  document.querySelector("[data-close-profile-modal]")?.addEventListener("click", () => {
    state.profileModalOpen = false;
    render();
  });

  document.querySelector("[data-close-followed-modal]")?.addEventListener("click", () => {
    state.followedModalOpen = false;
    render();
  });

  document.querySelector("[data-close-premium-modal]")?.addEventListener("click", () => {
    state.premiumModalOpen = false;
    render();
  });

  document.querySelectorAll("[data-chat-image-click]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      state.activeImageViewerSrc = el.dataset.chatImageClick;
      render();
    });
  });

  document.querySelectorAll("[data-close-image-viewer]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      state.activeImageViewerSrc = null;
      render();
    });
  });

  document.querySelector("[data-profile-update-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.profileName.value.trim();
    const email = form.profileEmail.value.trim();
    const avatarInput = document.getElementById("profile-avatar-input");
    
    if (state.user) {
      state.user.name = name;
      state.user.email = email;
      
      if (!state.user.isDemo && state.apiOnline) {
        try {
          const formData = new FormData();
          formData.append("name", name);
          formData.append("email", email);
          if (avatarInput && avatarInput.files && avatarInput.files[0]) {
            formData.append("avatar", avatarInput.files[0]);
          }

          const res = await apiFetch("/auth/profile", {
            method: "PUT",
            body: formData
          });
          
          if (res && res.avatarUrl) {
            state.user.avatarUrl = res.avatarUrl;
          }
          showToast("Đã cập nhật thông tin cá nhân thành công.");
        } catch (err) {
          showToast(`Lỗi đồng bộ thông tin cá nhân: ${err.message}`, "warn");
        }
      } else {
        if (avatarInput && avatarInput.files && avatarInput.files[0]) {
          const file = avatarInput.files[0];
          state.user.avatarUrl = URL.createObjectURL(file);
        }
        const stored = localStorage.getItem(DEMO_USER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.name = name;
          parsed.email = email;
          parsed.avatarUrl = state.user.avatarUrl;
          localStorage.setItem(DEMO_USER_KEY, JSON.stringify(parsed));
        }
        showToast("Đã cập nhật thông tin cá nhân (chế độ demo).");
      }
    }
    state.profileModalOpen = false;
    render();
  });

  // Handle avatar file upload change to display image preview instantly
  document.addEventListener("change", (event) => {
    const input = event.target;
    if (input && input.id === "profile-avatar-input" && input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewContainer = input.parentElement;
        if (previewContainer) {
          let img = previewContainer.querySelector("img");
          if (!img) {
            const textAvatar = previewContainer.querySelector("span");
            if (textAvatar) textAvatar.remove();
            
            img = document.createElement("img");
            img.style.width = "64px";
            img.style.height = "64px";
            img.style.borderRadius = "50%";
            img.style.objectFit = "cover";
            img.style.border = "2px solid var(--line)";
            img.id = "profile-avatar-preview";
            previewContainer.insertBefore(img, previewContainer.firstChild);
          }
          img.src = e.target.result;
        }
      };
      reader.readAsDataURL(input.files[0]);
    }
  });

  document.querySelectorAll("[data-unfollow-profile]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const sellerId = btn.dataset.unfollowProfile;
      state.followingSellers.delete(sellerId);
      localStorage.setItem("haisan-following-sellers", JSON.stringify(Array.from(state.followingSellers)));
      
      if (state.user && !state.user.isDemo && state.apiOnline) {
        try {
          await apiFetch(`/follow/${sellerId}`, { method: "DELETE" });
        } catch (err) {
          console.error(err);
        }
      }
      showToast("Đã bỏ theo dõi ngư dân.");
      render();
    });
  });

  document.querySelector("[data-upgrade-premium-confirm]")?.addEventListener("click", () => {
    if (state.user) {
      state.user.isPremium = true;
      const stored = localStorage.getItem(DEMO_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.isPremium = true;
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(parsed));
      }
      showToast("Chúc mừng! Bạn đã nâng cấp lên tài khoản Premium thành công.");
      state.premiumModalOpen = false;
      render();
    }
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

  // Dynamic Map Modal for choosing location
  document.getElementById("open-map-modal-btn")?.addEventListener("click", () => {
    const latInput = document.getElementById("seller-lat");
    const lngInput = document.getElementById("seller-lng");
    if (!latInput || !lngInput) return;

    const currentLat = parseFloat(latInput.value) || 10.762622;
    const currentLng = parseFloat(lngInput.value) || 106.660172;

    let tempLat = currentLat;
    let tempLng = currentLng;

    const modal = document.createElement("div");
    modal.className = "modal-layer";
    modal.style.zIndex = "2000";
    modal.innerHTML = `
      <div class="modal-panel" style="width: 98%; max-width: 1200px; height: 92vh; max-height: 92vh; display: flex; flex-direction: column; padding: 24px; box-sizing: border-box;">
        <h3 style="margin-top: 0; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; font-weight: 800; color: var(--ink);">
          🗺️ Chọn vị trí mẻ hàng
        </h3>
        <div id="seller-map" style="flex: 1; width: 100%; border-radius: 8px; border: 1px solid var(--line); position: relative; min-height: 250px;"></div>
        <p style="font-size: 12px; color: var(--muted); margin: 8px 0 16px 0; font-weight: 500;">
          * Kéo thả ghim màu xanh hoặc nhấp chuột lên vị trí bất kỳ trên bản đồ để xác định nơi bán hàng.
        </p>
        <div style="display: flex; gap: 16px; justify-content: center; align-items: center; margin-top: 10px;">
          <button type="button" class="ghost-button" id="close-map-modal-btn" style="padding: 10px 24px; font-weight: 700; min-width: 120px; border: 1px solid #ccc; background: #fff; cursor: pointer; border-radius: 6px;">Hủy</button>
          <button type="button" class="primary-button" id="save-map-modal-btn" style="background: var(--seller-orange, #0ea5e9); border: 1px solid var(--seller-orange, #0ea5e9); color: #fff; padding: 10px 24px; font-weight: 700; min-width: 150px; cursor: pointer; border-radius: 6px;">Lưu và xác nhận</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Initialize Leaflet Map inside the newly created element
    const mapEl = document.getElementById("seller-map");
    if (mapEl && window.L) {
      // Use zoom level 16 for better street-level precision on reopen
      const map = L.map(mapEl, { zoomControl: false }).setView([tempLat, tempLng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      const marker = L.marker([tempLat, tempLng], { draggable: true }).addTo(map);

      const updateTempCoords = (lat, lng) => {
        tempLat = lat;
        tempLng = lng;
      };

      marker.on("dragend", () => {
        const position = marker.getLatLng();
        updateTempCoords(position.lat, position.lng);
      });

      map.on("click", (event) => {
        marker.setLatLng(event.latlng);
        updateTempCoords(event.latlng.lat, event.latlng.lng);
      });

      // Add Custom Controls (Target/Locate + Zoom)
      const CustomControl = L.Control.extend({
        options: { position: 'topleft' },
        onAdd: function (map) {
          const container = L.DomUtil.create('div', 'leaflet-custom-controls');
          container.innerHTML = `
            <div class="map-control-btn locate-btn" title="Vị trí hiện tại" style="background: #fff; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); cursor: pointer; color: #333; transition: background 0.2s;">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
              </svg>
            </div>
            <div class="map-zoom-group" style="margin-top: 8px; display: flex; flex-direction: column; background: #fff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); overflow: hidden;">
              <div class="map-control-btn zoom-in-btn" title="Phóng to" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; font-weight: bold; color: #333; transition: background 0.2s; border-bottom: 1px solid #eee;">+</div>
              <div class="map-control-btn zoom-out-btn" title="Thu nhỏ" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; font-weight: bold; color: #333; transition: background 0.2s;">−</div>
            </div>
          `;

          L.DomEvent.disableClickPropagation(container);

          container.querySelector('.locate-btn').addEventListener('click', () => {
            if (navigator.geolocation) {
              const locateIcon = container.querySelector('.locate-btn');
              locateIcon.style.opacity = "0.5";
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const lat = position.coords.latitude;
                  const lng = position.coords.longitude;
                  map.setView([lat, lng], 16);
                  marker.setLatLng([lat, lng]);
                  updateTempCoords(lat, lng);
                  locateIcon.style.opacity = "1";
                  showToast("Đã định vị vị trí hiện tại!");
                },
                (err) => {
                  locateIcon.style.opacity = "1";
                  showToast("Không thể lấy vị trí hiện tại: " + err.message, "warn");
                },
                { enableHighAccuracy: true, timeout: 8000 }
              );
            } else {
              showToast("Trình duyệt không hỗ trợ dịch vụ định vị GPS.", "warn");
            }
          });

          container.querySelector('.zoom-in-btn').addEventListener('click', () => {
            map.zoomIn();
          });

          container.querySelector('.zoom-out-btn').addEventListener('click', () => {
            map.zoomOut();
          });

          return container;
        }
      });
      map.addControl(new CustomControl());

      // Auto-invalidate size to fix broken tile sizes in modals
      setTimeout(() => {
        map.invalidateSize();
      }, 350);
    }

    // Modal Action Bindings
    document.getElementById("close-map-modal-btn")?.addEventListener("click", () => {
      modal.remove();
    });

    document.getElementById("save-map-modal-btn")?.addEventListener("click", () => {
      latInput.value = tempLat.toFixed(6);
      lngInput.value = tempLng.toFixed(6);
      const coordsDisplay = document.getElementById("selected-coords-display");
      if (coordsDisplay) {
        coordsDisplay.innerText = `Đã chọn: ${tempLat.toFixed(4)}, ${tempLng.toFixed(4)}`;
      }
      modal.remove();
      showToast("Đã cập nhật vị trí mới thành công!");
    });
  });

  document.getElementById("webrtc-hangup")?.addEventListener("click", () => {
    endWebRTCCall();
    showToast("Đã kết thúc cuộc gọi video.");
  });

  // --- AI Chatbot Events ---
  document.querySelectorAll("[data-toggle-ai-chatbot]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.chatbot.open = !state.chatbot.open;
      render();
      if (state.chatbot.open) {
        const msgContainer = document.querySelector(".ai-chatbot-messages");
        if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;
      }
    });
  });

  document.querySelector("[data-ai-chatbot-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.message;
    const userMsg = input.value.trim();
    if (!userMsg) return;

    input.value = "";
    state.chatbot.messages.push({ role: "user", content: userMsg });
    state.chatbot.loading = true;
    render();

    // Scroll to bottom
    let msgContainer = document.querySelector(".ai-chatbot-messages");
    if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;

    // Call API or Mock Responder
    if (state.apiOnline) {
      try {
        const history = state.chatbot.messages.slice(0, -1).map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

        const res = await apiFetch("/chatbot", {
          method: "POST",
          body: { message: userMsg, history }
        });

        state.chatbot.messages.push({ role: "assistant", content: res.reply || "Xin lỗi, tôi không nhận được phản hồi." });
      } catch (err) {
        state.chatbot.messages.push({ role: "assistant", content: `Lỗi kết nối AI: ${err.message}` });
      } finally {
        state.chatbot.loading = false;
        render();
        msgContainer = document.querySelector(".ai-chatbot-messages");
        if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;
      }
    } else {
      // Mock Responder for Demo Mode
      setTimeout(() => {
        let reply = "Chào bạn! Tôi là Trợ lý Hải Sản. Hiện hệ thống đang ở chế độ demo/ngoại tuyến. Bạn có thể hỏi tôi về cách chọn hải sản, đăng tin, hoặc nâng cấp Premium nhé! 🐟";
        const query = userMsg.toLowerCase();
        
        if (query.includes("chọn") || query.includes("tươi") || query.includes("ngon")) {
          reply = "Để chọn hải sản tươi ngon:\n- **Cá:** Mang đỏ tươi, mắt trong suốt, thịt ấn vào đàn hồi tốt.\n- **Tôm:** Vỏ bóng cứng, đầu dính chặt vào thân, khớp vỏ khít.\n- **Cua:** Yếm cứng chắc, mai cua màu xám đục, ấn vào yếm không bị lún.";
        } else if (query.includes("premium") || query.includes("gói") || query.includes("nâng cấp")) {
          reply = "Gói Premium trên HảiSản.vn có giá chỉ **2.000đ** thanh toán nhanh qua VietQR. Khi nâng cấp Premium, bạn sẽ có các đặc quyền:\n- Đăng tin bán hàng không giới hạn.\n- Được gắn huy hiệu Premium nổi bật.\n- Ưu tiên hiển thị tin trên Chợ biển.";
        } else if (query.includes("đăng tin") || query.includes("bán") || query.includes("đăng bài")) {
          reply = "Với tài khoản thường, bạn được đăng tối đa **5 tin/ngày**. Để đăng tin không giới hạn, bạn hãy nâng cấp gói Premium trong menu người dùng nhé! ⛵";
        } else if (query.includes("giao") || query.includes("ship") || query.includes("vận chuyển") || query.includes("định vị") || query.includes("bán kính")) {
          reply = "HảiSản.vn hỗ trợ tìm kiếm sản phẩm theo GPS định vị trong bán kính **20km** để bạn dễ dàng mua từ các ngư dân gần mình nhất và tự thoả thuận giao hàng trực tiếp! 🦐";
        } else if (query.includes("nấu") || query.includes("chế biến") || query.includes("công thức") || query.includes("món") || query.includes("cá hồi")) {
          reply = "Dưới đây là một số công thức chế biến hải sản phổ biến:\n- **Cá hồi áp chảo sốt bơ chanh:** Cá hồi ướp muối tiêu, áp chảo chín vàng hai mặt. Sốt bơ, tỏi băm, nước cốt chanh rưới lên cá.\n- **Mực rim me:** Mực sơ chế sạch, chiên sơ. Rim nước sốt me chua ngọt với tỏi, ớt và nước mắm cho đến khi sốt sệt lại.\n- **Cua hấp sả gừng:** Xếp sả đập dập và gừng thái chỉ dưới đáy xửng hấp, đặt cua lên trên và hấp chín trong 15-20 phút.";
        }

        state.chatbot.messages.push({ role: "assistant", content: reply });
        state.chatbot.loading = false;
        render();
        msgContainer = document.querySelector(".ai-chatbot-messages");
        if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;
      }, 1000);
    }
  });

  // --- Dynamic Featured Products Banner cycling ---
  if (!state.buyer.featuredInterval) {
    state.buyer.featuredInterval = setInterval(() => {
      if (state.activeSection === "market") {
        const latestProducts = [...state.data.products]
          .filter(p => (p.status || "Active") === "Active")
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 5);
        if (latestProducts.length > 0) {
          state.buyer.featuredIndex = (state.buyer.featuredIndex || 0) + 1;
          const nextIdx = state.buyer.featuredIndex % latestProducts.length;

          // Toggle bg layer visibility
          const layers = document.querySelectorAll(".hero-visual .hero-bg-layer");
          layers.forEach((layer, lIdx) => {
            if (lIdx === nextIdx) {
              layer.classList.add("active");
            } else {
              layer.classList.remove("active");
            }
          });

          // Update details card if present
          const card = document.querySelector(".hero-featured-card");
          if (card) {
            const nextProduct = latestProducts[nextIdx];
            card.setAttribute("data-hero-product", getId(nextProduct));
            const img = card.querySelector("img");
            if (img) img.src = productImage(nextProduct);
            const title = card.querySelector(".hero-featured-title");
            if (title) title.textContent = nextProduct.name;
            const price = card.querySelector(".hero-featured-price");
            if (price) price.textContent = `${formatCurrency(nextProduct.price)} / kg · ${nextProduct.sellerName || "Ngư dân"}`;
          }
        }
      }
    }, 4000);
  }

  document.querySelectorAll("[data-hero-prev]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const latestProducts = [...state.data.products]
        .filter(p => (p.status || "Active") === "Active")
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);
      if (latestProducts.length > 0) {
        state.buyer.featuredIndex = ((state.buyer.featuredIndex || 0) - 1 + latestProducts.length) % latestProducts.length;
        render();
      }
    });
  });

  document.querySelectorAll("[data-hero-next]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const latestProducts = [...state.data.products]
        .filter(p => (p.status || "Active") === "Active")
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);
      if (latestProducts.length > 0) {
        state.buyer.featuredIndex = ((state.buyer.featuredIndex || 0) + 1) % latestProducts.length;
        render();
      }
    });
  });

  document.querySelectorAll("[data-hero-product]").forEach((card) => {
    card.addEventListener("click", async () => {
      const id = card.dataset.heroProduct;
      let product = state.data.products.find((item) => getId(item) === id);
      if (!product && state.seller && state.seller.products) {
        product = state.seller.products.find((item) => getId(item) === id);
      }
      if (product) {
        state.selectedProduct = product;
        render();
        if (!id.startsWith("demo-") && state.apiOnline) {
          try {
            state.selectedProduct = await apiFetch(`/products/${id}`);
            render();
          } catch (e) {
            console.error(e);
          }
        }
      }
    });
  });

  document.querySelectorAll("[data-report-post]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!state.user) {
        state.auth.modalOpen = true;
        render();
        showToast("Vui lòng đăng nhập để gửi báo cáo vi phạm.");
        return;
      }
      state.reportModal = {
        open: true,
        targetId: btn.dataset.reportPost,
        targetType: "Post",
        targetTitle: ""
      };
      render();
    });
  });

  document.querySelectorAll("[data-report-recipe]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!state.user) {
        state.auth.modalOpen = true;
        render();
        showToast("Vui lòng đăng nhập để gửi báo cáo vi phạm.");
        return;
      }
      state.reportModal = {
        open: true,
        targetId: btn.dataset.reportRecipe,
        targetType: "Recipe",
        targetTitle: ""
      };
      render();
    });
  });

  document.querySelectorAll("[data-close-report-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.reportModal.open = false;
      render();
    });
  });

  document.querySelectorAll("[data-report-reason]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const reason = btn.dataset.reportReason;
      const { targetId, targetType } = state.reportModal;
      state.reportModal.open = false;
      render();

      if (targetId.startsWith("demo-") || !state.apiOnline) {
        showToast("Cảm ơn bạn! Báo cáo vi phạm đã được gửi tới quản trị viên (chế độ demo).");
        return;
      }

      try {
        const path = targetType === "Post" ? `/reports/posts/${targetId}` : `/reports/recipes/${targetId}`;
        await apiFetch(path, {
          method: "POST",
          body: { reason }
        });
        showToast("Cảm ơn bạn! Báo cáo vi phạm đã được gửi tới quản trị viên thành công.");
      } catch (err) {
        showToast(err.message || "Không gửi được báo cáo vi phạm.", "error");
      }
    });
  });

  document.addEventListener("keydown", handleEscape, { once: true });
}

function handleEscape(event) {
  if (event.key === "Escape" && state.notifications.open) {
    state.notifications.open = false;
    render();
    return;
  }
  if (event.key === "Escape" && state.auth.modalOpen) {
    state.auth.modalOpen = false;
    render();
    return;
  }
  if (event.key === "Escape" && state.buyer.activeThreadId) {
    state.buyer.activeThreadId = null;
    state.buyer.emojiOpen = false;
    state.buyer.recording = false;
    render();
    return;
  }
  if (event.key === "Escape" && state.seller.activeThreadId) {
    state.seller.activeThreadId = null;
    state.seller.emojiOpen = false;
    state.seller.recording = false;
    render();
    return;
  }
  if (event.key === "Escape" && (state.selectedProduct || state.selectedSeller || state.selectedRecipe || state.selectedPost || state.profileModalOpen || state.followedModalOpen || state.premiumModalOpen || state.reportModal.open)) {
    state.selectedProduct = null;
    state.selectedSeller = null;
    state.selectedRecipe = null;
    state.selectedPost = null;
    state.activeInlinePostEditId = null;
    state.reportModal.open = false;
    state.profileModalOpen = false;
    state.followedModalOpen = false;
    state.premiumModalOpen = false;
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

document.addEventListener("click", (event) => {
  if (state.userMenuOpen && !event.target.closest("[data-toggle-user-menu]")) {
    state.userMenuOpen = false;
    render();
  }
});
