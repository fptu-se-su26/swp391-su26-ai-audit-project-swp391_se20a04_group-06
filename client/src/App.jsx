/**
 * App.jsx — Đã khắc phục lỗi lặp render khi reset unread và làm sạch import
 */

import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastProvider";
import { VideoCallProvider } from "./context/VideoCallProvider";
import {
  PrivateRoute,
  AdminRoute,
  GuestRoute,
} from "./components/PrivateRoute";
import { useApiFetch } from "./hooks/useApiFetch";
import { Navbar } from "./layout/Navbar";
import { Footer } from "./layout/Footer";
import { ChatBox } from "./components/ChatBox";
import { AIChatbot } from "./components/AIChatbot";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useViewTransitionNavigate } from "./hooks/useViewTransitionNavigate";
import { getSocket } from "./services/socket";
import { api } from "./services/api";
import { useLocation } from "react-router-dom";

// ── Code-splitting ──────────────────────────────────────────
const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const ProductDetailPage = lazy(() =>
  import("./pages/ProductDetailPage").then((m) => ({
    default: m.ProductDetailPage,
  })),
);

const AuthPage = lazy(() =>
  import("./pages/AuthPage").then((m) => ({ default: m.AuthPage })),
);
const PostListingPage = lazy(() =>
  import("./pages/PostListingPage").then((m) => ({
    default: m.PostListingPage,
  })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const AdminPage = lazy(() =>
  import("./pages/AdminPage").then((m) => ({ default: m.AdminPage })),
);
const SellerProfilePage = lazy(() =>
  import("./pages/SellerProfilePage").then((m) => ({
    default: m.SellerProfilePage,
  })),
);

const FishermanListPage = lazy(() =>
  import("./pages/FishermanListPage").then((m) => ({
    default: m.FishermanListPage,
  })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const ProductListPage = lazy(() =>
  import("./pages/ProductListPage").then((m) => ({
    default: m.ProductListPage,
  })),
);
const RecipeListPage = lazy(() =>
  import("./pages/RecipeListPage").then((m) => ({ default: m.RecipeListPage })),
);
const RecipeDetailPage = lazy(() =>
  import("./pages/RecipeDetailPage").then((m) => ({
    default: m.RecipeDetailPage,
  })),
);
const CommunityPage = lazy(() =>
  import("./pages/CommunityPage").then((m) => ({ default: m.CommunityPage })),
);

const GuidePage = lazy(() =>
  import("./pages/GuidePage").then((m) => ({ default: m.GuidePage })),
);

// ── Shared loading UI ───────────────────────────────────────
function PageFallback() {
  return (
    <div
      style={{
        padding: "40px 24px",
        display: "grid",
        gap: 20,
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer"
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
 * PageLoader — Spinner nhỏ dùng chung cho các route wrapper
 * (trước đây bị copy-paste 2 lần trong ProductDetailPageRoute và SellerProfilePageRoute)
 */
function PageLoader({ label }) {
  return (
    <div
      style={{
        padding: "80px 24px",
        textAlign: "center",
        color: "var(--muted)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        className="skeleton-shimmer"
        style={{ width: 40, height: 40, borderRadius: "50%" }}
      />
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ── Route wrappers (sử dụng useApiFetch thay vì copy-paste) ─
/**
 * TRƯỚC: 30 dòng lặp lại hoàn toàn cho mỗi route
 * SAU: useApiFetch + 10 dòng render
 */
function ProductDetailPageRoute() {
  const { productId } = useParams();
  const { data: product, loading } = useApiFetch(`/products/${productId}`, [
    productId,
  ]);
  const { user } = useAuth();

  if (loading) return <PageLoader label="ĐANG TẢI THÔNG TIN SẢN PHẨM…" />;
  if (!product) return <Navigate to="/" replace />;
  return <ProductDetailPage product={product} user={user} />;
}

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

// ── AppShell — layout + routes ───────────────────────────────
function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useViewTransitionNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [globalChat, setGlobalChat] = useState(null);
  const activeChatRef = React.useRef(null);
  useEffect(() => {
    activeChatRef.current = globalChat;
  }, [globalChat]);
  // Lắng nghe sự kiện mở chat nổi từ các trang con (như chi tiết sản phẩm)
  useEffect(() => {
    const handleOpenGlobalChat = (e) => {
      if (e.detail) {
        setGlobalChat(e.detail);
      }
    };
    window.addEventListener("open-global-chat", handleOpenGlobalChat);
    return () => {
      window.removeEventListener("open-global-chat", handleOpenGlobalChat);
    };
  }, []);
  useEffect(() => {
    // Bỏ qua nếu quay lại trang Danh sách sản phẩm (để giữ vị trí cuộn đã khôi phục của người dùng)
    const savedScroll = sessionStorage.getItem("productlistpage_scroll_y");
    if (location.pathname === "/san-pham" && savedScroll) {
      return;
    }

    // Đưa thanh cuộn về đỉnh đầu trang lập tức
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  // Poll unread message count
  // src/App.jsx (Trích đoạn useEffect đồng bộ unread)
  useEffect(() => {
    if (!user) {
      Promise.resolve().then(() => setUnread(0));
      return;
    }
    const fetchUnread = () =>
      api("/messages/unread-count")
        .then((d) => setUnread(d.count))
        .catch(() => {});

    fetchUnread();

    // Lắng nghe sự kiện đồng bộ tùy chỉnh để cập nhật tức thì
    const handleSync = () => fetchUnread();
    window.addEventListener("sync-unread", handleSync);

    const id = setInterval(fetchUnread, 60_000);
    return () => {
      clearInterval(id);
      window.removeEventListener("sync-unread", handleSync);
    };
  }, [user]);

  // BUG FIX: Lắng nghe socket `new_message` để cập nhật unread count real-time thay vì
  // chờ poll 30 giây tiếp theo. Trước đây socket.ts emit `notification` type "new_message"
  // nhưng client không handle → badge tin nhắn lag tối đa 30 giây sau mỗi tin nhận được.
  useEffect(() => {
    if (!user) return;
    let active = true;
    let cleanupSocketListener = null;

    getSocket()
      .then((socket) => {
        if (!active) return;
        const handler = (data) => {
          if (data.type === "new_message") {
            const activeChat = activeChatRef.current;

            // 🌟 GIẢI PHÁP: Nếu người dùng đang mở chat trực diện với sản phẩm này, bỏ qua không cộng dồn badge chưa đọc!
            if (activeChat && activeChat.productId === data.productId) {
              return;
            }

            setUnread((prev) => prev + 1);
          }
        };
        socket.on("notification", handler);
        cleanupSocketListener = () => socket.off("notification", handler);
      })
      .catch(() => {});

    return () => {
      active = false;
      cleanupSocketListener?.();
    };
  }, [user]);

  // Logout handler: gọi logout từ AuthContext rồi navigate
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isAuthPage = location.pathname === "/dang-nhap";

  return (
    <div
      style={{
        fontFamily: "var(--font)",
        background: "transparent",
        minHeight: "100vh",
      }}
    >
      {!isAuthPage && (
        <Navbar
          unread={unread}
          onOpenGlobalChat={setGlobalChat}
          onLogout={handleLogout}
        />
      )}

      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* ── Public routes ─────────────────────────── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/san-pham" element={<ProductListPage />} />
          <Route
            path="/san-pham/:productId"
            element={<ProductDetailPageRoute />}
          />
          <Route path="/cong-thuc" element={<RecipeListPage />} />
          <Route path="/cong-thuc/:id" element={<RecipeDetailPage />} />
          <Route path="/cong-dong" element={<CommunityPage />} />
          <Route path="/quy-trinh" element={<GuidePage />} />

          <Route
            path="/nguoi-ban/:sellerId"
            element={<SellerProfilePageRoute />}
          />
          <Route path="/ngu-dan" element={<FishermanListPage />} />

          {/* ── Guest only (redirect nếu đã login) ────── */}
          <Route
            path="/dang-nhap"
            element={
              <GuestRoute>
                <AuthPage />
              </GuestRoute>
            }
          />

          {/* ── Protected routes ─────────────────────── */}
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

          {/* ── Admin only ────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {!isAuthPage && <Footer />}
      {!isAuthPage && <AIChatbot />}

      {/* Floating Chat Box */}
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
            onClose={() => setGlobalChat(null)}
          />
        </div>
      )}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────
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
