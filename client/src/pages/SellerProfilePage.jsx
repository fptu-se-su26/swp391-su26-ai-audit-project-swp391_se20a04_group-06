/**
 * SellerProfilePage.jsx — Khắc phục hoàn toàn lỗi lặp render của LazyTab
 * Trang hồ sơ thông tin công khai của người bán/ngư dân
 */

// Nhập các hook của React phục vụ quản lý trạng thái hiển thị và tác vụ vòng đời
import { useState, useEffect } from "react";
// Nhập hook useNavigate của react-router-dom để hỗ trợ chuyển đổi trang web
import { useNavigate } from "react-router-dom";
// Nhập bảng cấu hình màu sắc giao diện hệ thống C
import { C } from "../utils/theme";
// Nhập helper api thực hiện yêu cầu HTTP
import { api } from "../services/api";
// Nhập component ProductCard kết xuất thông tin mẻ hải sản đăng bán
import { ProductCard } from "../components/ProductCard";
// Nhập component ReviewList hiển thị danh sách nhận xét đánh giá của người mua
import { ReviewList } from "../components/ReviewList";
// Nhập hook useAuth đọc dữ liệu tài khoản đăng nhập hiện hành từ Context
import { useAuth } from "../context/AuthContext";
// Nhập hook useApiFetch tự thiết kế để gọi API lấy dữ liệu tĩnh bất đồng bộ kèm loading
import { useApiFetch } from "../hooks/useApiFetch";
// Nhập component FishermanProfileHeader vẽ phần đầu trang hồ sơ ngư dân (tích xanh, theo dõi, stats)
import { FishermanProfileHeader } from "../components/FishermanProfileHeader";
// Nhập component FishermanRecipesTab kết xuất danh sách công thức nấu ăn của ngư dân tương ứng
import { FishermanRecipesTab } from "./tabs/FishermanRecipesTab";
// Nhập component FishermanPostsTab kết xuất danh sách bài viết diễn đàn của ngư dân tương ứng
import { FishermanPostsTab } from "./tabs/FishermanPostsTab";
// Nhập component FishermanBoatLogsTab kết xuất nhật ký hành trình cabin đi biển của ngư dân
import { FishermanBoatLogsTab } from "./tabs/FishermanBoatLogsTab";

// Định nghĩa component phụ trợ LazyTab nhằm tải chậm nội dung tab (chỉ render DOM khi người dùng click xem tab)
function LazyTab({ active, children }) {
  // State ghi nhận xem tab tương ứng đã từng được click kích hoạt hay chưa, mặc định lấy theo trạng thái active truyền vào
  const [hasBeenActive, setHasBeenActive] = useState(active);

  // useEffect lắng nghe sự thay đổi trạng thái hoạt động của tab
  useEffect(() => {
    // Chỉ kích hoạt render lần đầu khi tab thực sự chuyển đổi từ Inactive sang Active
    if (active && !hasBeenActive) {
      // Đẩy luồng thay đổi state vào hàng đợi microtask bất đồng bộ (Promise.resolve)
      // Việc này giúp React tách biệt các chu kỳ render và ngăn ngừa lỗi Cascading Render (lặp render do cập nhật state chồng chéo)
      Promise.resolve().then(() => setHasBeenActive(true));
    }
  }, [active, hasBeenActive]);

  // Nếu tab chưa từng được kích hoạt xem, trả về null (không render DOM để tối ưu hóa hiệu năng)
  if (!hasBeenActive) return null;
  
  // Trả về DOM chứa nội dung, ẩn đi bằng cách gán style display: none nếu tab không hoạt động hiện thời
  return <div style={{ display: active ? "block" : "none" }}>{children}</div>;
}

// Khai báo và xuất component SellerProfilePage hiển thị trang cá nhân công khai của người bán
export function SellerProfilePage({ seller }) {
  // Đọc thông tin tài khoản đăng nhập hiện tại từ Context
  const { user } = useAuth();
  // Khởi tạo đối tượng điều hướng trang
  const navigate = useNavigate();
  // State lưu trữ mảng sản phẩm đăng bán của người bán này
  const [products, setProducts] = useState([]);
  // State quản lý hiệu ứng đang tải sản phẩm, mặc định ban đầu là true
  const [loading, setLoading] = useState(true);
  // State lưu tên tab đang hoạt động, mặc định hiển thị tab danh mục sản phẩm ("products")
  const [tab, setTab] = useState("products");
  // State quản lý bộ lọc phân loại sản phẩm: tất cả ("all"), tươi sống ("fresh"), hay đồ khô ("dried")
  const [typeFilter, setTypeFilter] = useState("all");
  // State lưu trữ ID của bộ lọc đang được di chuột qua để tạo hiệu ứng hover
  const [hoveredFilter, setHoveredFilter] = useState(null);

  // Gọi hook useApiFetch để tự động lấy thông tin thống kê hồ sơ ngư dân (stats bài viết, lượt đánh giá) từ Backend
  const { data: profile, loading: profileLoading } = useApiFetch(
    `/fishermen/${seller.id}/profile`,
    [seller.id], // Phụ thuộc vào ID người bán, sẽ gọi lại nếu ID thay đổi
  );

  // useEffect lấy danh sách mẻ hải sản đăng bán của ngư dân từ backend khi vừa tải trang
  useEffect(() => {
    // Nếu thiếu thông tin định danh của người bán thì quay lại trang chủ
    if (!seller?.id) {
      navigate("/");
      return;
    }
    // Gọi API lấy tối đa 100 sản phẩm do ngư dân này đăng bán
    api(`/products?sellerId=${seller.id}&limit=100`)
      .then((data) => setProducts(data.data || [])) // Lưu kết quả vào state products
      .catch(() => {}) // Im lặng bỏ qua lỗi
      .finally(() => setLoading(false)); // Tắt hiệu ứng loading khi hoàn tất
  }, [seller?.id, navigate]);

  // Bộ lọc sản phẩm mẻ hàng dựa trên giá trị của state typeFilter
  const filtered = products.filter((p) => {
    if (typeFilter === "fresh") return p.type === "Fresh"; // Chỉ lấy hải sản tươi sống
    if (typeFilter === "dried") return p.type === "Dried"; // Chỉ lấy hải sản khô đóng gói
    return true; // Lấy tất cả
  });

  // Nếu không có ID người bán thì không kết xuất gì
  if (!seller?.id) return null;

  return (
    <div
      style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}
    >
      {/* Nút bấm quay trở về trang chủ */}
      <button
        onClick={() => navigate("/")}
        style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          color: C.ocean,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 13,
          marginBottom: 20,
          padding: "8px 16px",
          borderRadius: 10,
          fontFamily: "inherit",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#F1F5F9";
          e.currentTarget.style.borderColor = C.ocean;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = C.white;
          e.currentTarget.style.borderColor = C.border;
        }}
      >
        ⟨ Quay lại trang chủ
      </button>

      {/* ── Khối phần đầu thông tin ngư dân (Header Component) ── */}
      <FishermanProfileHeader
        profile={profile}
        isLoading={profileLoading}
        sellerId={seller.id}
      />

      {/* ── Thanh điều hướng chọn Tab hiển thị (Tab Bar) ── */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#E2E8F0",
          borderRadius: 12,
          padding: 4,
          width: "fit-content",
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {/* Lặp qua mảng các tab để tạo nút bấm chuyển tab tương ứng */}
        {[
          ["products", `🐟 Gian hàng (${products.length})`],
          [
            "recipes",
            `🍳 Công thức (${profile?.stats?.totalRecipes ?? "..."})`,
          ],
          ["posts", `💬 Cộng đồng (${profile?.stats?.totalPosts ?? "..."})`],
          [
            "boatlogs",
            `⛵ Nhật ký (${profile?.stats?.totalBoatLogs ?? "..."})`,
          ],
          ["reviews", `⭐ Đánh giá (${profile?.stats?.ratingCount ?? "..."})`],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)} // Chuyển đổi tab hoạt động khi click
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "inherit",
              // Nếu đang active thì tô nền trắng và đổi màu chữ sang xanh ocean
              background: tab === k ? C.white : "transparent",
              color: tab === k ? C.ocean : C.muted,
              boxShadow: tab === k ? "0 4px 10px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.2s",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ── TAB NỘI DUNG: GIAN HÀNG SẢN PHẨM ── */}
      {tab === "products" && (
        <>
          {/* Thanh lọc loại hải sản Tươi sống / Khô đóng gói */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {[
              { id: "all", label: "Tất cả" },
              { id: "fresh", label: "🌊 Hải sản tươi sống" },
              { id: "dried", label: "🔥 Hải sản khô đóng gói" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)} // Cập nhật bộ lọc loại hải sản
                onMouseEnter={() => setHoveredFilter(f.id)}
                onMouseLeave={() => setHoveredFilter(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 24,
                  border: `1.5px solid ${typeFilter === f.id ? C.ocean : "transparent"}`,
                  background:
                    typeFilter === f.id
                      ? C.oceanP
                      : hoveredFilter === f.id
                        ? "#EDF2F7"
                        : C.white,
                  color: typeFilter === f.id ? C.ocean : C.text,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s ease",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Kết xuất danh sách sản phẩm hoặc Shimmer Loading */}
          {loading ? (
            <div className="product-grid">
              {/* Vẽ 4 khung xương shimmer khi đang load */}
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton-shimmer"
                  style={{ height: 280, borderRadius: 20 }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            // Hiển thị thông báo trống nếu không tìm thấy sản phẩm phù hợp
            <div
              style={{
                textAlign: "center",
                padding: "64px 20px",
                color: C.muted,
                background: C.white,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>
                Gian hàng hiện chưa bày bán sản phẩm nào
              </div>
            </div>
          ) : (
            // Vẽ lưới các mẻ hải sản bằng component ProductCard
            <div className="product-grid">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB NỘI DUNG: CÔNG THỨC CHẾ BIẾN (Tải chậm qua LazyTab) ── */}
      <LazyTab active={tab === "recipes"}>
        <FishermanRecipesTab sellerId={seller.id} />
      </LazyTab>

      {/* ── TAB NỘI DUNG: BÀI ĐĂNG CỘNG ĐỒNG (Tải chậm qua LazyTab) ── */}
      <LazyTab active={tab === "posts"}>
        <FishermanPostsTab sellerId={seller.id} />
      </LazyTab>

      {/* ── TAB NỘI DUNG: NHẬT KÝ CABIN ĐI BIỂN (Tải chậm qua LazyTab) ── */}
      <LazyTab active={tab === "boatlogs"}>
        <FishermanBoatLogsTab sellerId={seller.id} />
      </LazyTab>

      {/* ── TAB NỘI DUNG: NHẬN XÉT ĐÁNH GIÁ ── */}
      {tab === "reviews" && (
        <ReviewList sellerId={seller.id} user={user} productId={null} />
      )}
    </div>
  );
}
