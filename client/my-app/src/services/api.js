const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

// Queue Locking giúp xử lý gộp nhiều request gọi API đồng thời khi hết hạn token
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(err) {
  refreshSubscribers.forEach((cb) => cb(err));
  refreshSubscribers = [];
}

export async function api(path, options = {}) {
  const csrfToken = getCookie("csrfToken");

  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
    credentials: "include",
  };

  let res = await fetch(`/api${path}`, config);

  // Xử lý khi Access Token hết hạn (401)
  if (
    res.status === 401 &&
    !options._isRetry &&
    path !== "/auth/me" &&
    path !== "/auth/login" &&
    path !== "/auth/register"
  ) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        // Thực hiện silent refresh token thông qua cookie HttpOnly
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: csrfToken ? { "x-csrf-token": csrfToken } : {},
          credentials: "include",
        });

        if (refreshRes.ok) {
          isRefreshing = false;
          onRefreshed(null);
        } else {
          isRefreshing = false;
          onRefreshed(new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."));
          // Không thể gia hạn phiên -> Yêu cầu đăng nhập lại
          window.location.href = "/dang-nhap";
          throw new Error(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          );
        }
      } catch (err) {
        isRefreshing = false;
        onRefreshed(err);
        throw err;
      }
    }

    // Cho các request gọi song song xếp hàng chờ refresh hoàn tất rồi thực thi lại
    return new Promise((resolve, reject) => {
      subscribeTokenRefresh(async (err) => {
        if (err) {
          reject(err);
          return;
        }
        // Cập nhật lại csrf token mới nếu có thay đổi
        const updatedCsrf = getCookie("csrfToken");
        if (updatedCsrf && !isFormData) {
          config.headers["x-csrf-token"] = updatedCsrf;
        }
        try {
          resolve(await api(path, { ...options, _isRetry: true }));
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Lỗi hệ thống (Mã lỗi: ${res.status})`);
  }

  return data;
}
