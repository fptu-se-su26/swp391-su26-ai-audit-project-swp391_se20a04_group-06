// 1. Hàm đọc Cookie từ trình duyệt
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

// 2. Hàm gọi API chính (Không còn tàn dư của LocalStorage Token)
export async function api(path, options = {}) {
  const csrfToken = getCookie("csrfToken");

  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(csrfToken ? { "x-csrf-token": csrfToken } : {}), // Đính kèm CSRF Token
    ...options.headers,
  };

  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
    credentials: "include", // ✅ Gửi nhận HttpOnly Cookie tự động
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Lỗi hệ thống (Mã lỗi: ${res.status})`);
  }

  return data;
}
