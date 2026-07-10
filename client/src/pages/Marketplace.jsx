import { useEffect, useMemo, useState } from "react";
import { LocateFixed, RefreshCw, Search, Ship, Anchor } from "lucide-react";
import LandingBatchCard from "../components/LandingBatchCard";
import ProductGrid from "../components/ProductGrid";
import { useAuth } from "../context/AuthContext";
import {
  apiFavorites,
  apiLandingBatches,
  apiProducts,
} from "../services/api";
import { useConfirm } from "../context/ConfirmContext";



export default function Marketplace() {
  const { alert } = useConfirm();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("fresh");
  const [viewerLocation, setViewerLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [favorites, setFavorites] = useState(new Set());
  const [landingBatches, setLandingBatches] = useState([]);
  const [viewMode, setViewMode] = useState("products");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    Promise.allSettled([
      apiProducts.getAll(),
      apiLandingBatches.getMarketplace({ limit: 50 }),
    ]).then(([productResult, batchResult]) => {
      if (productResult.status === "fulfilled") {
        const data = productResult.value;
        setProducts(Array.isArray(data) ? data : data?.data || data?.products || []);
      }
      if (batchResult.status === "fulfilled") {
        const data = batchResult.value;
        setLandingBatches(Array.isArray(data) ? data : data?.data || []);
      }
      const rejected = [productResult, batchResult].find(
        (result) => result.status === "rejected",
      );
      if (rejected) setLoadError(rejected.reason?.message || "Lỗi tải dữ liệu");
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      return;
    }
    apiFavorites.getIds()
      .then((ids) => setFavorites(new Set((ids || []).map(String))))
      .catch(() => setFavorites(new Set()));
  }, [user]);

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
  const filteredBatches = useMemo(() => {
    const term = search.trim().toLowerCase();
    return landingBatches
      .filter((batch) =>
        !term ||
        [
          batch.title,
          batch.description,
          batch.sellerName,
          batch.origin,
          batch.catchArea,
          batch.boatName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
      .sort(
        (a, b) =>
          new Date(b.landingTime || b.createdAt || 0) -
          new Date(a.landingTime || a.createdAt || 0),
      );
  }, [landingBatches, search]);

  const toggleFavorite = async (productId) => {
    try {
      const result = await apiFavorites.toggle(productId);
      setFavorites((current) => {
        const next = new Set(current);
        if (result.favorited) next.add(String(productId));
        else next.delete(String(productId));
        return next;
      });
    } catch (error) {
      await alert({
        title: "Lỗi yêu thích",
        message: error.message,
        variant: "danger"
      });
    }

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
      <header className="page-heading" data-tour="marketplace-heading">
        <div>
          <span className="eyebrow">SEAFOOD MARKETPLACE</span>
          <h1>Chợ hải sản</h1>
          <p>Tìm mẻ hàng phù hợp và trao đổi trực tiếp với người bán.</p>
        </div>
        <button className="button button--secondary" data-tour="marketplace-location-button" onClick={useCurrentLocation} type="button">
          <LocateFixed size={17} /> Dùng vị trí của tôi
        </button>
      </header>

      {locationMessage && <p className="inline-notice">{locationMessage}</p>}
      {loadError && <p className="inline-notice inline-notice--warning">{loadError}</p>}

      <div className="marketplace-view-tabs" data-tour="marketplace-view-tabs" role="tablist" aria-label="Kiểu hiển thị chợ">
        <button
          aria-selected={viewMode === "products"}
          className={viewMode === "products" ? "is-active" : ""}
          onClick={() => setViewMode("products")}
          role="tab"
          type="button"
        >
          Theo sản phẩm
        </button>
        <button
          aria-selected={viewMode === "batches"}
          className={viewMode === "batches" ? "is-active" : ""}
          onClick={() => setViewMode("batches")}
          role="tab"
          type="button"
        >
          Theo vựa cá
        </button>
      </div>

      <section className="marketplace-filters" aria-label={viewMode === "products" ? "Bộ lọc sản phẩm" : "Tìm vựa cá"} data-tour="marketplace-filters">
        <label className="search-field" data-tour="marketplace-search">
          <Search size={17} />
          <span className="visually-hidden">Tìm kiếm</span>
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm cua, tôm, cá biển, người bán..."
            type="search"
            value={search}
          />
        </label>

        {viewMode === "products" && (
          <label>
            <span>Danh mục</span>
            <select onChange={(event) => setCategory(event.target.value)} value={category}>
              {categories.map((item) => (
                <option key={item} value={item}>{item === "All" ? "Tất cả" : item}</option>
              ))}
            </select>
          </label>
        )}

        {viewMode === "products" && (
          <label>
            <span>Sắp xếp</span>
            <select onChange={(event) => setSort(event.target.value)} value={sort}>
              <option value="fresh">Mới nhất</option>
              <option value="price-low">Giá tăng dần</option>
              <option value="price-high">Giá giảm dần</option>
              <option value="popular">Xem nhiều nhất</option>
            </select>
          </label>
        )}

        {viewMode === "products" && <div className="filter-pills" data-tour="marketplace-type-filter">
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
        </div>}

        <button className="filter-reset" onClick={resetFilters} type="button">
          <RefreshCw size={15} /> Đặt lại
        </button>
      </section>

      <div className="marketplace-results-heading" data-tour="marketplace-results">
        <h2>{viewMode === "products" ? "Mẻ hàng đang bán" : "Vựa cá đang mở"}</h2>
        <span>{viewMode === "products" ? filteredProducts.length : filteredBatches.length} kết quả</span>
      </div>

      <div className="marketplace-shell">
        {viewMode === "products" ? (
          filteredProducts.length === 0 ? (
            <div className="marketplace-empty-state">
              <div className="empty-state-icon"><Ship size={32} /></div>
              <h3>Chưa có mẻ hàng phù hợp</h3>
              <p>Thử thay đổi bộ lọc hoặc xem tất cả sản phẩm đang bán.</p>
              <div className="marketplace-empty-state__actions">
                <button className="button button--primary" onClick={resetFilters} type="button">Đặt lại bộ lọc</button>
              </div>
            </div>
          ) : (
            <ProductGrid
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              products={filteredProducts}
              viewerLocation={viewerLocation}
            />
          )
        ) : filteredBatches.length === 0 ? (
          <div className="marketplace-empty-state">
            <div className="empty-state-icon"><Anchor size={32} /></div>
            <h3>Chưa có vựa cá phù hợp</h3>
            <p>Hãy thử đổi khu vực, danh mục hoặc xem các phiên cập bến mới nhất.</p>
            <div className="marketplace-empty-state__actions">
              <button className="button button--primary" onClick={resetFilters} type="button">Đặt lại bộ lọc</button>
            </div>
          </div>
        ) : (
          <div className="landing-batch-grid">
            {filteredBatches.map((batch) => (
              <LandingBatchCard batch={batch} key={batch.id || batch._id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

