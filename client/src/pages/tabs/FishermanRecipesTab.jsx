// Import hook useNavigate để điều hướng giữa các trang trong React Router
import { useNavigate } from "react-router-dom";
// Import cấu hình theme màu sắc chung của ứng dụng
import { C } from "../../utils/theme";
// Import hook tùy biến useApiFetch để gọi API và quản lý trạng thái load/data
import { useApiFetch } from "../../hooks/useApiFetch";

// Component hiển thị danh sách công thức nấu ăn của một ngư dân cụ thể (trên trang cá nhân người bán)
export function FishermanRecipesTab({ sellerId }) {
  // Đối tượng dùng để chuyển trang
  const navigate = useNavigate();
  // Gọi API lấy tối đa 9 công thức nấu ăn của ngư dân theo sellerId, cập nhật lại khi sellerId thay đổi
  const { data, loading } = useApiFetch(
    `/fishermen/${sellerId}/recipes?limit=9`,
    [sellerId],
  );

  // Lấy mảng công thức nấu ăn từ dữ liệu API trả về (tương thích nhiều cấu trúc trả về khác nhau)
  const recipes = data?.data ?? data?.recipes ?? [];

  // Nếu API đang tải dữ liệu, hiển thị khung xương tải trang (Skeleton Shimmer)
  if (loading) {
    return (
      <div className="product-grid" style={{ gap: 16 }}>
        {/* Tạo 6 ô giả lập có hiệu ứng nhấp nháy làm khung xương */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{ height: 240, borderRadius: 12 }}
          />
        ))}
      </div>
    );
  }

  // Nếu không có công thức nào, hiển thị giao diện trống
  if (recipes.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          background: C.white,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍳</div>
        <div style={{ fontWeight: 700, color: C.dark, marginBottom: 4 }}>
          Chưa có công thức nấu ăn
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>
          Ngư dân chưa chia sẻ bí quyết chế biến nào.
        </div>
      </div>
    );
  }

  // Đối tượng ánh xạ mức độ khó từ tiếng Anh sang tiếng Việt
  const diffLabel = { Easy: "Dễ", Medium: "Vừa", Hard: "Khó" };

  return (
    <div>
      {/* Grid chứa danh sách các thẻ công thức */}
      <div className="product-grid" style={{ gap: 20, marginBottom: 24 }}>
        {recipes.map((r) => (
          <div
            key={r._id}
            // Click vào thẻ để chuyển sang trang chi tiết công thức
            onClick={() => navigate(`/cong-thuc/${r._id}`)}
            style={{
              background: C.white,
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
              cursor: "pointer",
              transition: "transform 0.25s ease, box-shadow 0.25s ease",
            }}
            // Hiệu ứng hover nhấc thẻ lên và đổ bóng
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
            }}
            // Reset hiệu ứng khi chuột rời đi
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Phần hiển thị Ảnh công thức */}
            <div
              style={{
                height: 150,
                background: "#1a7060",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Kiểm tra nếu có link ảnh thì hiển thị thẻ img, ngược lại hiển thị icon cá mặc định */}
              {r.imageUrl ? (
                <img
                  src={r.imageUrl}
                  alt={r.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 48,
                  }}
                >
                  🐟
                </div>
              )}
              {/* Nhãn hiển thị độ khó của công thức nấu ăn được định vị tuyệt đối trên ảnh */}
              <span
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 6,
                }}
              >
                {diffLabel[r.difficulty] ?? r.difficulty}
              </span>
            </div>

            {/* Phần hiển thị thông tin bằng chữ của công thức */}
            <div style={{ padding: "12px 14px" }}>
              {/* Tiêu đề công thức, khống chế tối đa hiển thị 2 dòng kèm dấu ba chấm nếu quá dài */}
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: C.dark,
                  marginBottom: 6,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {r.title}
              </div>
              {/* Hàng thông tin thời gian chế biến, số người ăn, số lượt thích */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  fontSize: 12,
                  color: C.muted,
                }}
              >
                <span>⏱️ {r.cookingTime} phút</span>
                <span>👥 {r.servings} người</span>
                <span>❤️ {r.likes?.length ?? 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Nút Xem thêm: Chỉ hiển thị khi tổng số công thức lớn hơn 9 */}
      {data?.total > 9 && (
        <div style={{ textAlign: "center" }}>
          <button
            // Chuyển hướng sang trang danh sách công thức, lọc theo authorId của ngư dân này
            onClick={() => navigate(`/cong-thuc?authorId=${sellerId}`)}
            style={{
              background: C.white,
              border: `1.5px solid ${C.ocean}`,
              color: C.ocean,
              borderRadius: 10,
              padding: "10px 24px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Xem thêm {data.total - 9} công thức →
          </button>
        </div>
      )}
    </div>
  );
}

