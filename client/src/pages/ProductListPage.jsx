// Import các React hook quan trọng phục vụ quản lý state, vòng đời, tham chiếu và tối ưu hiệu năng
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
// Import helper gọi API dùng chung
import { api } from "../services/api";
// Import component thẻ hiển thị sản phẩm (ProductCard) và bộ khung xương chờ tải (ProductSkeleton)
import { ProductCard, ProductSkeleton } from "../components/ProductCard";
// Import component hiển thị bản đồ tìm kiếm ngư thuyền (MapExplore)
import { MapExplore } from "../components/MapExplore";
// Import hook tối ưu SEO tiêu đề, mô tả
import { useSEO } from "../hooks/useSEO";
// Import hook điều hướng trang sử dụng hiệu ứng View Transition
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";
// Import hook lấy thông tin tài khoản đăng nhập hiện hành
import { useAuth } from "../context/AuthContext";
// Import các đối tượng định tuyến từ thư viện react-router-dom
import { useLocation, useNavigate } from "react-router-dom";

// Khai báo hằng số số lượng phần tử trên mỗi trang phân trang
const PAGE_SIZE = 20;
// Khai báo khóa lưu trữ vị trí cuộn trang trong sessionStorage
const SCROLL_KEY = "productlistpage_scroll_y";

// Danh sách danh mục sản phẩm (Categories) kèm nhãn biểu tượng emoji
const CATEGORY_CHIPS = [
  { id: "All", label: "Tất cả loài", emoji: "🏷️" },
  { id: "Fish", label: "Cá tươi sạch", emoji: "🐟" },
  { id: "Shrimp", label: "Tôm biển", emoji: "🦐" },
  { id: "Squid", label: "Mực, Bạch tuộc", emoji: "🦑" },
  { id: "Crab", label: "Cua, Ghẹ", emoji: "🦀" },
  { id: "Shellfish", label: "Nghêu, Sò, Ốc", emoji: "🐚" },
  { id: "Others", label: "Loại khác", emoji: "✨" },
];

// Component chính hiển thị danh sách sản phẩm chợ hải sản
export function ProductListPage() {
  // Lấy thông tin user hiện tại từ context Auth
  const { user } = useAuth();
  // Hook điều hướng View Transition dùng khi chuyển sang các trang chi tiết khác
  const vtNavigate = useViewTransitionNavigate();
  // Hook điều hướng thông thường (plain) dùng khi thay đổi bộ lọc cùng trang (tab, category, search)
  const plainNavigate = useNavigate();
  // Đối tượng chứa thông tin đường dẫn URL hiện tại
  const location = useLocation();

  // Khởi tạo đối tượng phân tích tham số truy vấn URL làm dữ liệu nguồn gốc duy nhất (Single Source of Truth)
  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  // Lấy các tham số truy vấn tìm kiếm, danh mục và tab từ URL
  const searchParam = queryParams.get("search") || "";
  const categoryParam = queryParams.get("category") || "All";
  const tabParam = queryParams.get("tab") || "fresh";

  // State cục bộ quản lý giá trị nhập trong ô tìm kiếm
  const [searchInput, setSearchInput] = useState(searchParam);
  // State phụ dùng để đồng bộ hóa giá trị tìm kiếm khi URL thay đổi (như khi người dùng bấm xóa bộ lọc)
  const [prevSearchParam, setPrevSearchParam] = useState(searchParam);

  // Đồng bộ hóa ô nhập tìm kiếm nếu tham số search trên URL bị thay đổi từ bên ngoài
  if (prevSearchParam !== searchParam) {
    setPrevSearchParam(searchParam);
    setSearchInput(searchParam);
  }

  // State lưu trữ tọa độ GPS của người dùng (lấy từ localStorage hoặc yêu cầu từ trình duyệt)
  const [gps, setGps] = useState(() => {
    const savedLat = localStorage.getItem("seafood_lat");
    const savedLng = localStorage.getItem("seafood_lng");
    if (savedLat && savedLng) {
      return {
        status: "ok",
        lat: parseFloat(savedLat),
        lng: parseFloat(savedLng),
      };
    }
    if (!navigator.geolocation) {
      return { status: "denied", lat: null, lng: null };
    }
    return { status: "idle", lat: null, lng: null };
  });

  // State quản lý danh sách sản phẩm lấy từ API
  const [products, setProducts] = useState([]);
  // State quản lý trạng thái tải dữ liệu lần đầu tiên (hiển thị skeletons)
  const [loading, setLoading] = useState(true);
  // State quản lý trạng thái tải lại danh sách khi đổi tab/category/tìm kiếm (giữ nguyên layout cũ và làm mờ nhẹ grid)
  const [refreshing, setRefreshing] = useState(false);
  // State quản lý trạng thái tải thêm sản phẩm khi cuộn trang (phân trang vô hạn)
  const [loadingMore, setLoadingMore] = useState(false);

  // Biến Ref đánh dấu lần tải trang đầu tiên
  const isFirstLoadRef = useRef(true);
  // State quản lý thông điệp báo lỗi từ API
  const [error, setError] = useState("");
  // State quản lý chế độ xem (lưới sản phẩm hoặc bản đồ)
  const [viewMode, setViewMode] = useState("grid");
  // State quản lý tiêu chí sắp xếp sản phẩm
  const [sort, setSort] = useState("newest");
  // State quản lý danh sách ID các sản phẩm đã được yêu thích bởi user
  const [favoriteIds, setFavoriteIds] = useState([]);
  // State quản lý số trang hiện tại phục vụ phân trang vô hạn
  const [page, setPage] = useState(1);
  // State đánh dấu xem còn dữ liệu ở các trang tiếp theo hay không
  const [hasMore, setHasMore] = useState(true);

  // Các Ref phục vụ theo dõi phần tử sentinel cuối danh sách để kích hoạt tải thêm (Infinite Scroll)
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  // Một Ref chứa toàn bộ giá trị state mới nhất để hàm callback fetchNextPage luôn truy cập được dữ liệu mới mà không bị stale closure
  const stateRef = useRef({
    page,
    hasMore,
    loadingMore,
    loading,
    refreshing: false,
    tab: tabParam,
    category: categoryParam,
    gps,
    search: searchParam,
  });

  // Đồng bộ hóa stateRef mỗi khi các dependencies thay đổi giá trị
  useEffect(() => {
    stateRef.current = {
      page,
      hasMore,
      loadingMore,
      loading,
      refreshing,
      tab: tabParam,
      category: categoryParam,
      gps,
      search: searchParam,
    };
  }, [
    page,
    hasMore,
    loadingMore,
    loading,
    refreshing,
    tabParam,
    categoryParam,
    gps,
    searchParam,
  ]);

  // Cấu hình thẻ SEO meta title/description cho trang danh sách sản phẩm
  useSEO({
    title: "Chợ Hải Sản Bản Địa Trực Tuyến | Haisan.vn",
    description:
      "Chợ hải sản trực tuyến Haisan.vn - Mua hải sản tươi sống trực tiếp từ các ngư thuyền cập cảng Việt Nam.",
  });

  // Sắp xếp danh sách sản phẩm phía client dựa trên state 'sort' được chọn
  const sortedProducts = useMemo(
    () =>
      [...products].sort((a, b) => {
        if (sort === "price_asc")
          return parseFloat(a.price) - parseFloat(b.price);
        if (sort === "price_desc")
          return parseFloat(b.price) - parseFloat(a.price);
        if (sort === "rating")
          return (
            parseFloat(b.sellerRating || 0) - parseFloat(a.sellerRating || 0)
          );
        if (sort === "views") return (b.viewCount || 0) - (a.viewCount || 0);
        // Mặc định sắp xếp theo thời gian đăng/đẩy bài
        const bTime = b.bumpedAt ? new Date(b.bumpedAt) : new Date(b.createdAt);
        const aTime = a.bumpedAt ? new Date(a.bumpedAt) : new Date(a.createdAt);
        return bTime - aTime;
      }),
    [products, sort],
  );

  /* ─── GPS (Tự động phát hiện vị trí chạy ngầm) ─── */
  useEffect(() => {
    if (gps.status !== "idle") return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Lưu tọa độ của người dùng vào localStorage để tái sử dụng
        localStorage.setItem("seafood_lat", pos.coords.latitude);
        localStorage.setItem("seafood_lng", pos.coords.longitude);
        setGps({
          status: "ok",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      // Nếu bị từ chối quyền định vị
      () => setGps({ status: "denied", lat: null, lng: null }),
    );
  }, [gps.status]);

  // Lấy danh sách ID sản phẩm ưa thích của người dùng khi đã đăng nhập
  useEffect(() => {
    if (!user) return;
    api("/favorites/ids")
      .then((ids) => setFavoriteIds(ids))
      .catch(() => {});
  }, [user]);

  // Hàm tạo query params để gửi lên API dựa vào trạng thái hiện tại
  const buildParams = useCallback(
    (pageNum, currentSearch) => {
      const params = new URLSearchParams({
        type: tabParam === "fresh" ? "Fresh" : "Dried",
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      if (currentSearch) params.set("search", currentSearch);
      if (categoryParam && categoryParam !== "All")
        params.set("category", categoryParam);
      // Nếu là tab hải sản tươi sống và có tọa độ GPS, gửi kèm để sắp xếp theo khoảng cách
      if (tabParam === "fresh" && gps.lat) {
        params.set("lat", String(gps.lat));
        params.set("lng", String(gps.lng));
      }
      return params;
    },
    [tabParam, categoryParam, gps.lat, gps.lng],
  );

  // Hàm tải dữ liệu trang đầu tiên (Page 1)
  const fetchPage1 = useCallback(
    async (currentSearch, signal) => {
      // Hiện skeletons nếu đây là lần tải đầu tiên, ngược lại chỉ làm mờ màn hình (refreshing)
      if (isFirstLoadRef.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      isFirstLoadRef.current = false;

      setError("");
      setPage(1);
      setHasMore(true);
      try {
        const data = await api(`/products?${buildParams(1, currentSearch)}`, {
          signal,
        });
        const items = data.data || [];
        setProducts(items);
        // Nếu số lượng phần tử trả về nhỏ hơn kích thước trang thì đánh dấu hết dữ liệu để phân trang
        setHasMore(items.length === PAGE_SIZE);
      } catch (e) {
        // Tránh ghi nhận lỗi hiển thị nếu yêu cầu bị hủy bỏ chủ động do đổi bộ lọc nhanh
        if (e?.name !== "AbortError" && !signal?.aborted) {
          setError(e.message);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [buildParams],
  );

  // Effect chạy ngầm thực hiện debounce gọi API khi các tham số tìm kiếm hoặc bộ lọc thay đổi
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    // Áp dụng trì hoãn 250ms khi đổi tab/category và 400ms khi gõ tìm kiếm để giảm tải tần suất gọi API lên server
    const delay = searchParam ? 400 : 250;
    const t = setTimeout(() => {
      fetchPage1(searchParam, signal);
    }, delay);

    return () => {
      clearTimeout(t);
      controller.abort(); // Hủy yêu cầu cũ ngay khi dependency (tab, category, search) thay đổi liên tục
    };
  }, [fetchPage1, searchParam]);

  // Hàm xử lý cuộn trang để tải thêm dữ liệu trang tiếp theo (Infinite Scroll)
  const fetchNextPage = useCallback(async () => {
    // Lấy thông tin state mới nhất từ stateRef
    const {
      loadingMore: lm,
      hasMore: hm,
      loading: ld,
      refreshing: rf,
      tab: t,
      category: cat,
      gps: g,
      search: s,
      page: p,
    } = stateRef.current;
    // Ngăn chặn gọi API nếu đang tải thêm, đã hết trang, đang tải trang 1 hoặc đang refresh
    if (lm || !hm || ld || rf) return;

    setLoadingMore(true);
    const nextPage = p + 1;
    const params = new URLSearchParams({
      type: t === "fresh" ? "Fresh" : "Dried",
      page: String(nextPage),
      limit: String(PAGE_SIZE),
    });
    if (s) params.set("search", s);
    if (cat && cat !== "All") params.set("category", cat);
    if (t === "fresh" && g.lat) {
      params.set("lat", String(g.lat));
      params.set("lng", String(g.lng));
    }

    try {
      const data = await api(`/products?${params}`);
      const items = data.data || [];
      // Ghép nối thêm danh sách sản phẩm mới tải vào danh sách cũ
      setProducts((prev) => [...prev, ...items]);
      setPage(nextPage);
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      /* silent - bỏ qua lỗi */
    } finally {
      setLoadingMore(false);
    }
  }, []);

  // Thiết lập IntersectionObserver để lắng nghe khi phần tử sentinel cuộn vào khung nhìn màn hình
  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px" }, // Tải trước khi người dùng cuộn đến cách đáy 200px
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [fetchNextPage]);

  // Khôi phục lại vị trí cuộn trang (Scroll Y) trước đó sau khi tải xong sản phẩm
  useEffect(() => {
    if (loading) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      window.scrollTo({ top: parseInt(saved, 10), behavior: "instant" });
      sessionStorage.removeItem(SCROLL_KEY);
    }
  }, [loading]);

  // Xử lý khi người dùng nhấn vào thẻ sản phẩm chi tiết
  const handleProductClick = useCallback(
    (productId) => {
      // Lưu lại vị trí cuộn hiện tại để quay về không bị mất vị trí đang xem dở
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      vtNavigate(`/san-pham/${productId}`);
    },
    [vtNavigate],
  );

  // Xử lý cập nhật danh sách ID sản phẩm ưa thích cục bộ khi người dùng bấm nút tim thích
  const handleFavoriteChange = useCallback((id, fav) => {
    setFavoriteIds((prev) =>
      fav ? [...prev, id] : prev.filter((x) => x !== id),
    );
  }, []);

  // Xử lý khi bấm chuyển đổi Tab (Tươi sống / Đồ khô)
  const handleTabClick = (k) => {
    if (tabParam !== k) {
      const params = new URLSearchParams(location.search);
      params.set("tab", k);
      params.set("category", "All"); // Reset lại danh mục khi đổi loại hàng
      plainNavigate(`/san-pham?${params.toString()}`);
    }
  };

  // Xử lý khi chọn một danh mục cụ thể (Category Chips)
  const handleCategorySelect = (catId) => {
    if (categoryParam !== catId) {
      const params = new URLSearchParams(location.search);
      params.set("category", catId);
      plainNavigate(`/san-pham?${params.toString()}`);
    }
  };

  // Xử lý submit biểu mẫu tìm kiếm
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(location.search);
    if (searchInput.trim()) {
      params.set("search", searchInput.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    plainNavigate(`/san-pham?${params.toString()}`);
  };

  // Xử lý xóa nội dung tìm kiếm (nút X)
  const handleClearSearch = () => {
    setSearchInput("");
    const params = new URLSearchParams(location.search);
    params.delete("search");
    plainNavigate(`/san-pham?${params.toString()}`);
  };

  return (
    <div
      className="page-wrap-lg fade-up"
      style={{ padding: "0 66px", margin: "0 auto", maxWidth: "1200px" }}
    >
      {/* ═══ KHU VỰC BỘ LỌC VÀ SẢN PHẨM TRÊN NỀN MÀU XANH ═══ */}
      <div className="products-filter-section" style={{ marginTop: "30px" }}>
        {/* Dòng điều khiển các bộ lọc (Chứa Tab bên trái, Ô tìm kiếm ở giữa, Sắp xếp bên phải) */}
        <div
          className="filter-controls-row"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            paddingTop: "24px",
          }}
        >
          {/* Phía trái: Thanh chọn tab dạng viên thuốc phân đoạn (Tươi sống / Đồ khô) */}
          <div className="filter-tab-pill-container">
            <button
              onClick={() => handleTabClick("fresh")}
              className={tabParam === "fresh" ? "active" : ""}
            >
              Hải sản tươi
            </button>
            <button
              onClick={() => handleTabClick("dried")}
              className={tabParam === "dried" ? "active" : ""}
            >
              Hải sản khô
            </button>
          </div>

          {/* Ở giữa: Thanh tìm kiếm sản phẩm nhỏ gọn mới */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: "flex",
              flex: "1 1 200px",
              maxWidth: "280px", // Đặt chiều rộng tối đa nhỏ gọn
              backgroundColor: "#fff",
              borderRadius: "20px",
              padding: "2px 4px 2px 12px",
              alignItems: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
              height: "36px", // Thu nhỏ chiều cao
              boxSizing: "border-box",
            }}
          >
            <span
              style={{ fontSize: "14px", marginRight: "6px", opacity: 0.5 }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Tìm cá, mực, tôm..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "13px",
                color: "#333",
                background: "transparent",
                minWidth: "40px",
              }}
            />
            {/* Hiển thị nút xóa nhanh chữ tìm kiếm */}
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "#999",
                  fontSize: "16px",
                  padding: "0 4px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
            <button
              type="submit"
              style={{
                backgroundColor: "#ECD223",
                color: "#166f52",
                border: "none",
                borderRadius: "16px",
                padding: "4px 12px",
                fontWeight: "700",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
                height: "100%",
                display: "flex",
                alignItems: "center",
              }}
            >
              Tìm
            </button>
          </form>

          {/* Phía phải: Các tùy chọn Sắp xếp và nút Chuyển đổi chế độ xem */}
          <div className="sort-view-wrapper">
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Sắp xếp:
            </span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest" style={{ color: "#333" }}>
                Mới nhất / Đã đẩy
              </option>
              <option value="price_asc" style={{ color: "#333" }}>
                Giá tăng dần
              </option>
              <option value="price_desc" style={{ color: "#333" }}>
                Giá giảm dần
              </option>
              <option value="rating" style={{ color: "#333" }}>
                Đánh giá ngư dân
              </option>
              <option value="views" style={{ color: "#333" }}>
                Nhiều lượt xem
              </option>
            </select>

            {/* Chỉ cho phép hiển thị bản đồ khi xem tab Hải sản tươi sống */}
            {tabParam === "fresh" && (
              <div className="view-mode-toggle">
                <button
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "active" : ""}
                >
                  Lưới
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={viewMode === "map" ? "active" : ""}
                >
                  Bản đồ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Nhãn hiển thị từ khóa đang tìm kiếm (Đặt gọn gàng dưới thanh điều khiển) */}
        {searchParam && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              marginTop: "12px",
              marginBottom: "4px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: "#fff",
                background: "rgba(255,255,255,0.15)",
                padding: "4px 12px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backdropFilter: "blur(4px)",
              }}
            >
              Từ khóa: <strong>"{searchParam}"</strong>
              <button
                onClick={handleClearSearch}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: "bold",
                  padding: "0 2px",
                  fontSize: "14px",
                }}
              >
                ×
              </button>
            </span>
          </div>
        )}

        {/* Thanh trượt ngang chứa các nút danh mục sản phẩm (Category Chips) */}
        <div
          className="category-chips-container hide-scrollbar"
          style={{ marginTop: "16px" }}
        >
          {CATEGORY_CHIPS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`category-chip-button ${categoryParam === cat.id ? "active" : ""}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Hiển thị banner báo lỗi nếu có */}
        {error && (
          <div
            className="errorBanner"
            role="alert"
            style={{ margin: "20px 5px" }}
          >
            {error}
          </div>
        )}

        {/* Khu vực danh sách sản phẩm */}
        {loading ? (
          // Hiển thị 8 khung xương skeletons khi đang tải dữ liệu ban đầu
          <div className="product-grid" style={{ padding: "0 5px" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : sortedProducts.length === 0 && !refreshing ? (
          // Hiển thị thông báo khi không tìm thấy bất kỳ sản phẩm nào phù hợp bộ lọc
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
            <h3
              style={{
                color: "#fff",
                fontWeight: "800",
                fontSize: "18px",
                marginBottom: "6px",
              }}
            >
              Không tìm thấy kết quả phù hợp
            </h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
              Hãy thử thay đổi từ khoá hoặc bộ lọc của bạn
            </p>
          </div>
        ) : (
          // Khi đang làm mới (refreshing): Giữ lại grid cũ, chỉ giảm độ mờ (dim) và khóa tương tác chuột
          <div
            style={{
              opacity: refreshing ? 0.45 : 1,
              pointerEvents: refreshing ? "none" : "auto",
              transition: "opacity 0.22s ease",
            }}
          >
            {/* Chế độ xem bản đồ vị trí ngư thuyền */}
            {viewMode === "map" && tabParam === "fresh" ? (
              <div style={{ padding: "0 5px" }}>
                <MapExplore
                  products={sortedProducts}
                  userLocation={
                    gps.status === "ok" ? { lat: gps.lat, lng: gps.lng } : null
                  }
                  onProductClick={(prod) => {
                    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
                    vtNavigate(`/san-pham/${prod.id}`);
                  }}
                />
              </div>
            ) : (
              // Chế độ hiển thị dạng lưới sản phẩm (Grid)
              <>
                <div className="product-grid" style={{ padding: "0 5px" }}>
                  {sortedProducts.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      user={user}
                      cardIndex={i}
                      onClick={handleProductClick}
                      favoriteIds={favoriteIds}
                      onFavoriteChange={handleFavoriteChange}
                    />
                  ))}
                </div>

                {/* Phần tử sentinel đánh dấu chân trang để IntersectionObserver nhận biết và gọi API tải tiếp */}
                <div ref={sentinelRef} style={{ height: 1, marginTop: 32 }} />

                {/* Hiển thị thêm 4 skeletons loading ở dưới khi đang cuộn tải thêm */}
                {loadingMore && (
                  <div
                    className="product-grid"
                    style={{ padding: "20px 5px 0 5px" }}
                  >
                    {Array.from({ length: 4 }).map((_, i) => (
                      <ProductSkeleton key={i} />
                    ))}
                  </div>
                )}

                {/* Thông báo khi đã hiển thị hết danh sách sản phẩm */}
                {!hasMore && products.length > PAGE_SIZE && (
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: "30px",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    Đã hiển thị toàn bộ {sortedProducts.length} sản phẩm
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
