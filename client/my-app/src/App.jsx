/**
 * App.jsx — Refactored Entry Point
 *
 * PATTERNS APPLIED:
 *   1. Context + Provider Pattern  → AuthProvider, ToastProvider
 *   2. HOC / Wrapper Pattern       → PrivateRoute, AdminRoute, GuestRoute
 *   3. Custom Hook Pattern         → useApiFetch (thay thế ProductDetailPageRoute,
 *                                    SellerProfilePageRoute tay)
 *   4. DRY                         → LoadingSpinner, PageLoader extracted ra component
 *
 * TRƯỚC: App.jsx có 5 inline ternaries guard route + 2 Route components
 *        trùng pattern fetch → loading → render
 * SAU:   Route khai báo sạch, gọn — đọc như spec của app
 */
import React, { useState, useEffect, Suspense, lazy } from "react";
import { VideoCallProvider } from "./context/VideoCallContext"; // ← MỚI

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
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
import { disconnectSocket, getSocket } from "./services/socket";
import { api } from "./services/api";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom"; // đảm bảo đã import

// ── Code-splitting ──────────────────────────────────────────
const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const ProductDetailPage = lazy(() =>
  import("./pages/ProductDetailPage").then((m) => ({
    default: m.ProductDetailPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("./pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
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
  }))
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const ProductListPage = lazy(() =>
  import("./pages/ProductListPage").then((m) => ({ default: m.ProductListPage })),
);
const RecipeListPage = lazy(() =>
  import("./pages/RecipeListPage").then((m) => ({ default: m.RecipeListPage })),
);
const RecipeDetailPage = lazy(() =>
  import("./pages/RecipeDetailPage").then((m) => ({ default: m.RecipeDetailPage })),
);
const CommunityPage = lazy(() =>
  import("./pages/CommunityPage").then((m) => ({ default: m.CommunityPage })),
);
const SubscriptionPage = lazy(() =>
  import("./pages/SubscriptionPage").then((m) => ({ default: m.SubscriptionPage })),
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

  // Poll unread message count
  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    // BUG FIX: đổi tên `fetch` → `fetchUnread` tránh shadow global fetch API
    const fetchUnread = () =>
      api("/messages/unread-count")
        .then((d) => setUnread(d.count))
        .catch(() => { });
    fetchUnread();
    const id = setInterval(fetchUnread, 30_000);
    return () => clearInterval(id);
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
      .catch(() => { });

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
          <Route path="/dinh-ky" element={<SubscriptionPage />} />
          <Route path="/quy-trinh" element={<GuidePage />} />
          <Route
            path="/quen-mat-khau"
            element={
              <GuestRoute>
                <ForgotPasswordPage />
              </GuestRoute>
            }
          />
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
/**
 * Provider order (ngoài → trong):
 *   BrowserRouter > ErrorBoundary > AuthProvider > ToastProvider > AppShell
 *
 * AuthProvider trước ToastProvider vì AppShell cần cả hai
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
