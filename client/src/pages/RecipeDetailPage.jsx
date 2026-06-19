// Import các React hook quan trọng từ thư viện react
import { useState, useEffect, useRef } from "react";
// Import các hook và component điều hướng từ react-router-dom
import { useParams, Link } from "react-router-dom";
// Import hook cập nhật SEO tiêu đề/mô tả trang
import { useSEO } from "../hooks/useSEO";
// Import hook context quản lý phiên đăng nhập của người dùng
import { useAuth } from "../context/AuthContext";
// Import hook hiển thị thông báo góc màn hình (Toast)
import { useToast } from "../context/ToastContext";
// Import hook điều hướng có tích hợp hiệu ứng View Transition API
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";
// Import helper gọi API dùng chung
import { api } from "../services/api";
// Import component hiển thị badge tài khoản đã được admin xác minh
import { VerifiedBadge } from "../components/VerifiedBadge";
// Import định nghĩa bảng màu theme của dự án
import { C } from "../utils/theme";

/* Hộp thoại xác nhận tùy chỉnh cục bộ (ConfirmDialog) - hiển thị modal khi người dùng bấm xóa */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.75)", // Lớp phủ mờ màu tối phía sau modal
        zIndex: 99999, // Đặt chỉ số z-index lớn để hiển thị đè lên mọi phần tử khác
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onCancel} // Click ra ngoài vùng trắng sẽ đóng modal
    >
      <div
        onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan truyền vào lớp phủ phía sau
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "24px 28px",
          maxWidth: 380,
          width: "100%",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>🗑️</div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: C.dark,
            marginBottom: 20,
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {/* Nút hủy bỏ hành động */}
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#64748b",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Hủy
          </button>
          {/* Nút chấp nhận hành động (Xóa) */}
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              border: "none",
              background: "#EF4444",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
}

// Component chính hiển thị trang chi tiết công thức nấu ăn
export function RecipeDetailPage() {
  // Lấy id công thức từ đường dẫn URL
  const { id } = useParams();
  // Lấy thông tin user hiện tại từ context Auth
  const { user } = useAuth();
  // Khởi tạo các hàm hiển thị toast và hàm điều hướng
  const toast = useToast();
  const navigate = useViewTransitionNavigate();

  // State quản lý dữ liệu chi tiết của công thức
  const [recipe, setRecipe] = useState(null);
  // State quản lý trạng thái tải dữ liệu
  const [loading, setLoading] = useState(true);
  // State quản lý xem user hiện tại đã thích công thức này chưa
  const [liked, setLiked] = useState(false);
  // State quản lý tổng số lượt thích của công thức
  const [likeCount, setLikeCount] = useState(0);
  // State điều khiển việc hiển thị hộp thoại xác nhận xóa
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // State lưu danh sách nguyên liệu đã được tích chọn (để gạch ngang khi đi chợ chuẩn bị)
  const [checkedIngredients, setCheckedIngredients] = useState({});

  // ✅ FIX Bug 2: Lưu toast và navigate vào refs để tránh chúng xuất hiện trong deps array.
  // toast là object mới mỗi lần ToastProvider re-render (khi bất kỳ toast nào show ở đâu đó),
  // nếu để trong deps → useEffect kích hoạt → recipe bị fetch lại liên tục.
  const toastRef = useRef(toast);
  const navigateRef = useRef(navigate);

  // Cập nhật refs sau mỗi render để không bao giờ stale, nhưng KHÔNG trigger re-render lại trang
  useEffect(() => {
    toastRef.current = toast;
    navigateRef.current = navigate;
  });

  // Cập nhật thẻ tiêu đề (meta title) và mô tả (meta description) cho SEO dựa trên dữ liệu công thức
  useSEO({
    title: recipe ? `${recipe.title} | Haisan.vn` : "Đang tải công thức...",
    description: recipe
      ? recipe.description
      : "Đang tải công thức chế biến hải sản...",
  });

  // Tải thông tin chi tiết công thức từ backend khi id hoặc thông tin user thay đổi
  useEffect(() => {
    let cancelled = false; // Biến cờ hiệu để bỏ qua kết quả API nếu component bị unmount giữa chừng

    const loadData = async () => {
      try {
        const data = await api(`/recipes/${id}`);
        if (cancelled) return;
        setRecipe(data);
        setLikeCount(data.likes?.length || 0);
        // Kiểm tra xem ID người dùng hiện tại có nằm trong mảng thích (likes) của công thức không
        if (user && data.likes) {
          setLiked(data.likes.includes(user.userId || user.id));
        }
      } catch (err) {
        if (cancelled) return;
        // ✅ FIX Bug 2: dùng ref thay vì closure trực tiếp — toast/navigate không còn trong deps
        toastRef.current.error(
          err.message || "Không thể tải chi tiết công thức",
        );
        navigateRef.current("/cong-thuc"); // Quay về trang danh sách nếu lỗi
      } finally {
        if (!cancelled) setLoading(false); // Kết thúc trạng thái loading
      }
    };

    loadData();

    // Hủy bỏ trạng thái gọi API nếu component bị hủy
    return () => {
      cancelled = true;
    };
  }, [id, user]); // ← chỉ re-fetch khi id hoặc user thực sự thay đổi

  // Hàm xử lý khi người dùng nhấn thích hoặc bỏ thích công thức nấu ăn
  const handleLike = async () => {
    if (!user) {
      toast.warn("Vui lòng đăng nhập để thích công thức này");
      return;
    }

    try {
      // Gọi API POST thích/bỏ thích công thức
      const res = await api(`/recipes/${id}/like`, { method: "POST" });
      setLiked(res.liked); // Cập nhật lại trạng thái thích (true/false)
      setLikeCount(res.likeCount); // Cập nhật số lượt thích mới
      toast.success(res.liked ? "Đã thích công thức!" : "Đã bỏ thích");
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    }
  };

  // Hàm xử lý xóa công thức (chỉ dành cho tác giả hoặc admin)
  const handleDelete = async () => {
    try {
      await api(`/recipes/${id}`, { method: "DELETE" });
      toast.success("Đã xóa công thức nấu ăn");
      navigate("/cong-thuc"); // Điều hướng về lại trang danh sách công thức
    } catch (err) {
      toast.error(err.message || "Không thể xóa công thức");
    } finally {
      setShowDeleteConfirm(false); // Đóng modal xác nhận xóa
    }
  };

  // Thay đổi trạng thái checkbox nguyên liệu (gạch ngang hoặc bỏ gạch ngang tên nguyên liệu)
  const toggleIngredientCheck = (idx) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [idx]: !prev[idx], // Đảo trạng thái boolean tại chỉ mục idx tương ứng
    }));
  };

  // Giao diện khi đang tải dữ liệu
  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "100px 0",
          color: "var(--muted)",
        }}
      >
        Đang tải công thức nấu ăn...
      </div>
    );
  }

  // Giao diện khi không tìm thấy công thức nấu ăn
  if (!recipe) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        Không tìm thấy công thức nấu ăn.
      </div>
    );
  }

  // Kiểm tra xem user hiện tại có phải tác giả của công thức này hoặc là Admin không
  const isAuthorOrAdmin =
    user &&
    (user.role === "Admin" ||
      recipe.authorId?._id === user.userId ||
      recipe.authorId?._id === user.id);

  return (
    <div className="page-wrap-sm fade-up">
      {/* Hiển thị modal xác nhận xóa nếu state showDeleteConfirm là true */}
      {showDeleteConfirm && (
        <ConfirmDialog
          message="Bạn có chắc chắn muốn xóa công thức này? Thao tác không thể hoàn tác."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Nút quay lại trang danh sách */}
      <Link
        to="/cong-thuc"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: "green",
          textDecoration: "none",
          fontWeight: "600",
          fontSize: "14px",
          marginBottom: "24px",
        }}
      >
        ← Quay lại danh sách công thức
      </Link>

      {/* Phần Header chứa tiêu đề, tags và tác giả */}
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "12px",
          }}
        >
          {/* Hiển thị danh sách thẻ tags của món ăn */}
          {recipe.tags?.map((t) => (
            <span
              key={t}
              style={{
                background: "var(--ocean-p)",
                color: "var(--ocean-d)",
                padding: "4px 10px",
                borderRadius: "99px",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              {t}
            </span>
          ))}
          {/* Hiển thị nhãn độ khó dựa vào giá trị trả về từ server */}
          <span
            style={{
              background: "var(--bg-2)",
              color: "var(--text)",
              padding: "4px 10px",
              borderRadius: "99px",
              fontSize: "12px",
              fontWeight: "600",
              marginLeft: "auto",
            }}
          >
            Độ khó:{" "}
            {recipe.difficulty === "Easy"
              ? "Dễ"
              : recipe.difficulty === "Medium"
                ? "Vừa"
                : "Khó"}
          </span>
        </div>

        {/* Tiêu đề chính của công thức */}
        <h1
          style={{
            fontSize: "2.2rem",
            fontWeight: "900",
            color: "var(--dark)",
            marginBottom: "16px",
            lineHeight: "1.3",
          }}
        >
          {recipe.title}
        </h1>

        {/* Thông tin tác giả đăng tải và các lượt tương tác (xem, thích, xóa) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            borderBottom: "1px solid var(--border-l)",
            paddingBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Ảnh đại diện giả lập bằng chữ cái đầu tiên trong tên tác giả */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "var(--ocean-l)",
                color: "var(--white)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              {recipe.authorId?.name
                ? recipe.authorId.name.charAt(0).toUpperCase()
                : "N"}
            </div>
            <div>
              {/* Tên tác giả kèm badge xác minh nếu có */}
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "var(--dark)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {recipe.authorId?.name || "Ngư dân"}
                {recipe.authorId?.isVerified && <VerifiedBadge size="sm" />}
              </span>
              <span style={{ fontSize: "12px", color: "violet" }}>
                Chia sẻ lúc{" "}
                {new Date(recipe.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              fontSize: "13px",
              color: "violet",
            }}
          >
            <span>👁️ {recipe.viewCount} lượt xem</span>
            {/* Nút thích công thức */}
            <button
              onClick={handleLike}
              style={{
                background: liked ? "var(--coral-l)" : "none",
                border: liked
                  ? "1px solid var(--coral)"
                  : "1px solid var(--border)",
                color: liked ? "var(--coral-d)" : "var(--text-2)",
                padding: "6px 14px",
                borderRadius: "99px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "var(--transition)",
              }}
            >
              ❤️ {liked ? "Đã thích" : "Thích"} ({likeCount})
            </button>
            {/* Nút xóa chỉ hiển thị nếu tài khoản đang đăng nhập là tác giả hoặc admin */}
            {isAuthorOrAdmin && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  background: "none",
                  border: "1px solid #e74c3c",
                  color: "#e74c3c",
                  padding: "6px 14px",
                  borderRadius: "99px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Xóa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ảnh lớn của món ăn */}
      {recipe.imageUrl && (
        <div
          style={{
            width: "100%",
            maxHeight: "450px",
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
            marginBottom: "32px",
          }}
        >
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      {/* Đoạn trích dẫn mô tả về món ăn */}
      <p
        style={{
          fontSize: "16px",
          color: "violet",
          lineHeight: "1.7",
          marginBottom: "36px",
          fontStyle: "italic",
        }}
      >
        "{recipe.description}"
      </p>

      {/* Hộp tóm tắt thời gian chuẩn bị, chế biến và khẩu phần */}
      <div
        style={{
          background: "var(--white)",
          borderRadius: "var(--radius-lg)",
          padding: "20px 24px",
          display: "flex",
          justify: "space-around",
          alignItems: "center",
          border: "1px solid var(--border-l)",
          boxShadow: "var(--shadow-sm)",
          marginBottom: "36px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              display: "block",
              fontSize: "12px",
              color: "var(--muted)",
              fontWeight: "600",
              textTransform: "uppercase",
            }}
          >
            Chuẩn bị
          </span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "var(--ocean)",
            }}
          >
            15 phút
          </span>
        </div>
        <div
          style={{ width: "1px", height: "30px", background: "var(--border)" }}
        ></div>
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              display: "block",
              fontSize: "12px",
              color: "var(--muted)",
              fontWeight: "600",
              textTransform: "uppercase",
            }}
          >
            Chế biến
          </span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "var(--ocean)",
            }}
          >
            {recipe.cookingTime} phút
          </span>
        </div>
        <div
          style={{ width: "1px", height: "30px", background: "var(--border)" }}
        ></div>
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              display: "block",
              fontSize: "12px",
              color: "var(--muted)",
              fontWeight: "600",
              textTransform: "uppercase",
            }}
          >
            Khẩu phần
          </span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "var(--ocean)",
            }}
          >
            {recipe.servings} người
          </span>
        </div>
      </div>

      {/* Danh sách Nguyên liệu cần có */}
      <div style={{ marginBottom: "40px" }}>
        <h2
          style={{
            fontSize: "22px",
            fontWeight: "800",
            color: "var(--dark)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span>🛒</span> Nguyên Liệu Cần Có
        </h2>
        <div
          style={{
            background: "var(--white)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            border: "1px solid var(--border-l)",
          }}
        >
          {recipe.ingredients?.map((ingredient, idx) => (
            <label
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 0",
                borderBottom:
                  // Nếu là nguyên liệu cuối cùng thì không vẽ đường viền dưới
                  idx === recipe.ingredients.length - 1
                    ? "none"
                    : "1px solid var(--border-l)",
                cursor: "pointer",
                // Chữ màu xám và gạch ngang khi đã tích chọn (chuẩn bị xong nguyên liệu)
                color: checkedIngredients[idx] ? "var(--muted)" : "var(--text)",
                textDecoration: checkedIngredients[idx]
                  ? "line-through"
                  : "none",
                fontWeight: checkedIngredients[idx] ? "400" : "500",
                transition: "var(--transition)",
              }}
            >
              <input
                type="checkbox"
                checked={!!checkedIngredients[idx]}
                onChange={() => toggleIngredientCheck(idx)}
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "var(--ocean)",
                  cursor: "pointer",
                }}
              />
              {ingredient}
            </label>
          ))}
        </div>
      </div>

      {/* Danh sách Các bước thực hiện */}
      <div style={{ marginBottom: "60px" }}>
        <h2
          style={{
            fontSize: "22px",
            fontWeight: "800",
            color: "var(--dark)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span>🍳</span> Các Bước Thực Hiện
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {recipe.instructions?.map((instruction, idx) => (
            <div
              key={idx}
              style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
            >
              {/* Vòng tròn số thứ tự bước */}
              <span
                style={{
                  background: "var(--ocean-p)",
                  color: "var(--ocean-d)",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>
              {/* Nội dung chi tiết bước */}
              <p
                style={{
                  fontSize: "15px",
                  color: "violet",
                  lineHeight: "1.7",
                  paddingTop: "2px",
                }}
              >
                {instruction}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
