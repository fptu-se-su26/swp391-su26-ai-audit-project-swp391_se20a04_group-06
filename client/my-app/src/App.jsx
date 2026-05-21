import React, { useState, useEffect } from "react";
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

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [unread, setUnread] = useState(0);
  const [globalChat, setGlobalChat] = useState(null);
  const [seller, setSeller] = useState(null);

  // Load font
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // Khôi phục session từ localStorage khi load app
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api("/auth/me")
      .then((u) => setUser(u))
      .catch(() => saveToken(null)); // token hết hạn
  }, []);

  // Poll unread count khi đã đăng nhập
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
      setPage("home");
      disconnectSocket();
    }
  };

  const safePage = (p) => {
    if ((p === "post" || p === "dashboard") && !user) {
      setPage("auth");
      return;
    }
    if (p === "admin" && user?.role !== "Admin") {
      setPage("auth");
      return;
    }
    setPage(p);
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
        page={page}
        setPage={safePage}
        user={user}
        setUser={handleSetUser}
        unread={unread}
        onOpenGlobalChat={setGlobalChat}
        setSelectedProduct={setProduct}
        setSelectedSeller={setSeller}
      />
      {page === "home" && (
        <HomePage
          setPage={safePage}
          setSelectedProduct={setProduct}
          setSelectedSeller={setSeller}
          user={user}
        />
      )}
      {page === "detail" && (
        <ProductDetailPage
          product={product}
          setPage={safePage}
          user={user}
          setSelectedSeller={setSeller}
        />
      )}
      {page === "auth" && (
        <AuthPage setUser={handleSetUser} setPage={setPage} />
      )}
      {page === "post" && <PostListingPage user={user} setPage={safePage} />}
      {page === "dashboard" && (
        <DashboardPage
          user={user}
          setPage={safePage}
          setSelectedProduct={setProduct}
        />
      )}
      {page === "admin" && <AdminPage />}
      {page === "seller" && (
        <SellerProfilePage
          seller={seller}
          setPage={safePage}
          setSelectedProduct={setProduct}
          user={user}
        />
      )}
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
