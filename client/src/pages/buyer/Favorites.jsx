import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import ProductGrid from "../../components/ProductGrid";
import { apiProducts } from "../../services/api";

export default function Favorites() {
  const [products, setProducts] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(
    () => new Set(JSON.parse(localStorage.getItem("haisan-favorites") || "[]")),
  );

  useEffect(() => {
    apiProducts
      .getAll()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.products || [];
        setProducts(list.filter((product) => favoriteIds.has(product.id || product._id)));
      })
      .catch((error) => console.error("Failed to load saved products:", error));
  }, [favoriteIds]);

  const toggleFavorite = (productId) => {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      localStorage.setItem("haisan-favorites", JSON.stringify([...next]));
      return next;
    });
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
