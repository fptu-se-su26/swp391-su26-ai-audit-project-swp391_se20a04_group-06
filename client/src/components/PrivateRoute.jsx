// Import component Navigate từ thư viện react-router-dom để thực hiện chuyển hướng trang
import { Navigate } from "react-router-dom";
// Import hook useAuth từ AuthContext để lấy thông tin tài khoản người dùng đang đăng nhập
import { useAuth } from "../context/AuthContext";

/**
 * PrivateRoute — chỉ cho phép user đã đăng nhập
 *
 * @example
 *   <Route path="/dashboard" element={
 *     <PrivateRoute><DashboardPage /></PrivateRoute>
 *   } />
 */
// Định nghĩa component PrivateRoute để bảo vệ route chỉ dành cho người dùng đã đăng nhập, nhận vào children và đường dẫn redirect mặc định
export function PrivateRoute({ children, redirectTo = "/dang-nhap" }) {
  // Lấy đối tượng user và trạng thái loading từ hook useAuth
  const { user, loading } = useAuth();

  // Chờ session restore trước khi quyết định redirect
  // Nếu hệ thống đang tải thông tin xác thực, trả về null để trì hoãn việc render giao diện
  if (loading) return null;

  // Nếu chưa đăng nhập (user là null/undefined), chuyển hướng người dùng đến trang được cấu hình (mặc định là đăng nhập)
  if (!user) return <Navigate to={redirectTo} replace />;

  // Nếu đã đăng nhập thành công, render các component con được bọc bên trong
  return children;
}

/**
 * AdminRoute — chỉ cho phép user có role "Admin"
 *
 * @example
 *   <Route path="/admin" element={
 *     <AdminRoute><AdminPage /></AdminRoute>
 *   } />
 */
// Định nghĩa component AdminRoute chỉ cho phép người quản trị (Admin) truy cập
export function AdminRoute({ children }) {
  // Lấy thông tin user và trạng thái loading từ hook useAuth
  const { user, loading } = useAuth();

  // Nếu hệ thống đang tải thông tin xác thực, trả về null để tạm ngưng hiển thị giao diện
  if (loading) return null;

  // Nếu chưa đăng nhập hoặc có đăng nhập nhưng vai trò (role) không phải là "Admin"
  if (!user || user.role !== "Admin") {
    // Chuyển hướng người dùng về trang đăng nhập và thay thế lịch sử trình duyệt để không thể quay lại trang trước bằng nút back
    return <Navigate to="/dang-nhap" replace />;
  }

  // Nếu là tài khoản Admin hợp lệ, render các component con được bọc bên trong
  return children;
}

/**
 * GuestRoute — chỉ cho phép user CHƯA đăng nhập (vd: trang login)
 *
 * @example
 *   <Route path="/dang-nhap" element={
 *     <GuestRoute><AuthPage /></GuestRoute>
 *   } />
 */
// Định nghĩa component GuestRoute để chuyển hướng người dùng đã đăng nhập ra khỏi trang dành riêng cho khách (như login/register)
export function GuestRoute({ children, redirectTo = "/" }) {
  // Lấy thông tin user và trạng thái loading từ hook useAuth
  const { user, loading } = useAuth();

  // Nếu hệ thống đang tải thông tin xác thực, trả về null để tạm ngưng hiển thị giao diện
  if (loading) return null;

  // Nếu người dùng đã đăng nhập rồi, chuyển hướng họ về trang đích (mặc định là trang chủ)
  if (user) return <Navigate to={redirectTo} replace />;

  // Nếu chưa đăng nhập, render các component con (như form đăng nhập/đăng ký)
  return children;
}
