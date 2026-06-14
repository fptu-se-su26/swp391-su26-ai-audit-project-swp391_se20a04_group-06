// Định nghĩa hàm getCookie nhận tham số 'name' là tên của cookie cần tìm kiếm
const getCookie = (name) => {
  // Kiểm tra nếu biến 'document' chưa được định nghĩa (môi trường server-side rendering/Node.js không có DOM)
  if (typeof document === "undefined") {
    // Trả về null ngay lập tức vì không thể truy cập tài liệu HTML ở đây
    return null;
  }
  
  // Nối thêm dấu chấm phẩy trước danh sách cookies hiện có trong trình duyệt để chuẩn hóa cấu trúc chuỗi
  const value = `; ${document.cookie}`;
  
  // Phân tách chuỗi cookies thành các phần tử mảng bằng kí tự phân tách là tên cookie kèm dấu bằng (ví dụ: "; csrfToken=")
  const parts = value.split(`; ${name}=`);
  
  // Nếu mảng phân tách có độ dài bằng 2 (nghĩa là tìm thấy chính xác một cookie có tên tương ứng)
  if (parts.length === 2) {
    // Lấy phần tử cuối cùng của mảng, tiếp tục phân tách bằng dấu ";" rồi lấy phần tử đầu tiên (để lọc bỏ các cookie đằng sau) và trả về giá trị của nó
    return parts.pop().split(";").shift();
  }
  
  // Trả về null nếu không tìm thấy cookie có tên tương hợp
  return null;
};

// Khai báo biến cờ hiệu 'isRefreshing' ở trạng thái ban đầu là false (dùng để kiểm soát tiến trình gửi yêu cầu làm mới Access Token)
let isRefreshing = false;

// Khởi tạo mảng hàng đợi 'refreshSubscribers' rỗng (dùng lưu trữ các tác vụ callback của request cần tạm ngắt để chờ cấp token mới)
let refreshSubscribers = [];

// Định nghĩa hàm subscribeTokenRefresh để đẩy một hàm callback 'cb' vào hàng đợi đang chờ làm mới token
function subscribeTokenRefresh(cb) {
  // Thêm callback vào mảng danh sách người đăng ký nhận thông tin làm mới
  refreshSubscribers.push(cb);
}

// Định nghĩa hàm onRefreshed để gọi lại toàn bộ các request bị tạm giữ sau khi tiến trình refresh token hoàn thành
function onRefreshed(err) {
  // Duyệt qua từng hàm callback trong danh sách hàng đợi 'refreshSubscribers' và thực thi nó với tham số lỗi 'err' (nếu có)
  refreshSubscribers.forEach((cb) => cb(err));
  
  // Xóa sạch toàn bộ các phần tử trong danh sách hàng đợi sau khi đã chạy xong
  refreshSubscribers = [];
}

// Định nghĩa và xuất ra hàm gọi API dùng chung 'api' nhận vào 'path' (đường dẫn endpoint) và đối tượng cấu hình tùy chọn 'options'
export async function api(path, options = {}) {
  // Lấy mã thông báo CSRF Token hiện thời từ cookie của trình duyệt để phòng vệ tấn công giả mạo yêu cầu
  const csrfToken = getCookie("csrfToken");

  // Lấy dữ liệu phần thân (body) từ đối tượng options truyền vào
  let body = options.body;
  
  // Kiểm tra xem body truyền vào có phải là một đối tượng thuộc lớp FormData (sử dụng khi tải tệp tin, hình ảnh lên máy chủ) hay không
  const isFormData = body instanceof FormData;
  
  // Nếu có body, kiểu của body là đối tượng (Object) và đồng thời nó không phải là lớp FormData
  if (body && typeof body === "object" && !isFormData) {
    // Chuyển đổi đối tượng JavaScript thô thành định dạng chuỗi JSON để gửi đi trong request body
    body = JSON.stringify(body);
  }

  // Khởi tạo đối tượng lưu trữ cấu hình các Header cho yêu cầu HTTP
  const headers = {
    // Nếu là dữ liệu FormData thì không định nghĩa Content-Type (để trình duyệt tự thiết lập boundary), ngược lại đặt là 'application/json'
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    
    // Nếu tìm thấy mã thông báo CSRF token trong cookies thì tự động điền vào Header bảo mật 'x-csrf-token'
    ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
    
    // Gộp thêm toàn bộ các header tùy chỉnh khác (nếu có) được truyền trực tiếp từ tham số options
    ...options.headers,
  };

  // Khởi tạo đối tượng cấu hình cuối cùng để truyền vào hàm fetch của trình duyệt
  const config = {
    // Kế thừa toàn bộ cấu hình từ options gốc
    ...options,
    
    // Truyền phần thân body đã được chuẩn hóa
    body,
    
    // Truyền tập hợp các Header đã được thiết lập
    headers,
    
    // Cài đặt credentials là 'include' để bắt buộc trình duyệt tự động đính kèm cookie phiên (JWT) trong mọi request gửi đi
    credentials: "include",
  };

  // Thực hiện cuộc gọi HTTP bất đồng bộ đến địa chỉ endpoint backend (kết hợp chuỗi '/api' với đường dẫn tương đối 'path')
  let res = await fetch(`/api${path}`, config);

  // Xử lý kịch bản khi máy chủ phản hồi mã lỗi 401 Unauthorized (biểu thị Access Token đã hết hạn hoặc không hợp lệ)
  if (
    // Mã trạng thái phản hồi trả về từ server là 401
    res.status === 401 &&
    
    // Đảm bảo request này chưa được gắn cờ thử lại trước đó (options._isRetry) để phòng ngừa vòng lặp vô hạn
    !options._isRetry &&
    
    // Không thực hiện tự động làm mới token nếu đường dẫn hiện tại là route đăng nhập
    path !== "/auth/login" &&
    
    // Không thực hiện tự động làm mới token nếu đường dẫn hiện tại là route đăng ký tài khoản mới
    path !== "/auth/register"
  ) {
    // Nếu hiện tại chưa có luồng làm mới token nào khác đang chạy
    if (!isRefreshing) {
      // Đặt cờ hiệu isRefreshing thành true để khóa hệ thống không cho phép các request khác chạy lại tiến trình này trùng lặp
      isRefreshing = true;
      
      try {
        // Gửi yêu cầu POST đến endpoint '/auth/refresh' để yêu cầu cấp Access Token mới thông qua Refresh Token trong cookie
        const refreshRes = await fetch("/api/auth/refresh", {
          // Sử dụng phương thức POST
          method: "POST",
          
          // Đính kèm mã CSRF token nếu có để vượt qua middleware bảo mật của Backend
          headers: csrfToken ? { "x-csrf-token": csrfToken } : {},
          
          // Tiếp tục yêu cầu đính kèm cookie của trình duyệt (Refresh Token cookie)
          credentials: "include",
        });

        // Nếu máy chủ xác nhận refresh thành công và phản hồi mã trạng thái ok (200 - 299)
        if (refreshRes.ok) {
          // Đặt lại cờ isRefreshing về false (hoàn tất)
          isRefreshing = false;
          
          // Giải phóng hàng đợi: Chạy lại toàn bộ các request đang chờ trong queue bằng cách truyền tham số lỗi là null
          onRefreshed(null);
        } else {
          // Nếu làm mới token thất bại ở mức logic backend (ví dụ: Refresh Token hết hạn hoặc bị blacklist)
          isRefreshing = false;
          
          // Thông báo lỗi phiên làm việc hết hạn cho toàn bộ các request đang nằm trong hàng đợi
          onRefreshed(
            new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."),
          );

          // Ném ra ngoại lệ lỗi thông báo người dùng hết hạn phiên làm việc
          throw new Error(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          );
        }
      } catch (err) {
        // Nhảy vào đây nếu tiến trình gọi API refresh bị lỗi mạng hoặc lỗi hệ thống khác
        isRefreshing = false;
        
        // Phát tín hiệu lỗi tương ứng để hủy bỏ các request đang xếp hàng chờ
        onRefreshed(err);
        
        // Ném lỗi ra ngoài cho hàm gọi xử lý tiếp
        throw err;
      }
    }

    // Đối với các request được gọi song song hoặc trong lúc luồng làm mới token đang chạy:
    // Tạm giữ request đó lại, trả về một Promise và đưa tác vụ này vào hàng đợi chờ đợi giải quyết
    return new Promise((resolve, reject) => {
      // Đăng ký tác vụ thực thi sau khi hoàn thành refresh token
      subscribeTokenRefresh(async (err) => {
        // Nếu quá trình refresh trước đó báo lỗi
        if (err) {
          // Từ chối Promise và ném ra lỗi
          reject(err);
          return;
        }
        
        // Lấy lại mã CSRF token mới từ cookie (phòng hờ backend đã tạo và gửi về mã CSRF mới sau khi refresh)
        const updatedCsrf = getCookie("csrfToken");
        
        // Nếu có CSRF token mới cập nhật và request hiện tại không phải dạng tải file FormData
        if (updatedCsrf && !isFormData) {
          // Cập nhật lại giá trị header bảo mật 'x-csrf-token' tương ứng
          config.headers["x-csrf-token"] = updatedCsrf;
        }
        
        try {
          // Chạy lại cuộc gọi API ban đầu, đính kèm thêm cờ _isRetry: true để đảm bảo không lặp vô hạn nếu tiếp tục lỗi 401
          resolve(await api(path, { ...options, _isRetry: true }));
        } catch (e) {
          // Bắt và từ chối Promise nếu yêu cầu thử lại thất bại
          reject(e);
        }
      });
    });
  }

  // Chuyển đổi luồng dữ liệu trả về từ máy chủ sang định dạng JSON, nếu parse lỗi thì trả về một đối tượng trống
  const data = await res.json().catch(() => ({}));

  // Nếu kết quả trả về từ máy chủ báo lỗi (status code nằm ngoài dải 200 - 299)
  if (!res.ok) {
    // Ném ra đối tượng lỗi chứa thông điệp lỗi trả về từ Backend hoặc hiển thị mã lỗi HTTP thô
    throw new Error(data.message || `Lỗi hệ thống (Mã lỗi: ${res.status})`);
  }

  // Trả về dữ liệu sạch đã chuyển đổi JSON để các component React nhận và sử dụng
  return data;
}
