// Khai báo biến toàn cục '_socketLib' dùng làm bộ nhớ đệm lưu trữ thư viện Socket.IO Client sau khi được tải về
let _socketLib = null;

// Khai báo biến toàn cục '_socket' dùng làm bộ nhớ đệm lưu trữ thực thể kết nối socket hiện hành (Singleton Pattern)
let _socket = null;

// Tự động lấy URL máy chủ Socket.IO từ biến môi trường 'VITE_SOCKET_URL', nếu trống sẽ tự lấy tên miền hiện tại của trang web (window.location.origin)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

// Định nghĩa và xuất ra hàm bất đồng bộ 'loadSocketIO' dùng để tải thư viện Socket.IO từ máy chủ CDN
export async function loadSocketIO() {
  // Nếu thư viện đã được tải từ trước và lưu trong biến cache '_socketLib'
  if (_socketLib) {
    // Trả về thư viện đã có sẵn ngay lập tức, không cần tải lại
    return _socketLib;
  }
  
  // Trả về một Promise để quản lý luồng tải script động bất đồng bộ
  return new Promise((resolve, reject) => {
    // Kiểm tra xem đối tượng 'io' của Socket.IO đã tồn tại sẵn trong đối tượng window toàn cục chưa
    if (window.io) {
      // Gán thư viện vào biến bộ nhớ đệm '_socketLib'
      _socketLib = window.io;
      
      // Hoàn thành Promise và trả về thư viện
      resolve(_socketLib);
      return;
    }
    
    // Tạo động một phần tử thẻ HTML '<script>' của trình duyệt
    const s = document.createElement("script");
    
    // Thiết lập đường dẫn nguồn tải thư viện Socket.IO Client từ địa chỉ CDN tin cậy (phiên bản 4.7.5)
    s.src = "https://cdn.socket.io/4.7.5/socket.io.min.js";
    
    // Lắng nghe sự kiện tải thành công (onload) của thẻ script
    s.onload = () => {
      // Gán đối tượng 'window.io' vừa được tải vào biến đệm '_socketLib'
      _socketLib = window.io;
      
      // Hoàn thành Promise và trả về thư viện đã sẵn sàng
      resolve(_socketLib);
    };
    
    // Lắng nghe sự kiện lỗi (onerror) nếu không tải được tệp tin từ CDN (ví dụ mất mạng hoặc sai URL)
    s.onerror = reject;
    
    // Đính kèm thẻ script này vào phần đầu '<head>' của tài liệu HTML để trình duyệt tiến hành tải về
    document.head.appendChild(s);
  });
}

// Định nghĩa và xuất ra hàm bất đồng bộ 'getSocket' dùng để lấy thực thể kết nối socket thời gian thực
export async function getSocket() {
  // Nếu đã tồn tại kết nối socket cũ và nó vẫn đang kết nối bình thường với máy chủ
  if (_socket?.connected) {
    // Trả về kết nối hiện có ngay lập tức (tránh tạo nhiều kết nối dư thừa)
    return _socket;
  }

  // Chờ tải thư viện Socket.IO Client thông qua hàm loadSocketIO
  const io = await loadSocketIO();

  // Khởi tạo kết nối socket mới bằng cách gọi hàm 'io' với địa chỉ máy chủ backend 'SOCKET_URL' và đối tượng cấu hình
  _socket = io(SOCKET_URL, {
    // Cho phép gửi kèm thông tin cookie phiên làm việc (Access Token / Session) trong quá trình bắt tay kết nối (handshake)
    withCredentials: true,
    
    // Cài đặt tự động kết nối lại khi chạy xong cấu hình
    autoConnect: true,
    
    // Định nghĩa các phương thức truyền tải dữ liệu ưu tiên: dùng WebSocket trước, nếu lỗi sẽ hạ cấp xuống Polling (truy vấn định kỳ)
    transports: ["websocket", "polling"],
  });

  // Trả về thực thể kết nối socket thời gian thực vừa được thiết lập
  return _socket;
}

// Định nghĩa và xuất ra hàm 'disconnectSocket' dùng để đóng kết nối socket hiện tại
export function disconnectSocket() {
  // Thực hiện ngắt kết nối với máy chủ nếu kết nối socket đang tồn tại
  _socket?.disconnect();
  
  // Đặt lại biến thực thể kết nối '_socket' về null để chuẩn bị cho lần kết nối tiếp theo
  _socket = null;
}
