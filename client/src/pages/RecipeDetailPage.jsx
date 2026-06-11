import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useSEO } from "../hooks/useSEO";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";
import { api } from "../services/api";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { C } from "../utils/theme";

/* Hộp thoại xác nhận tùy chỉnh cục bộ */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.75)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
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

export function RecipeDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useViewTransitionNavigate();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [checkedIngredients, setCheckedIngredients] = useState({});

  // ✅ FIX Bug 2: Lưu toast và navigate vào refs để tránh chúng xuất hiện trong deps array.
  // toast là object mới mỗi lần ToastProvider re-render (khi bất kỳ toast nào show ở đâu đó),
  // nếu để trong deps → useEffect kích hoạt → recipe bị fetch lại liên tục.
  const toastRef = useRef(toast);
  const navigateRef = useRef(navigate);

  // Cập nhật refs sau mỗi render để không bao giờ stale, nhưng KHÔNG trigger re-render
  useEffect(() => {
    toastRef.current = toast;
    navigateRef.current = navigate;
  });

  useSEO({
    title: recipe ? `${recipe.title} | Haisan.vn` : "Đang tải công thức...",
    description: recipe
      ? recipe.description
      : "Đang tải công thức chế biến hải sản...",
  });

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const data = await api(`/recipes/${id}`);
        if (cancelled) return;
        setRecipe(data);
        setLikeCount(data.likes?.length || 0);
        if (user && data.likes) {
          setLiked(data.likes.includes(user.userId || user.id));
        }
      } catch (err) {
        if (cancelled) return;
        // ✅ FIX Bug 2: dùng ref thay vì closure trực tiếp — toast/navigate không còn trong deps
        toastRef.current.error(
          err.message || "Không thể tải chi tiết công thức",
        );
        navigateRef.current("/cong-thuc");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [id, user]); // ← chỉ re-fetch khi id hoặc user thực sự thay đổi

  const handleLike = async () => {
    if (!user) {
      toast.warn("Vui lòng đăng nhập để thích công thức này");
      return;
    }

    try {
      const res = await api(`/recipes/${id}/like`, { method: "POST" });
      setLiked(res.liked);
      setLikeCount(res.likeCount);
      toast.success(res.liked ? "Đã thích công thức!" : "Đã bỏ thích");
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async () => {
    try {
      await api(`/recipes/${id}`, { method: "DELETE" });
      toast.success("Đã xóa công thức nấu ăn");
      navigate("/cong-thuc");
    } catch (err) {
      toast.error(err.message || "Không thể xóa công thức");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const toggleIngredientCheck = (idx) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

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

  if (!recipe) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        Không tìm thấy công thức nấu ăn.
      </div>
    );
  }

  const isAuthorOrAdmin =
    user &&
    (user.role === "Admin" ||
      recipe.authorId?._id === user.userId ||
      recipe.authorId?._id === user.id);

  return (
    <div className="page-wrap-sm fade-up">
      {showDeleteConfirm && (
        <ConfirmDialog
          message="Bạn có chắc chắn muốn xóa công thức này? Thao tác không thể hoàn tác."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Nút quay lại */}
      <Link
        to="/cong-thuc"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--ocean)",
          textDecoration: "none",
          fontWeight: "600",
          fontSize: "14px",
          marginBottom: "24px",
        }}
      >
        ← Quay lại danh sách công thức
      </Link>

      {/* Header công thức */}
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "12px",
          }}
        >
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

        <div
          style={{
            display: "flex",
            justify: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            borderBottom: "1px solid var(--border-l)",
            paddingBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "var(--ocean-l)",
                color: "var(--white)",
                display: "flex",
                alignItems: "center",
                justify: "center",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              {recipe.authorId?.name
                ? recipe.authorId.name.charAt(0).toUpperCase()
                : "N"}
            </div>
            <div>
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
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
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
              color: "var(--muted)",
            }}
          >
            <span>👁️ {recipe.viewCount} lượt xem</span>
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

      {/* Ảnh món ăn */}
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

      <p
        style={{
          fontSize: "16px",
          color: "var(--text-2)",
          lineHeight: "1.7",
          marginBottom: "36px",
          fontStyle: "italic",
        }}
      >
        "{recipe.description}"
      </p>

      {/* Khối thông tin chế biến */}
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

      {/* Nguyên liệu */}
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
                  idx === recipe.ingredients.length - 1
                    ? "none"
                    : "1px solid var(--border-l)",
                cursor: "pointer",
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

      {/* Các bước thực hiện */}
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
              <span
                style={{
                  background: "var(--ocean-p)",
                  color: "var(--ocean-d)",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justify: "center",
                  fontWeight: "800",
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>
              <p
                style={{
                  fontSize: "15px",
                  color: "var(--text-2)",
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
