import ProductCard from "./ProductCard";

export default function ProductGrid({
  products = [],
  favorites = new Set(),
  onToggleFavorite,
  onOpenSeller,
  viewerLocation,
}) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <p>Không tìm thấy mẻ hải sản phù hợp với bộ lọc.</p>
      </div>
    );
  }

  return (
    <div className="market-product-grid">
      {products.map((product) => {
        const id = product.id || product._id;
        return (
          <ProductCard
            isFavorite={favorites.has(id)}
            key={id}
            onOpenSeller={onOpenSeller}
            onToggleFavorite={onToggleFavorite}
            product={product}
            viewerLocation={viewerLocation}
          />
        );
      })}
    </div>
  );
}
