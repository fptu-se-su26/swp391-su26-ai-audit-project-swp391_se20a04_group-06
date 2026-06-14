/**
 * App.jsx — Trang cấu hình định tuyến (Routing) chính của ứng dụng Client.
 * Tích hợp cơ chế tải trễ (Code-splitting), bảo vệ Route, đồng bộ thông báo chưa đọc thời gian thực
 * qua Socket.io và hiển thị ChatBox nổi toàn cục.
 */

// Nhập thư viện React và các Hook thiết yếu: useState quản lý state, useEffect xử lý side-effect, Suspense bao bọc component tải trễ, lazy nạp động component
import React, { useState, useEffect, Suspense, lazy } from "react";
// Nhập các thành phần điều hướng: BrowserRouter làm bộ bao định tuyến, Routes chứa danh sách các Route, Route định nghĩa đường dẫn, Navigate chuyển hướng, useParams lấy tham số URL
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
// Nhập Context Provider quản lý trạng thái đăng nhập và thông tin xác thực toàn cục
import { AuthProvider } from "./context/AuthProvider";
// Nhập Custom Hook useAuth để truy cập thông tin người dùng và hàm đăng xuất từ AuthContext
import { useAuth } from "./context/AuthContext";
// Nhập ToastProvider để hiển thị các thông báo Toast popup nổi nhanh trên màn hình
import { ToastProvider } from "./context/ToastProvider";
// Nhập VideoCallProvider quản lý kết nối và trạng thái cuộc gọi video trực tuyến giữa người dùng
import { VideoCallProvider } from "./context/VideoCallProvider";
// Nhập các Route bảo vệ: PrivateRoute (cần đăng nhập), AdminRoute (chỉ Admin), GuestRoute (chỉ khách chưa đăng nhập)
import {
  PrivateRoute,
  AdminRoute,
  GuestRoute,
} from "./components/PrivateRoute";
// Nhập Custom Hook useApiFetch chuyên dùng gọi API lấy dữ liệu và theo dõi trạng thái loading
import { useApiFetch } from "./hooks/useApiFetch";
// Nhập Navbar - thanh điều hướng đầu trang
import { Navbar } from "./layout/Navbar";
// Nhập Footer - chân trang hiển thị bản quyền và liên kết
import { Footer } from "./layout/Footer";
// Nhập ChatBox - hộp thoại chat nổi trao đổi trực tiếp giữa người mua và người bán
import { ChatBox } from "./components/ChatBox";
// Nhập AIChatbot - khung chat trợ lý ảo AI hỗ trợ tư vấn hải sản
import { AIChatbot } from "./components/AIChatbot";
// Nhập ErrorBoundary bảo vệ ứng dụng, bắt lỗi runtime của React để tránh sập trang
import { ErrorBoundary } from "./components/ErrorBoundary";
// Nhập Custom Hook useViewTransitionNavigate giúp chuyển trang đi kèm hoạt ảnh mượt mà
import { useViewTransitionNavigate } from "./hooks/useViewTransitionNavigate";
// Nhập hàm getSocket để lấy kết nối thời gian thực Socket.io đã được cấu hình
import { getSocket } from "./services/socket";
// Nhập API helper dùng để thực hiện các yêu cầu HTTP request đến Backend
import { api } from "./services/api";
// Nhập Hook useLocation để lấy các thuộc tính URL path hiện tại của trình duyệt
import { useLocation } from "react-router-dom";

// ── Code-splitting (Tải trễ các Page component bằng dynamic import để giảm dung lượng file bundle ban đầu) ─────────────────
// Tải trễ trang chủ HomePage
const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage })),
);
// Tải trễ trang chi tiết sản phẩm ProductDetailPage
const ProductDetailPage = lazy(() =>
  import("./pages/ProductDetailPage").then((m) => ({
    default: m.ProductDetailPage,
  })),
);
// Tải trễ trang đăng nhập/đăng ký AuthPage
const AuthPage = lazy(() =>
  import("./pages/AuthPage").then((m) => ({ default: m.AuthPage })),
);
// Tải trễ trang đăng bài sản phẩm mới PostListingPage
const PostListingPage = lazy(() =>
  import("./pages/PostListingPage").then((m) => ({
    default: m.PostListingPage,
  })),
);
// Tải trễ trang tổng quan điều khiển của người dùng DashboardPage
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
// Tải trễ trang quản trị hệ thống AdminPage dành cho Admin
const AdminPage = lazy(() =>
  import("./pages/AdminPage").then((m) => ({ default: m.AdminPage })),
);
// Tải trễ trang thông tin hồ sơ của một người bán SellerProfilePage
const SellerProfilePage = lazy(() =>
  import("./pages/SellerProfilePage").then((m) => ({
    default: m.SellerProfilePage,
  })),
);
// Tải trễ trang danh sách toàn bộ các ngư dân FishermanListPage
const FishermanListPage = lazy(() =>
  import("./pages/FishermanListPage").then((m) => ({
    default: m.FishermanListPage,
  })),
);
// Tải trễ trang cập nhật thông tin cá nhân ProfilePage
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
// Tải trễ trang danh sách tất cả sản phẩm ProductListPage
const ProductListPage = lazy(() =>
  import("./pages/ProductListPage").then((m) => ({
    default: m.ProductListPage,
  })),
);
// Tải trễ trang danh sách công thức chế biến hải sản RecipeListPage
const RecipeListPage = lazy(() =>
  import("./pages/RecipeListPage").then((m) => ({ default: m.RecipeListPage })),
);
// Tải trễ trang chi tiết công thức nấu ăn RecipeDetailPage
const RecipeDetailPage = lazy(() =>
  import("./pages/RecipeDetailPage").then((m) => ({
    default: m.RecipeDetailPage,
  })),
);
// Tải trễ trang mạng xã hội cộng đồng chia sẻ của ngư dân CommunityPage
const CommunityPage = lazy(() =>
  import("./pages/CommunityPage").then((m) => ({ default: m.CommunityPage })),
);
// Tải trễ trang quy trình và hướng dẫn mua bán GuidePage
const GuidePage = lazy(() =>
  import("./pages/GuidePage").then((m) => ({ default: m.GuidePage })),
);

// ── UI Fallback hiển thị xương khung (Skeleton) trong lúc chờ tải file Javascript của các trang ───────────────────────
function PageFallback() {
  return (
    <div
      style={{
        padding: "40px 24px",                                        // Đệm lề xung quanh trang
        display: "grid",                                             // Thiết lập bố cục lưới
        gap: 20,                                                     // Khoảng cách giữa các phần tử là 20px
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", // Tự động chia cột rộng tối thiểu 250px
        maxWidth: 1200,                                              // Chiều rộng tối đa 1200px
        margin: "0 auto",                                            // Căn giữa màn hình
      }}
    >
      {/* Khởi tạo mảng gồm 8 phần tử và lặp qua để render ra 8 khối Shimmer xám giả lập ảnh/thẻ sản phẩm */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}                                                    // Gắn thuộc tính key độc nhất cho React theo dõi
          className="skeleton-shimmer"                               // Lớp CSS tạo hiệu ứng quét sáng (Shimmer) chạy liên tục
          style={{
            height: 320,                                             // Chiều cao cố định 320px
            borderRadius: 12,                                        // Bo tròn nhẹ 12px
            border: "1px solid var(--border)",                        // Viền ngoài xám nhạt đồng bộ
          }}
        />
      ))}
    </div>
  );
}

// ── Vòng xoay nạp dữ liệu (Spinner) dùng chung cho các route wrapper trước khi lấy xong thông tin ──────────
function PageLoader({ label }) {
  return (
    <div
      style={{
        padding: "80px 24px",         // Đệm lề trên dưới rộng 80px, hai bên 24px
        textAlign: "center",          // Căn giữa dòng chữ
        color: "var(--muted)",        // Chữ màu xám mờ nhạt
        display: "flex",              // Thiết lập Flexbox
        flexDirection: "column",      // Sắp xếp các phần tử theo cột dọc
        alignItems: "center",         // Căn giữa các phần tử theo chiều ngang
        gap: 12,                      // Khoảng cách dọc giữa icon và chữ là 12px
      }}
    >
      <div
        className="skeleton-shimmer"  // Khối vòng tròn loading giả lập spinner
        style={{ width: 40, height: 40, borderRadius: "50%" }} // Bo tròn 50% tạo hình tròn, đường kính 40px
      />
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span> {/* Nhãn văn bản thông báo trạng thái tải */}
    </div>
  );
}

// ── Các Route Wrappers chuyên lấy dữ liệu qua API trước khi nạp trang tương ứng ──────────────────────
// Khung bọc tải dữ liệu chi tiết của sản phẩm dựa trên ID sản phẩm từ URL
function ProductDetailPageRoute() {
  const { productId } = useParams(); // Lấy ID sản phẩm từ URL path param
  // Gọi hook API để lấy thông tin sản phẩm dựa trên ID, tự nạp lại khi ID thay đổi
  const { data: product, loading } = useApiFetch(`/products/${productId}`, [
    productId,
  ]);
  const { user } = useAuth(); // Lấy thông tin người dùng hiện tại từ Context

  if (loading) return <PageLoader label="ĐANG TẢI THÔNG TIN SẢN PHẨM…" />; // Nếu đang tải, trả về giao diện vòng xoay
  if (!product) return <Navigate to="/" replace />; // Nếu sản phẩm không tồn tại, chuyển hướng về trang chủ
  return <ProductDetailPage product={product} user={user} />; // Trả về trang chi tiết sản phẩm khi tải xong dữ liệu
}

// Khung bọc tải dữ liệu hồ sơ công khai của một người bán dựa trên ID từ URL
function SellerProfilePageRoute() {
  const { sellerId } = useParams(); // Lấy mã ID người bán từ tham số trên URL
  // Gọi hook API nạp dữ liệu người dùng dựa trên ID người bán, tự nạp lại khi sellerId thay đổi
  const { data: seller, loading } = useApiFetch(`/users/${sellerId}`, [
    sellerId,
  ]);
  const { user } = useAuth(); // Lấy thông tin tài khoản đang đăng nhập hiện tại

  if (loading) return <PageLoader label="ĐANG TẢI HỒ SƠ NGƯ DÂN…" />; // Trả về spinner nếu API đang xử lý
  if (!seller) return <Navigate to="/" replace />; // Nếu không tìm thấy người bán, chuyển hướng về trang chủ
  return <SellerProfilePage seller={seller} user={user} />; // Trả về trang hồ sơ khi tải xong dữ liệu
}

// ── AppShell — Lớp vỏ ngoài cùng chứa toàn bộ bố cục trang (Navbar, Footer, Routes, ChatBox) ──────────────────
function AppShell() {
  const { user, logout } = useAuth();           // Lấy thông tin user hiện tại và hàm logout đăng xuất
  const navigate = useViewTransitionNavigate(); // Hook chuyển trang tùy chỉnh tích hợp View Transitions API
  const location = useLocation();               // Lấy thông tin đối tượng vị trí URL hiện tại
  const [unread, setUnread] = useState(0);       // State lưu trữ số lượng tin nhắn chưa đọc toàn cục
  const [globalChat, setGlobalChat] = useState(null); // State lưu trữ cấu hình hộp thoại chat nổi đang hoạt động (null là đóng)
  const activeChatRef = React.useRef(null);     // Ref tham chiếu lưu thông tin chat nổi hiện tại để tránh closure trong socket listener
  
  // Lưu trữ đối tượng globalChat vào Ref tham chiếu mỗi khi state globalChat thay đổi
  useEffect(() => {
    activeChatRef.current = globalChat;         // Cập nhật giá trị ref trực tiếp không gây re-render
  }, [globalChat]);

  // Lắng nghe sự kiện tùy chỉnh phát từ các trang con yêu cầu mở hộp chat nổi
  useEffect(() => {
    // Hàm xử lý mở chat nổi nhận thông tin phòng chat từ sự kiện CustomEvent detail
    const handleOpenGlobalChat = (e) => {
      if (e.detail) {
        setGlobalChat(e.detail);                // Gán thông tin phòng chat và đối tác vào state để hiển thị ChatBox
      }
    };
    // Đăng ký lắng nghe sự kiện "open-global-chat" trên đối tượng window toàn cục
    window.addEventListener("open-global-chat", handleOpenGlobalChat);
    return () => {
      // Hủy bỏ lắng nghe sự kiện khi component bị dọn dẹp để tránh rò rỉ bộ nhớ
      window.removeEventListener("open-global-chat", handleOpenGlobalChat);
    };
  }, []);

  // Xử lý tự động cuộn trang về đỉnh đầu trang khi chuyển tuyến đường dẫn mới
  useEffect(() => {
    // Lấy tọa độ cuộn trước đó của trang danh sách sản phẩm nếu có lưu trong bộ nhớ tạm
    const savedScroll = sessionStorage.getItem("productlistpage_scroll_y");
    // Nếu người dùng đang truy cập lại trang /san-pham và có tọa độ cũ, bỏ qua không cuộn lên đỉnh để giữ vị trí cũ
    if (location.pathname === "/san-pham" && savedScroll) {
      return;
    }

    // Cuộn thanh trượt trình duyệt về vị trí x=0, y=0 ngay lập tức không tạo hiệu ứng trượt chậm
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);                      // Lắng nghe sự thay đổi của tuyến đường dẫn trình duyệt

  // Thiết lập vòng lặp Polling gửi yêu cầu lấy số lượng tin nhắn chưa đọc định kỳ
  useEffect(() => {
    // Nếu chưa đăng nhập tài khoản, xóa số tin nhắn chưa đọc về 0 ngay lập tức
    if (!user) {
      Promise.resolve().then(() => setUnread(0)); // Đưa state setUnread về 0 trong microtask tiếp theo
      return;
    }
    
    // Khai báo hàm lấy số lượng tin chưa đọc từ server backend
    const fetchUnread = () =>
      api("/messages/unread-count")             // Gửi request GET đến endpoint lấy tổng số tin nhắn chưa đọc
        .then((d) => setUnread(d.count))         // Cập nhật số lượng đếm được vào state unread
        .catch(() => {});                       // Bỏ qua lỗi nếu mạng bị gián đoạn

    fetchUnread();                              // Gọi hàm nạp số lượng chưa đọc lần đầu ngay khi nạp trang

    // Đăng ký sự kiện đồng bộ tùy chỉnh cập nhật lại huy hiệu chưa đọc tức thì khi có hoạt động đọc tin nhắn
    const handleSync = () => fetchUnread();
    window.addEventListener("sync-unread", handleSync);

    const id = setInterval(fetchUnread, 60_000); // Lên lịch chạy định kỳ kiểm tra tin nhắn mới mỗi 60 giây (1 phút)
    return () => {
      clearInterval(id);                        // Hủy bỏ lịch định kỳ khi người dùng đăng xuất hoặc chuyển trang
      window.removeEventListener("sync-unread", handleSync); // Gỡ bỏ sự kiện đồng bộ
    };
  }, [user]);                                   // Re-run hook nếu trạng thái thông tin user thay đổi

  // Lắng nghe kết nối thời gian thực bằng Socket.io để cập nhật số lượng tin chưa đọc tức thì
  useEffect(() => {
    if (!user) return;                          // Nếu không có user đăng nhập, không khởi tạo kết nối
    let active = true;                          // Biến cờ đánh dấu trạng thái hoạt động của hook
    let cleanupSocketListener = null;           // Hàm lưu trữ dọn dẹp bộ lắng nghe sự kiện của socket

    getSocket()
      .then((socket) => {
        if (!active) return;                    // Nếu hook đã bị hủy trước khi socket kết nối xong, dừng lại
        // Khai báo hàm xử lý khi có thông báo (notification) gửi từ Server
        const handler = (data) => {
          if (data.type === "new_message") {    // Kiểm tra nếu thông báo thuộc loại có tin nhắn mới đến
            const activeChat = activeChatRef.current; // Lấy thông tin phòng chat đang mở nổi trên màn hình hiện tại

            // Nếu người dùng đang mở chat trực tiếp đối thoại với chính sản phẩm này, bỏ qua không tăng số chưa đọc vì đã xem trực tiếp
            if (activeChat && activeChat.productId === data.productId) {
              return;
            }

            // Tăng số lượng tin chưa đọc lên thêm 1 đơn vị
            setUnread((prev) => prev + 1);
          }
        };
        socket.on("notification", handler);      // Đăng ký lắng nghe sự kiện "notification" trên Socket.io client
        cleanupSocketListener = () => socket.off("notification", handler); // Định nghĩa hàm gỡ bỏ bộ lắng nghe
      })
      .catch(() => {});

    return () => {
      active = false;                           // Tắt cờ hoạt động
      cleanupSocketListener?.();                // Gỡ bỏ sự kiện lắng nghe của socket
    };
  }, [user]);

  // Hàm xử lý hành động đăng xuất của người dùng
  const handleLogout = async () => {
    await logout();                             // Gọi hàm logout trong AuthContext để dọn dẹp localStorage và cookie
    navigate("/");                              // Chuyển hướng người dùng về trang chủ
  };

  // Kiểm tra xem trang hiện tại có phải là trang Đăng nhập hay không
  const isAuthPage = location.pathname === "/dang-nhap";

  return (
    <div
      style={{
        fontFamily: "var(--font)",               // Sử dụng phông chữ cấu hình toàn cục từ CSS variables
        background: "transparent",               // Nền trong suốt để hiển thị hình nền gradient của body
        minHeight: "100vh",                      // Chiều cao tối thiểu chiếm toàn bộ màn hình
      }}
    >
      {/* Nếu không ở trang AuthPage thì hiển thị thanh định hướng Navbar */}
      {!isAuthPage && (
        <Navbar
          unread={unread}                       // Truyền số lượng tin nhắn chưa đọc để hiển thị huy hiệu đỏ
          onOpenGlobalChat={setGlobalChat}       // Truyền hàm mở hộp chat nổi
          onLogout={handleLogout}               // Truyền hàm xử lý đăng xuất tài khoản
        />
      )}

      {/* Sử dụng Suspense bao bọc các tuyến đường để hiển thị Skeleton Shimmer trong lúc tải Page file */}
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* ── Tuyến đường công khai (Public routes) ai cũng truy cập được ─────────────────────────── */}
          
          {/* Tuyến đường trang chủ */}
          <Route path="/" element={<HomePage />} />
          
          {/* Tuyến đường danh sách sản phẩm */}
          <Route path="/san-pham" element={<ProductListPage />} />
          
          {/* Tuyến đường chi tiết sản phẩm */}
          <Route
            path="/san-pham/:productId"
            element={<ProductDetailPageRoute />}
          />
          
          {/* Tuyến đường danh sách công thức nấu ăn */}
          <Route path="/cong-thuc" element={<RecipeListPage />} />
          
          {/* Tuyến đường chi tiết công thức nấu ăn */}
          <Route path="/cong-thuc/:id" element={<RecipeDetailPage />} />
          
          {/* Tuyến đường trang chia sẻ cộng đồng */}
          <Route path="/cong-dong" element={<CommunityPage />} />
          
          {/* Tuyến đường trang hướng dẫn quy trình mua bán */}
          <Route path="/quy-trinh" element={<GuidePage />} />

          {/* Tuyến đường trang hồ sơ công khai người bán */}
          <Route
            path="/nguoi-ban/:sellerId"
            element={<SellerProfilePageRoute />}
          />
          
          {/* Tuyến đường trang danh sách toàn bộ ngư dân */}
          <Route path="/ng-dan" element={<FishermanListPage />} />

          {/* ── Tuyến đường chỉ dành cho khách (Chuyển hướng về trang chủ nếu đã đăng nhập) ────── */}
          
          {/* Tuyến đường trang đăng nhập/đăng ký */}
          <Route
            path="/dang-nhap"
            element={
              <GuestRoute>
                <AuthPage />
              </GuestRoute>
            }
          />

          {/* ── Tuyến đường bảo vệ (Yêu cầu đăng nhập thông thường để truy cập) ─────────────────────── */}
          
          {/* Tuyến đường trang đăng bán sản phẩm mới */}
          <Route
            path="/dang-bai"
            element={
              <PrivateRoute>
                <PostListingPage />
              </PrivateRoute>
            }
          />
          
          {/* Tuyến đường trang tổng quan quản lý tài khoản của người bán */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          
          {/* Tuyến đường trang chỉnh sửa hồ sơ thông tin cá nhân */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />

          {/* ── Tuyến đường chỉ dành riêng cho Admin quản trị hệ thống ────────────────────────────── */}
          
          {/* Tuyến đường trang quản trị dành cho Admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />

          {/* Tự động chuyển hướng toàn bộ các URL không khớp khác về trang chủ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Hiển thị Footer chân trang và trợ lý ảo AI Chatbot nếu không phải ở trang đăng nhập */}
      {!isAuthPage && <Footer />}
      {!isAuthPage && <AIChatbot />}

      {/* Hộp hội thoại Chat nổi ở góc phải bên dưới màn hình khi có đối tượng globalChat */}
      {globalChat && (
        <div
          style={{
            position: "fixed",                   // Định vị cố định so với khung nhìn màn hình
            bottom: 24,                          // Cách mép dưới màn hình 24px
            right: 24,                           // Cách mép phải màn hình 24px
            width: 320,                          // Chiều rộng cố định 320px
            zIndex: 9999,                        // Đặt z-index cực lớn để đè lên trên tất cả thành phần khác
            boxShadow: "var(--shadow-xl)",       // Bóng đổ lớn tạo chiều sâu nổi
            borderRadius: 12,                    // Bo góc 12px
            overflow: "hidden",                  // Ẩn các thành phần con tràn góc bo tròn
            animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) both", // Hoạt ảnh trượt xuống mượt mà
          }}
        >
          {/* Gắn thẻ ChatBox với key kết hợp để tạo component mới hoàn toàn khi chuyển cuộc hội thoại */}
          <ChatBox
            key={`${globalChat.productId}-${globalChat.otherUserId}`}
            product={{
              id: globalChat.productId,          // Mã sản phẩm liên quan cuộc đối thoại
              name: globalChat.productName,      // Tên sản phẩm liên quan
              sellerId: globalChat.otherUserId,  // Mã ID đối tác chat
              sellerName: globalChat.otherUserName, // Tên đối tác chat
              productSellerId: globalChat.productSellerId, // Mã ID người chủ thực tế của sản phẩm
              otherUserId: globalChat.otherUserId, // Mã ID người dùng đối diện
            }}
            user={user}                          // Tài khoản của chính người đăng nhập hiện tại
            onClose={() => setGlobalChat(null)}   // Hàm callback đóng hộp chat nổi khi nhấn nút X
          />
        </div>
      )}
    </div>
  );
}

// ── Định nghĩa Component gốc App (Tích hợp tất cả các Context Provider) ───────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      {/* Lớp bắt lỗi Boundary toàn cục bảo vệ ứng dụng, hiển thị giao diện báo lỗi thân thiện thay vì màn hình trắng */}
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <VideoCallProvider>
              {/* Nạp AppShell chứa toàn bộ định tuyến và giao diện chính */}
              <AppShell />
            </VideoCallProvider>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
