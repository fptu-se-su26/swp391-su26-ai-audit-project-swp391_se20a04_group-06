import { useEffect, useMemo, useState } from "react";
import { LocateFixed, RefreshCw, Search } from "lucide-react";
import ProductGrid from "../components/ProductGrid";
import { apiProducts } from "../services/api";

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("fresh");
  const [viewerLocation, setViewerLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [favorites, setFavorites] = useState(
    () => new Set(JSON.parse(localStorage.getItem("haisan-favorites") || "[]")),
  );

  useEffect(() => {
    apiProducts
      .getAll()
      .then((data) => setProducts(Array.isArray(data) ? data : data?.products || []))
      .catch((error) => console.error("Failed to load marketplace:", error));
  }, []);

  useEffect(() => {
    localStorage.setItem("haisan-favorites", JSON.stringify([...favorites]));
  }, [favorites]);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products
      .filter((product) => {
        const searchable = [
          product.name,
          product.description,
          product.sellerName,
          product.origin,
          product.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return (
          (!term || searchable.includes(term)) &&
          (type === "All" || product.type === type) &&
          (category === "All" || product.category === category)
        );
      })
      .sort((a, b) => {
        if (sort === "price-low") return Number(a.price) - Number(b.price);
        if (sort === "price-high") return Number(b.price) - Number(a.price);
        if (sort === "popular") return Number(b.viewCount || 0) - Number(a.viewCount || 0);
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [category, products, search, sort, type]);

  const toggleFavorite = (productId) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Trình duyệt không hỗ trợ định vị.");
      return;
    }
    setLocationMessage("Đang xác định vị trí...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setViewerLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationMessage("Đã tính khoảng cách tới từng người bán.");
      },
      () => setLocationMessage("Không thể truy cập vị trí. Bạn có thể cấp quyền rồi thử lại."),
      { enableHighAccuracy: false, timeout: 8_000 },
    );
  };

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setType("All");
    setSort("fresh");
  };

  return (
    <div className="marketplace-page page-container">
      <header className="page-heading">
        <div>
          <span className="eyebrow">SEAFOOD MARKETPLACE</span>
          <h1>Chợ hải sản</h1>
          <p>Tìm mẻ hàng phù hợp và trao đổi trực tiếp với người bán.</p>
        </div>
        <button className="button button--secondary" onClick={useCurrentLocation} type="button">
          <LocateFixed size={17} /> Dùng vị trí của tôi
        </button>
      </header>

      {locationMessage && <p className="inline-notice">{locationMessage}</p>}

      <section className="marketplace-filters" aria-label="Bộ lọc sản phẩm">
        <label className="search-field">
          <Search size={17} />
          <span className="visually-hidden">Tìm kiếm</span>
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm cua, tôm, cá biển, người bán..."
            type="search"
            value={search}
          />
        </label>

        <label>
          <span>Danh mục</span>
          <select onChange={(event) => setCategory(event.target.value)} value={category}>
            {categories.map((item) => (
              <option key={item} value={item}>{item === "All" ? "Tất cả" : item}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Sắp xếp</span>
          <select onChange={(event) => setSort(event.target.value)} value={sort}>
            <option value="fresh">Mới nhất</option>
            <option value="price-low">Giá tăng dần</option>
            <option value="price-high">Giá giảm dần</option>
            <option value="popular">Xem nhiều nhất</option>
          </select>
        </label>

        <div className="filter-pills">
          {[
            ["All", "Tất cả"],
            ["Fresh", "Tươi sống"],
            ["Dried", "Đồ khô"],
          ].map(([value, label]) => (
            <button
              className={type === value ? "is-active" : ""}
              key={value}
              onClick={() => setType(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <button className="filter-reset" onClick={resetFilters} type="button">
          <RefreshCw size={15} /> Đặt lại
        </button>
      </section>

      <div className="marketplace-results-heading">
        <h2>Mẻ hàng đang bán</h2>
        <span>{filteredProducts.length} kết quả</span>
      </div>

      <ProductGrid
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        products={filteredProducts}
        viewerLocation={viewerLocation}
      />
    </div>
  );
}
