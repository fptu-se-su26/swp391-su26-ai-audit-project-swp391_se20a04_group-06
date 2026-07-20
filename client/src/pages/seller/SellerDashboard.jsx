import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import SellerOverview from "../../components/seller/SellerOverview";
import SellerProducts from "../../components/seller/SellerProducts";
import LandingBatchForm from "./LandingBatchForm";
import SellerLandingBatches from "./SellerLandingBatches";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import {
  apiBoatLogs,
  apiLandingBatches,
  apiMessages,
  apiProducts,
} from "../../services/api";

export default function SellerDashboard() {
  const { user } = useAuth();
  const notifications = useSelector((state) => state.notifications.list) || [];
  const [products, setProducts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [boatLogs, setBoatLogs] = useState([]);
  const [landingBatches, setLandingBatches] = useState([]);

  useEffect(() => {
    if (!user) return;
    const sellerId = user.id || user._id;
    Promise.allSettled([
      apiProducts.getMine(),
      apiMessages.getConversations(),
      apiBoatLogs.getAll({ userId: sellerId }),
      apiLandingBatches.getMine({ limit: 100 }),
    ]).then(([productResult, conversationResult, boatLogResult, batchResult]) => {
      if (productResult.status === "fulfilled") {
        const data = productResult.value;
        setProducts(Array.isArray(data) ? data : data?.data || data?.products || []);
      }
      if (conversationResult.status === "fulfilled") {
        const data = conversationResult.value;
        setConversations(Array.isArray(data) ? data : data?.conversations || []);
      }
      if (boatLogResult.status === "fulfilled") {
        const data = boatLogResult.value;
        setBoatLogs(Array.isArray(data) ? data : data?.boatLogs || []);
      }
      if (batchResult.status === "fulfilled") {
        const data = batchResult.value;
        setLandingBatches(Array.isArray(data) ? data : data?.data || []);
      }
    });
  }, [user]);

  return (
    <div className="workspace-page seller-dashboard">
      <Routes>
        <Route index element={<SellerOverview boatLogs={boatLogs} conversations={conversations} landingBatches={landingBatches} notifications={notifications} products={products} user={user} />} />
        <Route path="products" element={<SellerProducts onUpdateProducts={setProducts} products={products} />} />
        <Route path="landing-batches" element={<SellerLandingBatches />} />
        <Route path="landing-batches/new" element={<LandingBatchForm />} />
        <Route path="landing-batches/:id/edit" element={<LandingBatchForm />} />
        <Route
          path="statistics"
          element={<SellerOverview boatLogs={boatLogs} conversations={conversations} landingBatches={landingBatches} notifications={notifications} products={products} statistics user={user} />}
        />
      </Routes>
    </div>
  );
}
