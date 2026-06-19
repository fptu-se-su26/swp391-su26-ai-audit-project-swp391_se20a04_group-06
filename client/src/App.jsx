/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                          App.jsx — File Trung Tâm                       ║
 * ║                                                                          ║
 * ║  Đây là file QUAN TRỌNG NHẤT của ứng dụng React. Hãy hình dung nó như  ║
 * ║  "bảng điều khiển trung tâm" — nơi quyết định:                         ║
 * ║    • Người dùng truy cập URL nào thì thấy trang nào                     ║
 * ║    • Ai được phép vào trang nào (đăng nhập? admin?)                     ║
 * ║    • Các tính năng dùng chung: Navbar, Footer, Chat, Chatbot AI         ║
 * ║    • Cập nhật số tin nhắn chưa đọc theo thời gian thực                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHẦN 1: IMPORT — Nhập các công cụ và thành phần cần thiết
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * [React Core] — Bộ công cụ lõi của React
 *
 * React        : Thư viện chính để xây dựng giao diện người dùng (UI)
 * useState     : Hook lưu trữ dữ liệu thay đổi trong component
 *                VD: useState(0) → lưu số tin nhắn chưa đọc, khi thay đổi UI tự cập nhật
 * useEffect    : Hook chạy code phụ (gọi API, đăng ký sự kiện...) sau khi render
 *                VD: useEffect(() => fetchData(), [user]) → gọi API khi user thay đổi
 * Suspense     : Component "tấm bình phong" — hiển thị màn hình chờ (fallback)
 *                trong khi đang tải file JavaScript của trang khác
 * lazy         : Hàm giúp tải trang "lười biếng" — chỉ tải khi người dùng CẦN
 *                thay vì tải tất cả ngay từ đầu → trang web load nhanh hơn
 */
import React, { useState, useEffect, Suspense, lazy } from "react";

/**
 * [React Router DOM] — Thư viện điều hướng trang (Routing)
 *
 * Trong ứng dụng web truyền thống (không dùng React), mỗi lần click link
 * là trình duyệt tải lại trang từ server. React Router giúp chuyển trang
 * KHÔNG cần tải lại → trải nghiệm mượt như ứng dụng mobile.
 *
 * BrowserRouter : Bộ bao ngoài cùng. Cung cấp khả năng định tuyến cho toàn bộ app.
 *                 Phải bọc ở ngoài cùng, trước tất cả các Route khác.
 * Routes        : Container chứa danh sách các Route. Chỉ render Route KHỚP đầu tiên.
 * Route         : Định nghĩa một cặp (đường dẫn → component hiển thị)
 *                 VD: <Route path="/san-pham" element={<ProductListPage />} />
 * Navigate      : Component để chuyển hướng người dùng sang URL khác
 *                 VD: <Navigate to="/" /> → đẩy người dùng về trang chủ
 * useParams     : Hook lấy tham số động từ URL
 *                 VD: URL là /san-pham/123 → useParams() trả về { productId: "123" }
 */
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";

/**
 * [AuthProvider] — Context Provider quản lý trạng thái đăng nhập toàn cục
 *
 * "Context" trong React giống như một "biến toàn cục" mà MỌI component
 * con đều có thể đọc được, không cần truyền qua props từng cấp.
 *
 * AuthProvider bọc toàn bộ app, cung cấp:
 *   - Thông tin user đang đăng nhập (tên, vai trò, token...)
 *   - Hàm login / logout
 * Bất kỳ component nào trong app đều có thể dùng useAuth() để lấy thông tin này.
 */
import { AuthProvider } from "./context/AuthProvider";

/**
 * [useAuth] — Custom Hook lấy dữ liệu từ AuthContext
 *
 * Custom Hook là hàm JavaScript bắt đầu bằng "use" và sử dụng các Hook có sẵn
 * của React bên trong. Thay vì viết lại logic ở mỗi component, ta gói vào Hook.
 *
 * Dùng: const { user, logout } = useAuth();
 * → user: object chứa thông tin người dùng, null nếu chưa đăng nhập
 * → logout: hàm gọi để đăng xuất
 */
import { useAuth } from "./context/AuthContext";

/**
 * [ToastProvider] — Context hiển thị thông báo "pop-up" nhanh (Toast notification)
 *
 * Toast là những hộp thông báo nhỏ xuất hiện tạm thời ở góc màn hình.
 * VD: "Đăng nhập thành công!", "Sản phẩm đã được thêm vào giỏ hàng!"
 * Cần Provider bọc ngoài để mọi trang đều có thể kích hoạt toast.
 */
import { ToastProvider } from "./context/ToastProvider";

/**
 * [VideoCallProvider] — Context quản lý trạng thái cuộc gọi video
 *
 * Tương tự AuthProvider, nhưng chuyên quản lý:
 *   - Trạng thái cuộc gọi (đang gọi / đang đổ chuông / kết thúc)
 *   - Kết nối WebRTC giữa người mua và người bán
 */
import { VideoCallProvider } from "./context/VideoCallProvider";

/**
 * [Route Guards] — Các "bảo vệ" kiểm soát quyền truy cập trang
 *
 * Hãy nghĩ như người bảo vệ cổng:
 *
 * PrivateRoute : Kiểm tra đã đăng nhập chưa?
 *               Chưa → chuyển về trang /dang-nhap
 *               Rồi  → cho vào xem trang
 *
 * AdminRoute   : Kiểm tra có phải Admin không?
 *               Không → chuyển về trang chủ
 *               Có    → cho vào trang /admin
 *
 * GuestRoute   : Chỉ cho người CHƯA đăng nhập vào
 *               Đã đăng nhập → chuyển về trang chủ (tránh vào lại trang login)
 */
import {
  PrivateRoute,
  AdminRoute,
  GuestRoute,
} from "./components/PrivateRoute";

/**
 * [useApiFetch] — Custom Hook chuyên dùng để gọi API
 *
 * Thay vì viết logic gọi API, xử lý loading, xử lý lỗi ở mỗi component,
 * useApiFetch đóng gói tất cả vào một Hook tái sử dụng.
 *
 * Dùng: const { data, loading } = useApiFetch("/products/123", [productId]);
 * → data: dữ liệu nhận được từ server (null nếu đang tải hoặc lỗi)
 * → loading: true khi đang chờ phản hồi, false khi xong
 * → Tham số thứ 2 [productId] là dependency: khi productId thay đổi → tự động gọi lại API
 */
import { useApiFetch } from "./hooks/useApiFetch";

/**
 * [Layout Components] — Các thành phần giao diện dùng chung
 *
 * Navbar  : Thanh điều hướng ở đỉnh trang (logo, menu, nút đăng nhập...)
 * Footer  : Chân trang (bản quyền, liên kết...)
 * Được tách riêng để tái sử dụng ở mọi trang, chỉ cần render một lần ở AppShell.
 */
import { Navbar } from "./layout/Navbar";
import { Footer } from "./layout/Footer";

/**
 * [Feature Components] — Các tính năng hiển thị toàn cục
 *
 * ChatBox    : Hộp chat nổi (floating) ở góc phải màn hình
 *              Cho phép người mua và người bán nhắn tin trực tiếp về một sản phẩm
 *
 * AIChatbot  : Trợ lý ảo AI tư vấn hải sản
 *              Được hiển thị ở mọi trang (trừ trang đăng nhập)
 */
import { ChatBox } from "./components/ChatBox";
import { AIChatbot } from "./components/AIChatbot";

/**
 * [ErrorBoundary] — Lớp bảo vệ bắt lỗi runtime
 *
 * Trong React, nếu một component bị lỗi JS runtime (VD: đọc thuộc tính của null),
 * toàn bộ ứng dụng sẽ crash và hiển thị màn hình trắng.
 * ErrorBoundary ngăn chặn điều đó: nếu có lỗi trong component con,
 * nó hiển thị giao diện báo lỗi thân thiện thay vì crash toàn app.
 *
 * Lưu ý: ErrorBoundary phải là Class Component (không thể dùng với Function Component).
 */
import { ErrorBoundary } from "./components/ErrorBoundary";

/**
 * [useViewTransitionNavigate] — Custom Hook chuyển trang có hoạt ảnh
 *
 * Mở rộng từ useNavigate() của React Router, thêm View Transitions API
 * (API mới của trình duyệt) để tạo hiệu ứng chuyển trang mượt mà (fade, slide...).
 */
import { useViewTransitionNavigate } from "./hooks/useViewTransitionNavigate";

/**
 * [getSocket] — Hàm lấy kết nối Socket.io
 *
 * Socket.io là thư viện cho phép giao tiếp HAI CHIỀU, THỜI GIAN THỰC
 * giữa client (trình duyệt) và server.
 *
 * Khác với HTTP thông thường (client hỏi → server trả lời):
 * Socket.io cho phép SERVER CHỦ ĐỘNG gửi dữ liệu đến client bất cứ lúc nào.
 * VD: Có tin nhắn mới → server đẩy thông báo → icon badge tự tăng lên ngay lập tức.
 *
 * getSocket() trả về Promise<Socket> — kết nối singleton đã được cấu hình sẵn.
 * Singleton = chỉ tạo một kết nối duy nhất, tái sử dụng xuyên suốt ứng dụng.
 */
import { getSocket } from "./services/socket";

/**
 * [api] — Helper gọi HTTP request đến Backend
 *
 * Đây là hàm tiện ích wrapper quanh fetch() hoặc axios,
 * đã cấu hình sẵn: base URL, xác thực token, xử lý lỗi chung...
 * VD: api("/messages/unread-count") → GET /api/messages/unread-count
 */
import { api } from "./services/api";

/**
 * [useLocation] — Hook lấy thông tin URL hiện tại
 *
 * Trả về đối tượng location với các thuộc tính:
 *   - pathname  : phần đường dẫn → VD: "/san-pham/123"
 *   - search    : query string    → VD: "?page=2&sort=price"
 *   - hash      : phần neo        → VD: "#section-reviews"
 * Được dùng để kiểm tra "đang ở trang nào" (VD: ẩn Navbar trên trang đăng nhập).
 */
import { useLocation } from "react-router-dom";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHẦN 2: CODE-SPLITTING — Tải trang theo yêu cầu (Lazy Loading)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * VẤN ĐỀ: Nếu import tất cả trang cùng lúc ở đầu file:
 *   import { HomePage } from "./pages/HomePage";
 *   import { ProductDetailPage } from "./pages/ProductDetailPage";
 *   ...10+ trang...
 *
 * → Trình duyệt phải tải TẤT CẢ code của 10+ trang ngay từ đầu
 * → File bundle.js khổng lồ → trang web load rất chậm lần đầu truy cập
 *
 * GIẢI PHÁP: Code Splitting với React.lazy()
 *   const HomePage = lazy(() => import("./pages/HomePage"));
 *
 * → Trình duyệt chỉ tải file HomePage.js KHI người dùng thực sự truy cập "/"
 * → Lần đầu load trang chỉ tải code cần thiết → nhanh hơn đáng kể
 *
 * Cú pháp .then((m) => ({ default: m.HomePage })):
 * → Vì HomePage được export theo cách: export const HomePage = ...
 *   (named export, không phải default export)
 * → Cần "ánh xạ lại" thành default export để lazy() hiểu được
 */

// Trang chủ (/)
const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage })),
);

// Trang chi tiết sản phẩm (/san-pham/:id)
const ProductDetailPage = lazy(() =>
  import("./pages/ProductDetailPage").then((m) => ({
    default: m.ProductDetailPage,
  })),
);

// Trang đăng nhập / đăng ký (/dang-nhap)
const AuthPage = lazy(() =>
  import("./pages/AuthPage").then((m) => ({ default: m.AuthPage })),
);

// Trang đăng bán sản phẩm mới (/dang-bai)
const PostListingPage = lazy(() =>
  import("./pages/PostListingPage").then((m) => ({
    default: m.PostListingPage,
  })),
);

// Trang tổng quan tài khoản người bán (/dashboard)
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);

// Trang quản trị hệ thống (/admin)
const AdminPage = lazy(() =>
  import("./pages/AdminPage").then((m) => ({ default: m.AdminPage })),
);

// Trang hồ sơ công khai người bán (/nguoi-ban/:id)
const SellerProfilePage = lazy(() =>
  import("./pages/SellerProfilePage").then((m) => ({
    default: m.SellerProfilePage,
  })),
);

// Trang danh sách ngư dân (/ng-dan)
const FishermanListPage = lazy(() =>
  import("./pages/FishermanListPage").then((m) => ({
    default: m.FishermanListPage,
  })),
);

// Trang chỉnh sửa hồ sơ cá nhân (/profile)
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);

// Trang danh sách tất cả sản phẩm (/san-pham)
const ProductListPage = lazy(() =>
  import("./pages/ProductListPage").then((m) => ({
    default: m.ProductListPage,
  })),
);

// Trang danh sách công thức nấu ăn (/cong-thuc)
const RecipeListPage = lazy(() =>
  import("./pages/RecipeListPage").then((m) => ({ default: m.RecipeListPage })),
);

// Trang chi tiết công thức nấu ăn (/cong-thuc/:id)
const RecipeDetailPage = lazy(() =>
  import("./pages/RecipeDetailPage").then((m) => ({
    default: m.RecipeDetailPage,
  })),
);

// Trang mạng xã hội cộng đồng ngư dân (/cong-dong)
const CommunityPage = lazy(() =>
  import("./pages/CommunityPage").then((m) => ({ default: m.CommunityPage })),
);

// Trang hướng dẫn quy trình mua bán (/quy-trinh)
const GuidePage = lazy(() =>
  import("./pages/GuidePage").then((m) => ({ default: m.GuidePage })),
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHẦN 3: UI COMPONENTS PHỤ TRỢ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * PageFallback — Màn hình Skeleton hiển thị trong lúc chờ tải trang
 *
 * Khi dùng React.lazy(), trang chưa được tải ngay. Trong khoảng thời gian
 * đó, Suspense cần một component "placeholder" để hiển thị thay thế.
 * Đây là component đó — nó hiển thị 8 khối xám chạy hiệu ứng shimmer,
 * trông giống như các thẻ sản phẩm đang được tải.
 *
 * Kỹ thuật này gọi là "Skeleton Loading" — thân thiện hơn vòng xoay loading
 * vì người dùng cảm nhận được bố cục trang ngay cả khi chưa có dữ liệu.
 */
function PageFallback() {
  return (
    <div
      style={{
        padding: "40px 24px",
        display: "grid",
        gap: 20,
        // auto-fill: tạo bao nhiêu cột tùy ý, mỗi cột rộng ít nhất 250px, tối đa chia đều (1fr)
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/*
        Array.from({ length: 8 }) tạo mảng có 8 phần tử: [undefined, undefined, ...×8]
        .map((_, i) => ...) lặp qua từng phần tử, _ là giá trị (bỏ qua), i là index 0-7
        Kết quả: render 8 khối div skeleton
      */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer" /* CSS class tạo animation ánh sáng quét qua */
          style={{
            height: 320,
            borderRadius: 12,
            border: "1px solid var(--border)",
          }}
        />
      ))}
    </div>
  );
}

/**
 * PageLoader — Vòng xoay loading nhỏ dùng trong Route Wrapper
 *
 * Khác với PageFallback (dùng cho Suspense), PageLoader dùng khi
 * đang chờ dữ liệu từ API (VD: đang lấy thông tin sản phẩm từ server).
 *
 * Props:
 *   label (string): Văn bản hiển thị bên dưới icon loading
 *                   VD: "ĐANG TẢI THÔNG TIN SẢN PHẨM…"
 */
function PageLoader({ label }) {
  return (
    <div
      style={{
        padding: "80px 24px",
        textAlign: "center",
        color: "var(--muted)", // Màu xám từ CSS variable --muted
        display: "flex",
        flexDirection: "column", // Xếp dọc: icon spinner ở trên, chữ ở dưới
        alignItems: "center", // Căn giữa theo chiều ngang
        gap: 12,
      }}
    >
      {/*
        Khối tròn skeleton-shimmer giả lập icon spinner
        borderRadius: "50%" biến hình chữ nhật thành hình tròn hoàn hảo
      */}
      <div
        className="skeleton-shimmer"
        style={{ width: 40, height: 40, borderRadius: "50%" }}
      />
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHẦN 4: ROUTE WRAPPERS — Lấy dữ liệu trước khi render trang
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * ProductDetailPageRoute — Wrapper cho trang chi tiết sản phẩm
 *
 * TẠI SAO CẦN WRAPPER NÀY?
 * Trang ProductDetailPage cần nhận sản phẩm qua props: <ProductDetailPage product={...} />
 * Nhưng dữ liệu sản phẩm phải lấy từ API, và API cần productId từ URL.
 *
 * LUỒNG HOẠT ĐỘNG:
 *   1. Người dùng vào /san-pham/456
 *   2. useParams() lấy ra productId = "456"
 *   3. useApiFetch("/products/456") gửi yêu cầu lên server
 *   4. Trong khi chờ → hiển thị PageLoader
 *   5. Khi có dữ liệu → render <ProductDetailPage product={product} />
 *   6. Nếu sản phẩm không tồn tại (null) → chuyển hướng về trang chủ
 */
function ProductDetailPageRoute() {
  // useParams lấy biến động từ URL pattern "/san-pham/:productId"
  // productId sẽ là chuỗi ID trong URL thực tế
  const { productId } = useParams();

  // Gọi API, nhận về: data (dữ liệu sản phẩm) và loading (đang tải hay không)
  // [productId] là dependencies array: hook tự gọi lại khi productId thay đổi
  const { data: product, loading } = useApiFetch(`/products/${productId}`, [
    productId,
  ]);

  // Lấy thông tin người dùng hiện tại (để ProductDetailPage biết người xem là ai)
  const { user } = useAuth();

  // Nếu đang tải → hiển thị vòng xoay loading
  if (loading) return <PageLoader label="ĐANG TẢI THÔNG TIN SẢN PHẨM…" />;

  // Nếu không có sản phẩm (ID sai, đã bị xóa...) → chuyển về trang chủ
  // replace: thay thế history hiện tại, không cho người dùng bấm Back quay lại URL này
  if (!product) return <Navigate to="/" replace />;

  // Tất cả ok → render trang chi tiết với đầy đủ dữ liệu
  return <ProductDetailPage product={product} user={user} />;
}

/**
 * SellerProfilePageRoute — Wrapper cho trang hồ sơ người bán
 *
 * Logic tương tự ProductDetailPageRoute, nhưng lấy thông tin người bán
 * thay vì sản phẩm. URL pattern: /nguoi-ban/:sellerId
 */
function SellerProfilePageRoute() {
  const { sellerId } = useParams();
  const { data: seller, loading } = useApiFetch(`/users/${sellerId}`, [
    sellerId,
  ]);
  const { user } = useAuth();

  if (loading) return <PageLoader label="ĐANG TẢI HỒ SƠ NGƯ DÂN…" />;
  if (!seller) return <Navigate to="/" replace />;
  return <SellerProfilePage seller={seller} user={user} />;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHẦN 5: AppShell — Bộ khung chính của ứng dụng
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * AppShell — Component "bộ khung" bọc toàn bộ giao diện
 *
 * Đây là nơi lắp ráp tất cả mảnh ghép:
 *   [Navbar] + [Các trang thay đổi theo Route] + [Footer] + [ChatBox] + [AIChatbot]
 *
 * Tại sao tách AppShell ra khỏi App?
 * → AppShell sử dụng useLocation() — hook này CẦN nằm bên trong BrowserRouter.
 * → Nếu gộp vào App (nơi BrowserRouter được khai báo), sẽ bị lỗi vì
 *   useLocation() phải ở component CON của BrowserRouter, không phải cùng cấp.
 */
function AppShell() {
  // ── State và Hook cơ bản ────────────────────────────────────────────────

  // Lấy thông tin user đăng nhập và hàm logout từ AuthContext
  const { user, logout } = useAuth();

  // Hook chuyển trang tùy chỉnh (thêm hiệu ứng chuyển cảnh)
  const navigate = useViewTransitionNavigate();

  // Lấy thông tin về URL đang truy cập
  const location = useLocation();

  // State: số lượng tin nhắn chưa đọc (hiển thị badge đỏ trên icon chat ở Navbar)
  // Khởi tạo là 0, sẽ cập nhật qua API polling và Socket.io
  const [unread, setUnread] = useState(0);

  // State: cấu hình của ChatBox đang mở (null = đóng, có object = đang mở)
  // Object chứa: { productId, productName, otherUserId, otherUserName, ... }
  const [globalChat, setGlobalChat] = useState(null);

  /**
   * activeChatRef — Ref tham chiếu lưu trữ giá trị globalChat
   *
   * VẤN ĐỀ: Trong callback của Socket.io (được tạo một lần lúc đăng ký),
   * nếu dùng trực tiếp biến state globalChat, nó sẽ bị "đóng băng" tại giá trị
   * lúc callback được tạo (gọi là "stale closure" — closure lỗi thời).
   * Dù state thay đổi, callback vẫn thấy giá trị cũ!
   *
   * GIẢI PHÁP: Dùng useRef() — ref.current luôn trỏ đến giá trị MỚI NHẤT
   * mà không cần tạo lại callback. Đây là pattern phổ biến trong React.
   *
   * Tóm tắt: State → re-render | Ref → không re-render nhưng luôn cập nhật
   */
  const activeChatRef = React.useRef(null);

  // ── useEffect 1: Đồng bộ Ref với State ────────────────────────────────

  /**
   * Mỗi khi globalChat thay đổi, cập nhật ref để socket listener luôn
   * đọc được giá trị mới nhất (giải quyết vấn đề stale closure ở trên).
   */
  useEffect(() => {
    activeChatRef.current = globalChat;
  }, [globalChat]); // Chạy lại mỗi khi globalChat thay đổi

  // ── useEffect 2: Lắng nghe sự kiện mở ChatBox từ các trang con ────────

  /**
   * Các trang con (VD: ProductDetailPage) cần mở ChatBox nổi.
   * Thay vì truyền props qua nhiều cấp (prop drilling), chúng phát một
   * CustomEvent lên window. AppShell bắt sự kiện đó và cập nhật state.
   *
   * Cú pháp phát sự kiện từ trang con:
   *   window.dispatchEvent(new CustomEvent("open-global-chat", {
   *     detail: { productId: 123, productName: "Cá hồi", otherUserId: 456, ... }
   *   }));
   */
  useEffect(() => {
    const handleOpenGlobalChat = (e) => {
      if (e.detail) {
        // e.detail chứa object thông tin chat được truyền qua CustomEvent
        setGlobalChat(e.detail);
      }
    };

    // Đăng ký lắng nghe trên window — nghe "toàn cục"
    window.addEventListener("open-global-chat", handleOpenGlobalChat);

    // Cleanup function: Chạy khi component bị unmount (hoặc trước lần effect tiếp theo)
    // QUAN TRỌNG: Luôn phải hủy đăng ký sự kiện để tránh memory leak
    return () => {
      window.removeEventListener("open-global-chat", handleOpenGlobalChat);
    };
  }, []); // [] = chỉ chạy 1 lần khi component mount

  // ── useEffect 3: Tự động cuộn về đỉnh trang khi chuyển trang ──────────

  /**
   * Hành vi mong muốn: mỗi khi URL thay đổi, trang cuộn về trên cùng.
   * VD: đang xem sản phẩm, cuộn xuống giữa trang, click sang trang khác
   * → trang mới phải hiển thị từ đầu, không phải từ giữa.
   *
   * NGOẠI LỆ: Trang /san-pham có tính năng "khôi phục vị trí cuộn"
   * (người dùng xem sản phẩm, bấm Back → quay lại đúng vị trí cũ).
   * sessionStorage lưu vị trí cuộn trước đó.
   */
  useEffect(() => {
    const savedScroll = sessionStorage.getItem("productlistpage_scroll_y");

    // Nếu đang vào trang /san-pham VÀ có vị trí cuộn đã lưu → bỏ qua, không cuộn lên đỉnh
    if (location.pathname === "/san-pham" && savedScroll) {
      return;
    }

    // behavior: "instant" = cuộn ngay, không có animation trượt mượt
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]); // Chạy lại mỗi khi pathname (phần đường dẫn) thay đổi

  // ── useEffect 4: Polling số lượng tin nhắn chưa đọc ────────────────────

  /**
   * Polling là kỹ thuật "hỏi định kỳ" — cứ mỗi X giây lại gửi request hỏi server.
   * Đây là phương pháp đơn giản hơn WebSocket để cập nhật dữ liệu.
   *
   * LUỒNG HOẠT ĐỘNG:
   *   1. User đăng nhập → bắt đầu polling
   *   2. Gọi API ngay lập tức lần đầu
   *   3. Đặt lịch gọi lại mỗi 60 giây
   *   4. User đăng xuất → hủy lịch, reset về 0
   *
   * Tại sao cần cả polling lẫn Socket.io (effect tiếp theo)?
   * → Socket.io cập nhật ngay lập tức khi có tin mới (real-time)
   * → Polling là "backup" đảm bảo đồng bộ chính xác (VD: khi mạng yếu, socket miss)
   */
  useEffect(() => {
    if (!user) {
      // Chưa đăng nhập → reset về 0
      // Promise.resolve().then() = đưa vào microtask queue, tránh update state
      // trong quá trình React đang render (có thể gây warning)
      Promise.resolve().then(() => setUnread(0));
      return;
    }

    // Hàm gọi API lấy số tin chưa đọc
    const fetchUnread = () =>
      api("/messages/unread-count")
        .then((d) => setUnread(d.count)) // d.count là số từ server
        .catch(() => {}); // Bỏ qua lỗi mạng, thử lại lần sau

    fetchUnread(); // Gọi ngay lập tức khi user đăng nhập

    // Lắng nghe sự kiện "sync-unread" — được phát khi người dùng ĐỌC một tin nhắn
    // → Cập nhật ngay lập tức thay vì đợi đến chu kỳ polling tiếp theo
    const handleSync = () => fetchUnread();
    window.addEventListener("sync-unread", handleSync);

    // setInterval: lên lịch lặp lại, trả về ID để hủy sau
    // 60_000 ms = 60 giây (dấu _ trong số chỉ để dễ đọc, không ảnh hưởng giá trị)
    const id = setInterval(fetchUnread, 60_000);

    // Cleanup: hủy lịch và gỡ sự kiện khi user đăng xuất hoặc component unmount
    return () => {
      clearInterval(id);
      window.removeEventListener("sync-unread", handleSync);
    };
  }, [user]); // Chạy lại khi user thay đổi (đăng nhập / đăng xuất)

  // ── useEffect 5: Cập nhật real-time qua Socket.io ─────────────────────

  /**
   * Socket.io cho phép server ĐẨY thông báo đến client ngay lập tức.
   * Khi có tin nhắn mới, thay vì chờ đến lần polling tiếp theo (tối đa 60s),
   * server gửi event "notification" → badge số cập nhật ngay.
   *
   * LUỒNG XỬ LÝ KHI NHẬN NOTIFICATION:
   *   1. Nhận sự kiện "notification" từ server
   *   2. Kiểm tra type === "new_message"?
   *   3. Người dùng có đang MỞ chat với sản phẩm đó không? (kiểm tra qua activeChatRef)
   *      - Đang xem chat đó → bỏ qua (tin đã được đọc ngay)
   *      - Không xem → tăng badge thêm 1
   *
   * let active = true: Biến cờ để xử lý "race condition"
   * Race condition: getSocket() là bất đồng bộ, có thể component đã unmount
   * trước khi kết nối xong → active = false để bỏ qua callback
   */
  useEffect(() => {
    if (!user) return; // Không đăng nhập → không kết nối socket

    let active = true;
    let cleanupSocketListener = null;

    getSocket()
      .then((socket) => {
        // Kiểm tra cờ: nếu component đã bị unmount trong khi kết nối
        if (!active) return;

        const handler = (data) => {
          if (data.type === "new_message") {
            // Đọc giá trị HIỆN TẠI từ ref (không bị stale closure)
            const activeChat = activeChatRef.current;

            // Đang chat với đúng sản phẩm này → bỏ qua, không tăng badge
            if (activeChat && activeChat.productId === data.productId) {
              return;
            }

            // prev là giá trị cũ, cộng thêm 1 → React đảm bảo cập nhật đúng
            // Dùng functional update (prev => prev + 1) thay vì unread + 1
            // để tránh stale state trong async context
            setUnread((prev) => prev + 1);
          }
        };

        // Đăng ký lắng nghe sự kiện "notification" trên socket connection
        socket.on("notification", handler);

        // Lưu hàm cleanup để gọi sau
        cleanupSocketListener = () => socket.off("notification", handler);
      })
      .catch(() => {}); // Bỏ qua lỗi kết nối socket

    return () => {
      active = false; // Đánh dấu component đã unmount
      cleanupSocketListener?.(); // ?. = optional chaining: gọi chỉ nếu không null
    };
  }, [user]);

  // ── Hàm xử lý đăng xuất ────────────────────────────────────────────────

  /**
   * async/await: đảm bảo đăng xuất (xóa token, cookie...) HOÀN TẤT
   * trước khi chuyển trang về trang chủ.
   */
  const handleLogout = async () => {
    await logout(); // Chờ dọn dẹp xong
    navigate("/"); // Về trang chủ
  };

  // ── Kiểm tra đang ở trang đăng nhập không ──────────────────────────────

  /**
   * Trang đăng nhập có thiết kế riêng: không có Navbar, Footer, Chatbot.
   * Biến này dùng để ẩn/hiện các thành phần đó.
   */
  const isAuthPage = location.pathname === "/dang-nhap";

  // ── JSX: Kết cấu giao diện ─────────────────────────────────────────────

  return (
    <div
      style={{
        fontFamily: "var(--font)", // CSS variable: phông chữ toàn cục
        background: "transparent", // Trong suốt để thấy background của <body>
        minHeight: "100vh", // vh = viewport height, 100vh = cao bằng màn hình
      }}
    >
      {/*
        Hiển thị có điều kiện: chỉ render Navbar khi KHÔNG phải trang đăng nhập
        Cú pháp: {điều_kiện && <Component />}
        → Nếu điều kiện true → render Component
        → Nếu điều kiện false → không render gì cả
      */}
      {!isAuthPage && (
        <Navbar
          unread={unread} /* Số badge chưa đọc → hiển thị trên icon */
          onOpenGlobalChat={setGlobalChat} /* Khi Navbar trigger mở chat */
          onLogout={handleLogout} /* Khi người dùng click nút Đăng xuất */
        />
      )}

      {/*
        Suspense: Bọc toàn bộ Routes để xử lý trạng thái "đang tải" của lazy components.
        fallback: Component hiển thị TRONG KHI file JavaScript của trang đang được tải về.
        Khi file tải xong → fallback tự biến mất, trang thật hiển thị.
      */}
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* ── PUBLIC ROUTES: Ai cũng truy cập được ─────────────────────── */}

          {/* Trang chủ */}
          <Route path="/" element={<HomePage />} />

          {/* Danh sách sản phẩm */}
          <Route path="/san-pham" element={<ProductListPage />} />

          {/*
            Chi tiết sản phẩm: :productId là "URL parameter" động
            VD: /san-pham/123 → productId = "123"
                /san-pham/abc → productId = "abc"
            Dùng Wrapper (ProductDetailPageRoute) thay vì ProductDetailPage trực tiếp
            vì cần gọi API lấy dữ liệu sản phẩm trước
          */}
          <Route
            path="/san-pham/:productId"
            element={<ProductDetailPageRoute />}
          />

          {/* Danh sách công thức */}
          <Route path="/cong-thuc" element={<RecipeListPage />} />

          {/* Chi tiết công thức */}
          <Route path="/cong-thuc/:id" element={<RecipeDetailPage />} />

          {/* Cộng đồng */}
          <Route path="/cong-dong" element={<CommunityPage />} />

          {/* Hướng dẫn quy trình */}
          <Route path="/quy-trinh" element={<GuidePage />} />

          {/* Hồ sơ người bán (dùng Wrapper để fetch dữ liệu) */}
          <Route
            path="/nguoi-ban/:sellerId"
            element={<SellerProfilePageRoute />}
          />

          {/* Danh sách ngư dân */}
          <Route path="/ngu-dan" element={<FishermanListPage />} />

          {/* ── GUEST-ONLY ROUTES: Chỉ khách CHƯA đăng nhập ─────────────── */}

          {/*
            GuestRoute kiểm tra: nếu đã đăng nhập → <Navigate to="/" />
            Tránh người đã đăng nhập vào lại trang login (vô nghĩa và confusing)
          */}
          <Route
            path="/dang-nhap"
            element={
              <GuestRoute>
                <AuthPage />
              </GuestRoute>
            }
          />

          {/* ── PRIVATE ROUTES: Yêu cầu đã đăng nhập ─────────────────────── */}

          {/*
            PrivateRoute kiểm tra: nếu chưa đăng nhập → chuyển về /dang-nhap
            Bảo vệ các trang nhạy cảm cần xác thực
          */}
          <Route
            path="/dang-bai"
            element={
              <PrivateRoute>
                <PostListingPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />

          {/* ── ADMIN ROUTES: Chỉ dành cho Admin ─────────────────────────── */}

          {/*
            AdminRoute kiểm tra thêm role của user: chỉ cho phép nếu user.role === "admin"
            Người dùng thường dù đăng nhập rồi cũng không vào được
          */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />

          {/* ── CATCH-ALL: Bắt mọi URL không khớp ────────────────────────── */}

          {/*
            path="*" khớp với TẤT CẢ URL không khớp bất kỳ Route nào ở trên
            → Chuyển hướng về trang chủ thay vì hiển thị trang 404 trắng
            replace: không thêm URL lỗi vào history, nút Back sẽ hoạt động đúng
          */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Footer và AIChatbot: hiển thị mọi nơi trừ trang đăng nhập */}
      {!isAuthPage && <Footer />}
      {!isAuthPage && <AIChatbot />}

      {/*
        ChatBox nổi (Floating Chat Window):
        - Chỉ render khi globalChat có giá trị (khác null)
        - Vị trí cố định ở góc phải dưới màn hình (position: fixed)
        - zIndex: 9999 đảm bảo hiển thị ĐÈ LÊN tất cả thành phần khác

        key={`${globalChat.productId}-${globalChat.otherUserId}`}:
        → key là chuỗi độc nhất xác định instance của component
        → Khi key thay đổi (chuyển sang cuộc hội thoại khác), React HỦY component cũ
          và TẠO MỚI hoàn toàn → state/ref bên trong ChatBox được reset sạch
        → Tránh lỗi "hiển thị tin nhắn của cuộc hội thoại cũ"
      */}
      {globalChat && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 320,
            zIndex: 9999,
            boxShadow: "var(--shadow-xl)",
            borderRadius: 12,
            overflow: "hidden",
            // Animation CSS: trượt xuống 0.3 giây với easing cubic-bezier
            // cubic-bezier(0.16, 1, 0.3, 1): nhanh lúc đầu, chậm dần cuối → cảm giác "snap"
            animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <ChatBox
            key={`${globalChat.productId}-${globalChat.otherUserId}`}
            product={{
              id: globalChat.productId,
              name: globalChat.productName,
              sellerId: globalChat.otherUserId,
              sellerName: globalChat.otherUserName,
              productSellerId: globalChat.productSellerId,
              otherUserId: globalChat.otherUserId,
            }}
            user={user}
            // Khi người dùng click nút đóng (X) trong ChatBox:
            // setGlobalChat(null) → globalChat = null → điều kiện {globalChat && ...} sai → ChatBox biến mất
            onClose={() => setGlobalChat(null)}
          />
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHẦN 6: App — Component gốc xuất ra ngoài
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * App — Component gốc (Root Component) được React render vào DOM
 *
 * Đây là component BÊN NGOÀI CÙNG của toàn bộ ứng dụng.
 * Nó được gọi trong main.jsx/index.js: ReactDOM.createRoot(...).render(<App />)
 *
 * KIẾN TRÚC CÂY PROVIDER (theo thứ tự từ ngoài vào trong):
 *
 *   BrowserRouter           ← Cung cấp khả năng routing cho toàn app
 *   └── ErrorBoundary       ← Bắt lỗi runtime, ngăn crash toàn app
 *       └── AuthProvider    ← Cung cấp thông tin đăng nhập toàn cục
 *           └── ToastProvider ← Cung cấp khả năng hiện toast notification
 *               └── VideoCallProvider ← Cung cấp tính năng gọi video
 *                   └── AppShell  ← Giao diện thực sự hiển thị cho người dùng
 *
 * Tại sao cần nhiều lớp Provider lồng nhau?
 * → Mỗi Provider cung cấp dữ liệu/tính năng cho TẤT CẢ component con bên trong nó
 * → Provider ngoài cùng = dữ liệu có sẵn ở mọi nơi trong app
 * → Thứ tự lồng nhau quan trọng: Provider con có thể DÙNG dữ liệu từ Provider cha
 *   VD: VideoCallProvider có thể gọi useAuth() vì AuthProvider bọc bên ngoài nó
 *
 * export default: Đây là export chính của file — khi file khác import App.jsx,
 * chúng nhận được component này.
 */
export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <VideoCallProvider>
              <AppShell />
            </VideoCallProvider>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
