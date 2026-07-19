import axios from "axios";

const configuredApiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const apiBaseUrl = configuredApiUrl ? `${configuredApiUrl}/api` : "/api";
const CSRF_HEADER_NAME = "X-CSRF-Token";
const unsafeMethods = new Set(["post", "put", "patch", "delete"]);

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "csrfToken",
  xsrfHeaderName: CSRF_HEADER_NAME,
  timeout: 15_000,
  headers: { Accept: "application/json" },
});
let refreshPromise = null;
let csrfPromise = null;
let csrfToken = null;

const readCookie = (name) => {
  if (typeof document === "undefined") return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
};

const ensureCsrfToken = async (forceRefresh = false) => {
  if (!forceRefresh) {
    const cookieToken = readCookie("csrfToken");
    if (cookieToken) {
      csrfToken = cookieToken;
      return cookieToken;
    }
    if (csrfToken) return csrfToken;
  }

  csrfPromise ||= axios
    .get(`${apiBaseUrl}/csrf-token`, {
      withCredentials: true,
      timeout: 15_000,
      headers: { Accept: "application/json" },
    })
    .then((response) => {
      const nextToken = response.data?.csrfToken;
      if (!nextToken) throw new ApiError("Không thể khởi tạo CSRF token.", 403);
      csrfToken = nextToken;
      return nextToken;
    })
    .finally(() => {
      csrfPromise = null;
    });

  return csrfPromise;
};

apiClient.interceptors.request.use(
  async (config) => {
    if (unsafeMethods.has(String(config.method || "get").toLowerCase())) {
      config.headers[CSRF_HEADER_NAME] = await ensureCsrfToken();
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    const rotatedToken = response.headers?.["x-csrf-token"];
    if (rotatedToken) csrfToken = rotatedToken;
    if (String(response.config?.url || "").endsWith("/auth/logout")) {
      csrfToken = null;
    }
    return response.data;
  },
  async (error) => {
    if (error.code === "ECONNABORTED") {
      return Promise.reject(new ApiError("Máy chủ phản hồi quá chậm. Vui lòng thử lại.", 408));
    }

    const status = error.response?.status || 0;
    const data = error.response?.data;
    const originalRequest = error.config;
    const requestUrl = String(originalRequest?.url || "");

    if (
      status === 403 &&
      data?.code === "CSRF_INVALID" &&
      originalRequest &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;
      try {
        const nextToken = await ensureCsrfToken(true);
        originalRequest.headers[CSRF_HEADER_NAME] = nextToken;
        return apiClient(originalRequest);
      } catch (csrfError) {
        return Promise.reject(csrfError);
      }
    }

    const refreshableAuthFailure =
      data?.code === "TOKEN_EXPIRED" ||
      data?.code === "UNAUTHORIZED" ||
      (requestUrl.endsWith("/auth/me") && !data?.code);
    const canRefreshSession =
      status === 401 &&
      refreshableAuthFailure &&
      originalRequest &&
      !originalRequest._retry &&
      !requestUrl.endsWith("/auth/google") &&
      !requestUrl.endsWith("/auth/refresh") &&
      !requestUrl.endsWith("/auth/logout");

    if (canRefreshSession) {
      originalRequest._retry = true;
      try {
        refreshPromise ||= axios.post(
          `${apiBaseUrl}/auth/refresh`,
          null,
          {
            withCredentials: true,
            xsrfCookieName: "csrfToken",
            xsrfHeaderName: "X-CSRF-Token",
          },
        );
        const refreshResponse = await refreshPromise;
        csrfToken =
          refreshResponse.headers?.["x-csrf-token"] ||
          readCookie("csrfToken") ||
          null;
        if (csrfToken) originalRequest.headers[CSRF_HEADER_NAME] = csrfToken;
        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem("haisan-user");
        localStorage.removeItem("haisan-token");
        window.dispatchEvent(new Event("haisan:session-expired"));
      } finally {
        refreshPromise = null;
      }
    }

    const message =
      data?.message ||
      (status === 401 ? "Phiên đăng nhập đã hết hạn." : null) ||
      error.message ||
      "Không thể kết nối tới máy chủ.";

    return Promise.reject(new ApiError(message, status, data));
  },
);

export default apiClient;

export const apiProducts = {
  getAll: (params) => apiClient.get("/products", { params }),
  getById: (id) => apiClient.get(`/products/${id}`),
  create: (data) => apiClient.post("/products", data),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
  updateStatus: (id, status) => apiClient.put(`/products/${id}`, { status }),
  getMine: () => apiClient.get("/products/my"),
  uploadImages: (id, formData) =>
    apiClient.post(`/products/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  bump: (id) => apiClient.post(`/products/${id}/bump`),
};

export const apiFishermen = {
  getAll: (params) => apiClient.get("/fishermen", { params }),
  getProfile: (id) => apiClient.get(`/fishermen/${id}/profile`),
  getProducts: (id, params) =>
    apiClient.get(`/fishermen/${id}/products`, { params }),
  getRecipes: (id, params) =>
    apiClient.get(`/fishermen/${id}/recipes`, { params }),
  getPosts: (id, params) => apiClient.get(`/fishermen/${id}/posts`, { params }),
  getBoatLogs: (id, params) =>
    apiClient.get(`/fishermen/${id}/boat-logs`, { params }),
  toggleFollow: (id) => apiClient.post(`/follows/${id}/toggle`),
  checkFollow: (id) => apiClient.get(`/follows/${id}/check`),
};

export const apiFavorites = {
  getAll: () => apiClient.get("/favorites"),
  getIds: () => apiClient.get("/favorites/ids"),
  toggle: (productId) => apiClient.post(`/favorites/${productId}`),
};

export const apiAuth = {
  googleLogin: (data) => apiClient.post("/auth/google", data),
  getProfile: () => apiClient.get("/auth/me"),
  logout: () => apiClient.post("/auth/logout"),
  refresh: () => apiClient.post("/auth/refresh"),
  updateProfile: (formData) =>
    apiClient.put("/auth/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteAccount: () => apiClient.delete("/auth/account"),
};

export const apiMessages = {
  getConversations: () => apiClient.get("/messages/conversations"),
  getHistory: (productId, buyerId) =>
    apiClient.get(`/messages/${productId}`, { params: { buyerId } }),
  send: (data) => apiClient.post("/messages", data),
  uploadImage: (formData) =>
    apiClient.post("/messages/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getUnreadCount: () => apiClient.get("/messages/unread-count"),
  recall: (id) => apiClient.patch(`/messages/${id}/recall`),
  edit: (id, content) => apiClient.patch(`/messages/${id}/edit`, { content }),
  react: (id, reaction) => apiClient.post(`/messages/${id}/react`, { reaction }),
};

export const apiBoatLogs = {
  getAll: (params) => apiClient.get("/boat-logs", { params }),
  create: (data) => apiClient.post("/boat-logs", data),
  update: (id, data) => apiClient.put(`/boat-logs/${id}`, data),
  delete: (id) => apiClient.delete(`/boat-logs/${id}`),
  createLandingBatch: (id) =>
    apiClient.post(`/boat-logs/${id}/create-landing-batch`),
  uploadImages: (formData) =>
    apiClient.post("/uploads/boat-logs", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const apiLandingBatches = {
  getAll: (params) => apiClient.get("/landing-batches", { params }),
  getMarketplace: (params) =>
    apiClient.get("/landing-batches/marketplace", { params }),
  getMine: (params) => apiClient.get("/landing-batches/mine", { params }),
  getById: (id) => apiClient.get(`/landing-batches/${id}`),
  create: (data) => apiClient.post("/landing-batches", data),
  update: (id, data) => apiClient.put(`/landing-batches/${id}`, data),
  delete: (id) => apiClient.delete(`/landing-batches/${id}`),
  addProducts: (id, products) =>
    apiClient.post(`/landing-batches/${id}/products`, { products }),
  uploadImages: (formData) =>
    apiClient.post("/uploads/landing-batches", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const apiAssistant = {
  ask: (message, history) => apiClient.post("/chatbot", { message, history }),
};

export const apiPosts = {
  getAll: (params) => apiClient.get("/posts", { params }),
  getById: (id) => apiClient.get(`/posts/${id}`),
  create: (data) => apiClient.post("/posts", data),
  update: (id, data) => apiClient.put(`/posts/${id}`, data),
  delete: (id) => apiClient.delete(`/posts/${id}`),
  toggleLike: (id) => apiClient.post(`/posts/${id}/like`),
  addComment: (id, text, parentId) =>
    apiClient.post(`/posts/${id}/comments`, { text, parentId }),
  uploadImages: (formData) =>
    apiClient.post("/uploads/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const apiRecipes = {
  getAll: (params) => apiClient.get("/recipes", { params }),
  getById: (id) => apiClient.get(`/recipes/${id}`),
  create: (data) => apiClient.post("/recipes", data),
  update: (id, data) => apiClient.put(`/recipes/${id}`, data),
  delete: (id) => apiClient.delete(`/recipes/${id}`),
  toggleLike: (id) => apiClient.post(`/recipes/${id}/like`),
  addComment: (id, text) =>
    apiClient.post(`/recipes/${id}/comments`, { text }),
  uploadImage: (formData) =>
    apiClient.post("/uploads/recipes", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const apiReviews = {
  getBySeller: (sellerId, params) =>
    apiClient.get(`/reviews/seller/${sellerId}`, { params }),
  create: (formData) =>
    apiClient.post("/reviews", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const apiReports = {
  createForProduct: (id, reason) =>
    apiClient.post(`/reports/${id}`, { reason }),
  createForPost: (id, reason) =>
    apiClient.post(`/reports/posts/${id}`, { reason }),
  createForRecipe: (id, reason) =>
    apiClient.post(`/reports/recipes/${id}`, { reason }),
  getAll: (params) => apiClient.get("/reports", { params }),
  handle: (id, action, adminNote) =>
    apiClient.patch(`/reports/${id}`, { action, adminNote }),
};

export const apiNotifications = {
  getAll: (params) => apiClient.get("/notifications", { params }),
  markAllRead: () => apiClient.put("/notifications/read"),
  markRead: (id) => apiClient.patch(`/notifications/${id}`),
};

export const apiAdmin = {
  getStats: () => apiClient.get("/admin/stats"),
  getUsers: (params) => apiClient.get("/admin/users", { params }),
  toggleUser: (id) => apiClient.patch(`/admin/users/${id}/toggle`),
  verifyUser: (id) => apiClient.patch(`/admin/users/${id}/verify`),
  getListings: (params) => apiClient.get("/admin/listings", { params }),
  getLandingBatches: (params) =>
    apiClient.get("/admin/landing-batches", { params }),
  deleteListing: (id) => apiClient.delete(`/admin/listings/${id}`),
  broadcast: (data) => apiClient.post("/admin/notifications/broadcast", data),
  getBroadcasts: (params) =>
    apiClient.get("/admin/notifications/broadcasts", { params }),
};

export const apiPayment = {
  getPremiumIntent: () => apiClient.get("/payment/premium-intent"),
  getStatus: () => apiClient.get("/payment/status"),
};

