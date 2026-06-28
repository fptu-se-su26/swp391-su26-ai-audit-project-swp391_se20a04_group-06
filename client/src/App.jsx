import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { workspaceNavigation } from "./config/navigation";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import SeafoodAssistant from "./components/SeafoodAssistant";
import Sidebar from "./components/Sidebar";

const Home = lazy(() => import("./pages/Home"));
const Chat = lazy(() => import("./pages/Chat"));
const Login = lazy(() => import("./pages/Login"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Premium = lazy(() => import("./pages/Premium"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Register = lazy(() => import("./pages/Register"));
const SellerProfile = lazy(() => import("./pages/SellerProfile"));
const Favorites = lazy(() => import("./pages/buyer/Favorites"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const Broadcast = lazy(() => import("./pages/admin/Broadcast"));
const BoatLog = lazy(() => import("./pages/seller/BoatLog"));
const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard"));

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname);
  const isSellerArea = location.pathname.startsWith("/seller");
  const isAdminArea = location.pathname.startsWith("/admin");

  return (
    <div className="app-shell">
      {!isAuthPage && <Navbar />}

      <div className="app-shell__body">
        {isSellerArea && user && <Sidebar links={workspaceNavigation.seller} />}
        {isAdminArea && user && <Sidebar links={workspaceNavigation.admin} />}

        <main className="app-main">
          <Suspense fallback={<div className="page-state">Đang tải trang...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/fisherman/:id" element={<SellerProfile />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/premium" element={<Premium />} />

              <Route path="/buyer" element={<Navigate to="/" replace />} />
              <Route path="/buyer/favorites" element={<Favorites />} />

              <Route path="/seller/boat-log" element={<BoatLog />} />
              <Route path="/seller/*" element={<SellerDashboard />} />

              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/broadcast" element={<Broadcast />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/*" element={<AdminDashboard />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {!isAuthPage && (
        <>
          <SeafoodAssistant />
          <Footer />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
