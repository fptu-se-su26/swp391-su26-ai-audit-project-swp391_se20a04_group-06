/**
 * App.jsx — Premium Hand-crafted Routing Entry
 * Đã tích hợp ErrorBoundary và chuyển sang Cookie-based auth (không lưu token localStorage)
 */

import React, { useState, useEffect, useCallback, Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { api } from "./services/api";
import { disconnectSocket } from "./services/socket";
import { Navbar } from "./layout/Navbar";
import { ChatBox } from "./components/ChatBox";
import { useViewTransitionNavigate } from "./hooks/useViewTransitionNavigate";
import { ErrorBoundary } from "./components/ErrorBoundary";

// ── Code-splitting Modules ──
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
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);

// ── Skeleton fallback ──
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

function AppShell() {
  const navigate = useViewTransitionNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [unread, setUnread] = useState(0);
  const [globalChat, setGlobalChat] = useState(null);

  // Khôi phục phiên làm việc từ cookie (không cần token trong localStorage)
  useEffect(() => {
    api("/auth/me")
      .then((u) => setUser(u))
      .catch(() => setUser(null));
  }, []);

  // Poll tin nhắn chưa đọc
  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    const fetchUnread = () =>
      api("/messages/unread-count")
        .then((d) => setUnread(d.count))
        .catch(() => {});
    fetchUnread();
    const intervalId = setInterval(fetchUnread, 30000);
    return () => clearInterval(intervalId);
  }, [user]);

  const handleSetUser = (u) => {
    setUser(u);
    if (!u) {
      setUnread(0);
      disconnectSocket();
      navigate("/");
    }
  };

  const isAuthPage = location.pathname === "/dang-nhap";

  return (
    <div
      style={{
        fontFamily: "var(--font)",
        background: "var(--bg)",
        minHeight: "100vh",
      }}
    >
      {!isAuthPage && (
        <Navbar
          user={user}
          setUser={handleSetUser}
          unread={unread}
          onOpenGlobalChat={setGlobalChat}
        />
      )}

      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<HomePage user={user} />} />
          <Route
            path="/san-pham/:productId"
            element={<ProductDetailPageRoute user={user} />}
          />
          <Route
            path="/dang-nhap"
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <AuthPage setUser={handleSetUser} />
              )
            }
          />
          <Route
            path="/dang-bai"
            element={
              user ? (
                <PostListingPage user={user} />
              ) : (
                <Navigate to="/dang-nhap" replace />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              user ? (
                <DashboardPage user={user} />
              ) : (
                <Navigate to="/dang-nhap" replace />
              )
            }
          />
          <Route
            path="/admin"
            element={
              user?.role === "Admin" ? (
                <AdminPage />
              ) : (
                <Navigate to="/dang-nhap" replace />
              )
            }
          />
          <Route
            path="/profile"
            element={
              user ? (
                <ProfilePage user={user} setUser={handleSetUser} />
              ) : (
                <Navigate to="/dang-nhap" replace />
              )
            }
          />
          <Route
            path="/nguoi-ban/:sellerId"
            element={<SellerProfilePageRoute user={user} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

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
            }}
            user={user}
            onClose={() => setGlobalChat(null)}
          />
        </div>
      )}
    </div>
  );
}

// ── Routing phụ trợ ──
function ProductDetailPageRoute({ user }) {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/products/${productId}`)
      .then((p) => setProduct(p))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
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
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          ĐANG TẢI THÔNG TIN SẢN PHẨM…
        </span>
      </div>
    );
  }
  if (!product) return <Navigate to="/" replace />;
  return <ProductDetailPage product={product} user={user} />;
}

function SellerProfilePageRoute({ user }) {
  const { sellerId } = useParams();
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/users/${sellerId}`)
      .then((s) => setSeller(s))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sellerId]);

  if (loading) {
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
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          ĐANG TẢI HỒ SƠ NGƯ DÂN…
        </span>
      </div>
    );
  }
  if (!seller) return <Navigate to="/" replace />;
  return <SellerProfilePage seller={seller} user={user} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
