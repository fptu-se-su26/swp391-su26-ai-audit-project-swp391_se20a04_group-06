import axios from "axios";

// IMPORTANT: In dev, always use "/api" so Vite proxy handles CORS transparently.
// VITE_API_URL should only be set in production (deployed with a reverse proxy).
const configuredApiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const apiBaseUrl =
  import.meta.env.DEV || !configuredApiUrl
    ? "/api"                            // ← Vite proxy (dev): no CORS issues
    : `${configuredApiUrl}/api`;         // ← Absolute URL (prod only)

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
  timeout: 15_000,
  headers: { Accept: "application/json" },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("haisan-token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.code === "ECONNABORTED") {
      return Promise.reject(new ApiError("Máy chủ phản hồi quá chậm. Vui lòng thử lại.", 408));
    }

    const status = error.response?.status || 0;
    const data = error.response?.data;
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
};

export const apiFishermen = {
  getAll: () => apiClient.get("/fishermen"),
  getProfile: (id) => apiClient.get(`/fishermen/${id}/profile`),
  toggleFollow: (id) => apiClient.post(`/fishermen/${id}/follow`),
};

export const apiRecipes = {
  getAll: () => apiClient.get("/recipes"),
  create: (data) => apiClient.post("/recipes", data),
  delete: (id) => apiClient.delete(`/recipes/${id}`),
};

export const apiReviews = {
  getBySeller: (sellerId) => apiClient.get(`/reviews/seller/${sellerId}`),
  create: (data) => apiClient.post("/reviews", data),
};

export const apiAuth = {
  login: (credentials) => apiClient.post("/auth/login", credentials),
  register: (data) => apiClient.post("/auth/register", data),
  googleLogin: (data) => apiClient.post("/auth/google", data),
  getProfile: () => apiClient.get("/auth/me"),
  logout: () => apiClient.post("/auth/logout"),
  updateProfile: (data) => apiClient.put("/auth/profile", data),
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
};

export const apiBoatLogs = {
  getAll: (params) => apiClient.get("/boat-logs", { params }),
  create: (data) => apiClient.post("/boat-logs", data),
  toggleLike: (id) => apiClient.post(`/boat-logs/${id}/like`),
  delete: (id) => apiClient.delete(`/boat-logs/${id}`),
};

export const apiAssistant = {
  ask: (message, history) => apiClient.post("/chatbot", { message, history }),
};
