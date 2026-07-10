import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ConfirmProvider } from "./context/ConfirmContext";

import Footer from "./components/Footer";
import FloatingContact from "./components/FloatingContact";
import Navbar from "./components/Navbar";
import SeafoodAssistant from "./components/SeafoodAssistant";
import TourGuide from "./components/tour/TourGuide";
import { RequireAuth, RequireRole } from "./components/RouteGuard";

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

function AppContent() {
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname);

  return (
    <div className="app-shell">
      {!isAuthPage && <Navbar />}
      <TourGuide />

      <div className="app-shell__body">
        <main className="app-main">
          <Suspense fallback={<div className="page-state">Đang tải trang...</div>}>
            <div className="route-transition" key={location.pathname}>
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/landing-batches/:id" element={<LandingBatchDetail />} />
                <Route path="/fisherman/:id" element={<SellerProfile />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
                <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/premium" element={<RequireAuth><Premium /></RequireAuth>} />
                <Route path="/community" element={<Community />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/recipes/:id" element={<RecipeDetail />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/boat-log" element={<RequireRole roles={["buyer"]}><BoatLog readOnly /></RequireRole>} />

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
          </Suspense>
        </main>
      </div>

      {!isAuthPage && (
        <>
          <SeafoodAssistant />
          <FloatingContact />
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
        <ConfirmProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ConfirmProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

