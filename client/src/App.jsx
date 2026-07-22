import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { ToastProvider } from "./context/ToastContext";
import { Provider } from "react-redux";
import { store } from "./store";

import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import SeafoodAssistant from "./components/SeafoodAssistant";
import TourGuide from "./components/tour/TourGuide";
import { RequireAuth, RequireRole } from "./components/RouteGuard";
import { useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ScrollToTop from "./components/common/ScrollToTop";
import VideoCall from "./components/chat/VideoCall";
import { useSocket } from "./context/SocketContext";

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
const Community = lazy(() => import("./pages/Community"));
const Recipes = lazy(() => import("./pages/Recipes"));
const RecipeDetail = lazy(() => import("./pages/RecipeDetail"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const LandingBatchDetail = lazy(() => import("./pages/LandingBatchDetail"));
const PurchaseGuide = lazy(() => import("./pages/PurchaseGuide"));
const QualityGuarantee = lazy(() => import("./pages/QualityGuarantee"));
const SafetyPolicy = lazy(() => import("./pages/SafetyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));

import { getUserRole } from "./config/navigation";

/** Resolve which shell background class to apply based on path and user capabilities */
function resolveShellClass(user, pathname) {
  if ((user?.role === "Admin" || user?.role === "admin") && pathname?.startsWith("/admin")) {
    return "shell-admin";
  }
  if (pathname?.startsWith("/seller")) {
    return "shell-seller";
  }
  return "shell-buyer";
}

function AppContent() {
  const location = useLocation();
  const { user } = useAuth();
  const { socket } = useSocket() || {};
  const isAuthPage = ["/login", "/register"].includes(location.pathname);
  const isChatPage = location.pathname === "/chat";
  const shellClass = resolveShellClass(user, location.pathname);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const loc = { latitude: coords.latitude, longitude: coords.longitude };
          localStorage.setItem("viewerLocation", JSON.stringify(loc));
          window.dispatchEvent(new Event("locationUpdated"));
        },
        (error) => {
          console.warn("Global geolocation prompt failed:", error);
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    }
  }, []);

  return (
    <div className={`app-shell ${shellClass}`}>
      {!isOnline && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999, background: "#ef4444", color: "#fff", padding: "12px", textAlign: "center", fontSize: "0.9rem", fontWeight: "bold", display: "flex", gap: "8px", justifyContent: "center", alignItems: "center", boxShadow: "0 -4px 12px rgba(0,0,0,0.15)" }}>
          <span>⚠️</span> Bạn đang ngoại tuyến. Một số tính năng cập nhật dữ liệu trực tuyến có thể không khả dụng.
        </div>
      )}
      {!isAuthPage && <Navbar />}
      <TourGuide />

      <div className="app-shell__body">
        <main className="app-main">
          <Suspense fallback={<div className="page-state">Đang tải trang...</div>}>
            <ErrorBoundary>
              <div className="route-transition" key={location.pathname}>
                <Routes location={location}>
                  <Route path="/" element={<Home />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/landing-batches/:id" element={<LandingBatchDetail />} />
                  <Route path="/fisherman/:id" element={<SellerProfile />} />
                  <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
                  <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
                  <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                  <Route path="/premium" element={<RequireAuth><Premium /></RequireAuth>} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/recipes" element={<Recipes />} />
                  <Route path="/recipes/:id" element={<RecipeDetail />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/boat-log" element={<RequireRole roles={["buyer"]}><BoatLog readOnly /></RequireRole>} />
                  <Route path="/purchase-guide" element={<PurchaseGuide />} />
                  <Route path="/quality-guarantee" element={<QualityGuarantee />} />
                  <Route path="/safety-policy" element={<SafetyPolicy />} />
                  <Route path="/terms" element={<Terms />} />

                  <Route path="/buyer" element={<Navigate to="/" replace />} />
                  <Route path="/buyer/favorites" element={<RequireAuth><Favorites /></RequireAuth>} />

                  <Route path="/seller/boat-log" element={<RequireRole roles={["seller", "admin"]}><BoatLog /></RequireRole>} />
                  <Route path="/seller/*" element={<RequireRole roles={["seller", "admin"]}><SellerDashboard /></RequireRole>} />

                  <Route path="/admin/payments" element={<RequireRole roles={["admin"]}><AdminPayments /></RequireRole>} />
                  <Route path="/admin/broadcast" element={<RequireRole roles={["admin"]}><Broadcast /></RequireRole>} />
                  <Route path="/admin/settings" element={<RequireRole roles={["admin"]}><AdminSettings /></RequireRole>} />
                  <Route path="/admin/*" element={<RequireRole roles={["admin"]}><AdminDashboard /></RequireRole>} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>

      {!isAuthPage && (
        <>
          <SeafoodAssistant />
          {user && <VideoCall currentUser={user} socket={socket} />}
          {!isChatPage && <Footer />}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <SocketProvider>
          <ConfirmProvider>
            <ToastProvider>
              <BrowserRouter>
                <ScrollToTop />
                <AppContent />
              </BrowserRouter>
            </ToastProvider>
          </ConfirmProvider>
        </SocketProvider>
      </AuthProvider>
    </Provider>
  );
}

