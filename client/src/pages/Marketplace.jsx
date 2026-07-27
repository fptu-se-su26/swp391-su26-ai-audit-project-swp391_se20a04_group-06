import { useEffect, useMemo, useState } from "react";
import { LocateFixed, RefreshCw, Search, Ship, Anchor, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import LandingBatchCard from "../components/LandingBatchCard";
import ProductGrid from "../components/ProductGrid";
import { useAuth } from "../context/AuthContext";
import {
  apiFavorites,
  apiLandingBatches,
  apiProducts,
} from "../services/api";
import { useConfirm } from "../context/ConfirmContext";
import { getCategoryLabel } from "../utils/labelMaps";
import useSEO from "../hooks/useSEO";



export default function Marketplace() {
  useSEO("Chợ hải sản", "Khám phá các mẻ hải sản mới cập cảng và kết nối trực tiếp với ngư dân.");
  const { alert } = useConfirm();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("fresh");
  const [showFilters, setShowFilters] = useState(false);
  const [viewerLocation, setViewerLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("viewerLocation");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
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
    const handleLocationUpdate = () => {
      try {
        const saved = localStorage.getItem("viewerLocation");
        if (saved) {
          setViewerLocation(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Error reading updated location:", e);
      }
    };
    window.addEventListener("locationUpdated", handleLocationUpdate);
    
    // Also try to check and run geolocation on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const loc = { latitude: coords.latitude, longitude: coords.longitude };
          setViewerLocation(loc);
          localStorage.setItem("viewerLocation", JSON.stringify(loc));
          window.dispatchEvent(new Event("locationUpdated"));
        },
        (error) => {
          console.warn("Auto geolocation failed in Marketplace:", error);
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    }

    return () => window.removeEventListener("locationUpdated", handleLocationUpdate);
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
        const loc = { latitude: coords.latitude, longitude: coords.longitude };
        setViewerLocation(loc);
        localStorage.setItem("viewerLocation", JSON.stringify(loc));
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
    <div className="marketplace-page page-container" style={{ paddingTop: "1rem" }}>
      {/* Compact Top Header Bar */}
      <header className="page-heading" data-tour="marketplace-heading" style={{ marginBottom: "0.75rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "800", margin: 0, color: "#0f172a" }}>Chợ hải sản</h1>
          
          {/* Compact View Mode Tabs */}
          <div className="marketplace-view-tabs" data-tour="marketplace-view-tabs" role="tablist" aria-label="Kiểu hiển thị chợ" style={{ margin: 0 }}>
            <button
              aria-selected={viewMode === "products"}
              className={viewMode === "products" ? "is-active" : ""}
              onClick={() => setViewMode("products")}
              role="tab"
              type="button"
              style={{ padding: "5px 12px", fontSize: "0.85rem" }}
            >
              Theo sản phẩm ({filteredProducts.length})
            </button>
            <button
              aria-selected={viewMode === "batches"}
              className={viewMode === "batches" ? "is-active" : ""}
              onClick={() => setViewMode("batches")}
              role="tab"
              type="button"
              style={{ padding: "5px 12px", fontSize: "0.85rem" }}
            >
              Theo vựa cá ({landingBatches.length})
            </button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            className={`button ${showFilters || search || category !== "All" || type !== "All" ? "button--primary" : "button--secondary"}`}
            onClick={() => setShowFilters(!showFilters)}
            type="button"
            style={{ padding: "6px 14px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <SlidersHorizontal size={15} />
            <span>Tìm kiếm & Bộ lọc</span>
            {(search || category !== "All" || type !== "All") && (
              <span style={{ background: "#ffffff", color: "#0284c7", borderRadius: "10px", padding: "1px 6px", fontSize: "0.75rem", fontWeight: "bold" }}>●</span>
            )}
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {viewerLocation ? (
            <button
              className="button button--secondary button--active"
              onClick={useCurrentLocation}
              type="button"
              style={{ padding: "6px 12px", fontSize: "0.85rem" }}
            >
              <LocateFixed size={15} /> Đã xác định vị trí
            </button>
          ) : (
            <button className="button button--secondary" onClick={useCurrentLocation} type="button" style={{ padding: "6px 12px", fontSize: "0.85rem" }}>
              <LocateFixed size={15} /> Dùng vị trí của tôi
            </button>
          )}
        </div>
      </header>

      {locationMessage && <p className="inline-notice" style={{ margin: "0 0 0.5rem 0" }}>{locationMessage}</p>}
      {loadError && (
        <div className="inline-notice inline-notice--danger" style={{ marginBottom: "0.5rem" }}>
          <span>⚠️</span> {loadError}
        </div>
      )}

      {/* Sleek Collapsible Filter Bar */}
      {showFilters && (
        <section className="marketplace-filters" aria-label={viewMode === "products" ? "Bộ lọc sản phẩm" : "Tìm vựa cá"} data-tour="marketplace-filters" style={{ padding: "12px 16px", borderRadius: "12px", marginBottom: "1.25rem", background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", width: "100%" }}>
            <label className="search-field" data-tour="marketplace-search" style={{ flex: "1 1 240px", margin: 0, height: "38px" }}>
              <Search size={16} />
              <span className="visually-hidden">Tìm kiếm</span>
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm cua, tôm, cá biển, người bán..."
                type="search"
                value={search}
                style={{ height: "36px", fontSize: "0.88rem" }}
              />
            </label>

            {viewMode === "products" && (
              <select onChange={(event) => setCategory(event.target.value)} value={category} style={{ height: "38px", padding: "0 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}>
                {categories.map((item) => (
                  <option key={item} value={item}>{item === "All" ? "Tất cả danh mục" : getCategoryLabel(item)}</option>
                ))}
              </select>
            )}

            {viewMode === "products" && (
              <select onChange={(event) => setSort(event.target.value)} value={sort} style={{ height: "38px", padding: "0 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}>
                <option value="fresh">Mới nhất</option>
                <option value="price-low">Giá tăng dần</option>
                <option value="price-high">Giá giảm dần</option>
                <option value="popular">Xem nhiều nhất</option>
              </select>
            )}

            <button className="button button--ghost" onClick={resetFilters} type="button" style={{ height: "38px", padding: "0 10px", fontSize: "0.82rem" }}>
              <RefreshCw size={14} /> Đặt lại
            </button>
          </div>
        </section>
      )}

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

