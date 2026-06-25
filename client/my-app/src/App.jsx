/**
 * App.jsx — React Router version
 *
 * Thay thế toàn bộ `state page` bằng real URL.
 * Routes:
 *   /                    → HomePage
 *   /san-pham/:id        → ProductDetailPage
 *   /dang-nhap           → AuthPage
 *   /dang-bai            → PostListingPage
 *   /dashboard           → DashboardPage
 *   /admin               → AdminPage
 *   /nguoi-ban/:id       → SellerProfilePage
 *
 * Cài đặt trước:
 *   npm install react-router-dom
 */

import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";
import { C } from "./utils/theme";
import { api, getToken, saveToken } from "./services/api";
import { disconnectSocket } from "./services/socket";
import { Navbar } from "./layout/Navbar";
import { HomePage } from "./pages/HomePage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { AuthPage } from "./pages/AuthPage";
import { PostListingPage } from "./pages/PostListingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminPage } from "./pages/AdminPage";
import { SellerProfilePage } from "./pages/SellerProfilePage";
import { ChatBox } from "./components/ChatBox";

/* ─── Shell: giữ user state + floating chat ─── */
function AppShell() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [unread, setUnread] = useState(0);
  const [globalChat, setGlobalChat] = useState(null);

  // Load font
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // Khôi phục session
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api("/auth/me")
      .then((u) => setUser(u))
      .catch(() => saveToken(null));
  }, []);

  // Poll unread count
  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    const fetch = () =>
      api("/messages/unread-count")
        .then((d) => setUnread(d.count))
        .catch(() => {});
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, [user]);

  const handleSetUser = (u) => {
    setUser(u);
    if (!u) {
      setUnread(0);
      disconnectSocket();
      navigate("/");
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
        background: C.bg,
        minHeight: "100vh",
      }}
    >
      <Navbar
        user={user}
        setUser={handleSetUser}
        unread={unread}
        onOpenGlobalChat={setGlobalChat}
      />

      <Routes>
        <Route path="/" element={<HomePage user={user} />} />

        {/* Product detail — đọc productId từ URL */}
        <Route
          path="/san-pham/:productId"
          element={<ProductDetailPageRoute user={user} />}
        />

        <Route
          path="/dang-nhap"
          element={<AuthPage setUser={handleSetUser} />}
        />

        {/* Protected routes */}
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

        {/* Seller profile — đọc sellerId từ URL */}
        <Route
          path="/nguoi-ban/:sellerId"
          element={<SellerProfilePageRoute user={user} />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Floating chat box — giữ nguyên behavior */}
      {globalChat && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 320,
            zIndex: 9999,
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
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

/**
 * ProductDetailPageRoute — fetch product theo :productId từ URL
 * Hỗ trợ cả direct link và back button.
 */
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

  if (loading)
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
        Đang tải...
      </div>
    );
  if (!product) return <Navigate to="/" replace />;
  return <ProductDetailPage product={product} user={user} />;
}

/**
 * SellerProfilePageRoute — fetch seller theo :sellerId từ URL
 */
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

  if (loading)
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
        Đang tải...
      </div>
    );
  if (!seller) return <Navigate to="/" replace />;
  return <SellerProfilePage seller={seller} user={user} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
