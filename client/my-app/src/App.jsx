/**
 * App.jsx — React Router version (Upgraded UX with Conditionally Hidden Navbar)
 */

import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation, // ✅ BỔ SUNG: Import useLocation để theo dõi URL
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
import { ProfilePage } from "./pages/ProfilePage";
import { ChatBox } from "./components/ChatBox";

/* ─── Shell: giữ user state + floating chat ─── */
function AppShell() {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ BỔ SUNG: Lấy location hiện tại
  const [user, setUser] = useState(null);
  const [unread, setUnread] = useState(0);
  const [globalChat, setGlobalChat] = useState(null);

  // Load font Be Vietnam Pro
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

  // ✅ BỔ SUNG: Ẩn thanh Navbar nếu đang ở trang Đăng nhập
  const isAuthPage = location.pathname === "/dang-nhap";

  return (
    <div
      style={{
        fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
        background: C.bg,
        minHeight: "100vh",
      }}
    >
      {/* Chỉ hiển thị Navbar nếu không phải là trang Đăng nhập */}
      {!isAuthPage && (
        <Navbar
          user={user}
          setUser={handleSetUser}
          unread={unread}
          onOpenGlobalChat={setGlobalChat}
        />
      )}

      <Routes>
        <Route path="/" element={<HomePage user={user} />} />

        {/* Product detail */}
        <Route
          path="/san-pham/:productId"
          element={<ProductDetailPageRoute user={user} />}
        />

        {/* ✅ CẬP NHẬT: Nếu đã đăng nhập thì tự động chuyển hướng về trang chủ chứ không hiển thị Form login */}
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

        {/* Seller profile */}
        <Route
          path="/nguoi-ban/:sellerId"
          element={<SellerProfilePageRoute user={user} />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Floating chat box */}
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
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: C.muted,
          fontWeight: 500,
        }}
      >
        Đang tải thông tin sản phẩm...
      </div>
    );
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

  if (loading)
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: C.muted,
          fontWeight: 500,
        }}
      >
        Đang tải hồ sơ ngư dân...
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
