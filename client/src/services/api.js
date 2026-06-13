// Hàm getCookie nhận vào tên cookie và lấy giá trị của nó từ document.cookie của trình duyệt
const getCookie = (name) => {
  // Kiểm tra nếu chạy trên môi trường Server (ví dụ SSR/NodeJS) không có đối tượng document thì trả về null
  if (typeof document === "undefined") return null;
  // Thêm dấu chấm phẩy trước danh sách cookie để chuẩn hóa quá trình cắt tách chuỗi
  const value = `; ${document.cookie}`;
  // Cắt chuỗi theo tên của cookie cần tìm (ví dụ: "; csrfToken=")
  const parts = value.split(`; ${name}=`);
  // Nếu tìm thấy chính xác một cặp tên-giá trị (chuỗi bị tách làm đôi)
  if (parts.length === 2) return parts.pop().split(";").shift(); // Lấy giá trị cookie, loại bỏ các cookie phía sau bằng cách split dấu ";"
  return null; // Trả về null nếu không tìm thấy cookie
};

// Queue Locking giúp xử lý gộp nhiều request gọi API đồng thời khi hết hạn token
let isRefreshing = false; // Biến cờ đánh dấu hệ thống đang thực hiện làm mới token (Silent Refresh) để tránh chạy trùng lặp
let refreshSubscribers = []; // Danh sách hàng đợi lưu trữ các request bị tạm giữ trong lúc đợi refresh token hoàn tất

// Hàm đăng ký một request vào hàng đợi và thực hiện callback sau khi có token mới
function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

// Hàm giải phóng hàng đợi: Chạy lại toàn bộ các request đang chờ hoặc ném ra lỗi nếu refresh thất bại
function onRefreshed(err) {
  refreshSubscribers.forEach((cb) => cb(err)); // Chạy từng callback lưu trong danh sách hàng đợi
  refreshSubscribers = []; // Làm trống danh sách hàng đợi sau khi giải quyết xong
}

// Hàm gọi API dùng chung (Wrapper) cho toàn bộ ứng dụng Client
export async function api(path, options = {}) {
  // Lấy mã CSRF Token từ Cookie trình duyệt để gửi kèm request chống tấn công CSRF
  const csrfToken = getCookie("csrfToken");

  let body = options.body;
  const isFormData = body instanceof FormData; // Kiểm tra xem body gửi lên có phải là kiểu FormData (upload ảnh/file) hay không
  // Nếu body là kiểu đối tượng (Object) bình thường và không phải FormData, chuyển đổi nó sang dạng chuỗi JSON
  if (body && typeof body === "object" && !isFormData) {
    body = JSON.stringify(body);
  }

  // Khởi tạo các headers cho HTTP Request
  const headers = {
    // Nếu là FormData thì để trình duyệt tự điền Content-Type kèm boundary, ngược lại đặt mặc định là application/json
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    // Nếu có CSRF Token thì tự động đính kèm vào HTTP Header "x-csrf-token"
    ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
    ...options.headers, // Gộp thêm bất kỳ custom headers nào truyền vào từ options
  };

  // Cấu hình đầy đủ cho hàm fetch API
  const config = {
    ...options,
    body,
    headers,
    credentials: "include", // Quan trọng: Yêu cầu đính kèm cookie (Session, Refresh Token) trong mọi request
  };

  // Thực hiện gọi HTTP Request thực tế đến Backend
  let res = await fetch(`/api${path}`, config);

  // Xử lý kịch bản lỗi 401 Unauthorized (khi Access Token hết hạn)
  if (
    res.status === 401 && // Nếu backend phản hồi mã lỗi 401 (chưa đăng nhập hoặc token hết hạn)
    !options._isRetry && // Tránh lặp vô hạn bằng cách kiểm tra đây không phải là request thử lại lần thứ hai
    path !== "/auth/login" && // Không tự động refresh nếu đây là đường dẫn login gốc
    path !== "/auth/register" // Không tự động refresh nếu đây là đường dẫn đăng ký gốc
  ) {
    // Nếu chưa có request nào khác đang chạy luồng refresh token
    if (!isRefreshing) {
      isRefreshing = true; // Bật cờ đánh dấu đang trong quá trình refresh token
      try {
        // Gửi yêu cầu POST tới endpoint làm mới token, kèm theo cookie Refresh Token tự động gửi đi qua credentials: "include"
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: csrfToken ? { "x-csrf-token": csrfToken } : {},
          credentials: "include",
        });

        // Nếu refresh thành công (Backend sinh mới Access Token và lưu đè vào cookie)
        if (refreshRes.ok) {
          isRefreshing = false; // Tắt cờ refreshing
          onRefreshed(null); // Giải phóng các request đang chờ bằng cách báo không có lỗi (null)
        } else {
          isRefreshing = false; // Tắt cờ refreshing
          // Giải phóng hàng đợi và báo lỗi phiên đăng nhập đã hết hạn
          onRefreshed(
            new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."),
          );

          throw new Error(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          );
        }
      } catch (err) {
        isRefreshing = false; // Đảm bảo reset cờ refreshing kể cả khi bị lỗi mạng/lỗi hệ thống
        onRefreshed(err); // Thông báo lỗi tới toàn bộ các request đang chờ
        throw err;
      }
    }

    // Đối với các request gọi đồng thời (trong khi cờ isRefreshing đang bật):
    // Tạm giữ chúng lại dưới dạng một Promise và đưa vào hàng đợi chờ refresh xong
    return new Promise((resolve, reject) => {
      subscribeTokenRefresh(async (err) => {
        if (err) {
          reject(err); // Ném lỗi nếu quá trình refresh token thất bại
          return;
        }
        // Lấy lại CSRF token mới từ cookie phòng trường hợp backend đã sinh mã CSRF mới
        const updatedCsrf = getCookie("csrfToken");
        if (updatedCsrf && !isFormData) {
          config.headers["x-csrf-token"] = updatedCsrf; // Cập nhật lại header CSRF Token
        }
        try {
          // Thực hiện gọi lại chính request ban đầu kèm cờ đánh dấu `_isRetry: true` để tránh lặp vô hạn
          resolve(await api(path, { ...options, _isRetry: true }));
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  // Phân tích dữ liệu phản hồi dạng JSON, nếu rỗng thì trả về object trống
  const data = await res.json().catch(() => ({}));

  // Nếu HTTP Status Code không nằm trong khoảng thành công (200 - 299)
  if (!res.ok) {
    // Ném lỗi kèm thông điệp chi tiết từ Backend hoặc thông báo lỗi mặc định
    throw new Error(data.message || `Lỗi hệ thống (Mã lỗi: ${res.status})`);
  }

  return data; // Trả về dữ liệu sạch dạng JSON cho component/page xử lý tiếp
}
