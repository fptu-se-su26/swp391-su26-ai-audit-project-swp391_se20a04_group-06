import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import SellerOverview from "../../components/seller/SellerOverview";
import SellerProducts from "../../components/seller/SellerProducts";
import { useAuth } from "../../context/AuthContext";
import { apiMessages, apiProducts } from "../../services/api";

export default function SellerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (!user) return;
    const sellerId = user.id || user._id;
    Promise.allSettled([
      apiProducts.getAll({ sellerId }),
      apiMessages.getConversations(),
    ]).then(([productResult, conversationResult]) => {
      if (productResult.status === "fulfilled") {
        const data = productResult.value;
        setProducts(Array.isArray(data) ? data : data?.products || []);
      }
      if (conversationResult.status === "fulfilled") {
        const data = conversationResult.value;
        setConversations(Array.isArray(data) ? data : data?.conversations || []);
      }
    });
  }, [user]);

  return (
    <div className="workspace-page">
      <Routes>
        <Route index element={<SellerOverview conversations={conversations} products={products} user={user} />} />
        <Route path="products" element={<SellerProducts onUpdateProducts={setProducts} products={products} />} />
        <Route
          path="statistics"
          element={<SellerOverview conversations={conversations} products={products} statistics user={user} />}
        />
      </Routes>
    </div>
  );
}
