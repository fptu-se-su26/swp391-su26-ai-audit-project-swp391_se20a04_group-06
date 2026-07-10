import { useCallback, useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import ProductGrid from "../../components/ProductGrid";
import { apiFavorites } from "../../services/api";
import { useConfirm } from "../../context/ConfirmContext";


export default function Favorites() {
  const { alert } = useConfirm();
  const [products, setProducts] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());


  const load = useCallback(async () => {
    try {
      const rows = await apiFavorites.getAll();
      setProducts(Array.isArray(rows) ? rows : []);
      setFavoriteIds(new Set((rows || []).map((product) => String(product.id || product._id))));
    } catch {
      setProducts([]);
      setFavoriteIds(new Set());
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleFavorite = async (productId) => {
    try {
      await apiFavorites.toggle(productId);
      setProducts((current) => current.filter((product) => String(product.id || product._id) !== String(productId)));
      setFavoriteIds((current) => {
        const next = new Set(current);
        next.delete(String(productId));
        return next;
      });
    } catch (error) {
      await alert({
        title: "Lỗi",
        message: error.message,
        variant: "danger"
      });
    }
  };


  return (
    <div className="page-container saved-products-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">SAVED SEAFOOD</span>
          <h1><Bookmark size={25} /> Đã lưu</h1>
          <p>Các mẻ hải sản bạn muốn theo dõi hoặc liên hệ lại.</p>
        </div>
      </header>
      <ProductGrid favorites={favoriteIds} onToggleFavorite={toggleFavorite} products={products} />
    </div>
  );
}
