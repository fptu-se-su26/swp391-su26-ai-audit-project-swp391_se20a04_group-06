import { ArrowLeft, ChefHat, Clock3, Heart, Send, Trash2, Users, Pencil, Share2, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReportButton from "../components/ReportButton";
import { useAuth } from "../context/AuthContext";
import { apiRecipes, apiReports } from "../services/api";
import { canManageOwnedContent } from "../utils/ownership";
import { useConfirm } from "../context/ConfirmContext";

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const formatCommentDate = (dateVal) => {
  if (!dateVal) return "";
  try {
    return new Date(dateVal).toLocaleDateString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return "";
  }
};

export default function RecipeDetail() {
  const { confirm, alert } = useConfirm();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    apiRecipes.getById(id)
      .then(setRecipe)
      .catch(() => setRecipe(null))
      .finally(() => setLoading(false));
  }, [id]);

  const requireLogin = () => {
    if (user) return true;
    navigate("/login", { state: { message: "Bạn cần đăng nhập để tương tác." } });
    return false;
  };

  const like = async () => {
    if (!requireLogin()) return;
    const currentUserId = String(user.id || user._id);
    const originalRecipe = { ...recipe };

    // Optimistic UI update
    setRecipe((current) => {
      if (!current) return current;
      let nextLikes = [...(current.likes || [])].map(String);
      const wasLiked = nextLikes.includes(currentUserId);
      if (wasLiked) {
        nextLikes = nextLikes.filter((uid) => uid !== currentUserId);
      } else {
        nextLikes.push(currentUserId);
      }
      const delta = wasLiked ? -1 : 1;
      return {
        ...current,
        likeCount: Math.max(0, (current.likeCount ?? current.likes?.length ?? 0) + delta),
        likes: nextLikes,
      };
    });

    try {
      const result = await apiRecipes.toggleLike(id);
      setRecipe((current) => {
        if (!current) return current;
        let nextLikes = [...(current.likes || [])].map(String);
        if (result.liked) {
          if (!nextLikes.includes(currentUserId)) nextLikes.push(currentUserId);
        } else {
          nextLikes = nextLikes.filter((uid) => uid !== currentUserId);
        }
        return {
          ...current,
          likeCount: result.likeCount,
          likes: nextLikes,
        };
      });
    } catch (error) {
      setRecipe(originalRecipe);
      await alert({
        title: "Lỗi tương tác",
        message: error.message,
        variant: "danger"
      });
    }
  };

  const addComment = async (event) => {
    event.preventDefault();
    if (!requireLogin() || !comment.trim()) return;
    try {
      const result = await apiRecipes.addComment(id, comment.trim());
      setRecipe((current) => ({ ...current, comments: result.comments }));
      setComment("");
    } catch (error) {
      await alert({
        title: "Lỗi bình luận",
        message: error.message,
        variant: "danger"
      });
    }
  };

  const editRecipe = () => {
    if (!recipe) return;
    navigate("/recipes", { state: { editRecipeId: id } });
  };

  const shareRecipe = async () => {
    if (!recipe) return;
    const shareData = {
      title: recipe.title,
      text: recipe.description || `Xem công thức món ${recipe.title} cực ngon trên HảiSản.vn!`,
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== "AbortError") {
          await copyLinkFallback();
        }
      }
    } else {
      await copyLinkFallback();
    }
  };

  const copyLinkFallback = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      await alert({
        title: "Đã chia sẻ",
        message: "Liên kết công thức đã được sao chép vào clipboard của bạn!",
        variant: "success",
      });
    } catch (err) {
      await alert({
        title: "Lỗi chia sẻ",
        message: "Không thể tự động sao chép liên kết. Hãy copy thanh địa chỉ trình duyệt nhé.",
        variant: "danger",
      });
    }
  };

  const deleteRecipe = async () => {
    if (!canManageOwnedContent(user, recipe?.authorId)) return;
    const ok = await confirm({
      title: "Xóa công thức?",
      message: `Bạn có chắc muốn xóa công thức "${recipe.title}"? Thao tác này không thể hoàn tác.`,
      confirmText: "Xóa công thức",
      variant: "danger"
    });
    if (!ok) return;

    setDeleting(true);
    try {
      await apiRecipes.delete(id);
      navigate("/recipes", { replace: true });
    } catch (error) {
      await alert({
        title: "Lỗi xóa công thức",
        message: error.message,
        variant: "danger"
      });
      setDeleting(false);
    }
  };

  if (loading) return <div className="page-state">Đang tải công thức...</div>;
  if (!recipe) return <div className="page-state">Không tìm thấy công thức.</div>;

  const author = typeof recipe.authorId === "object" ? recipe.authorId : null;

  const getDifficultyLabel = (diff) => {
    if (diff === "Easy") return "Dễ";
    if (diff === "Hard") return "Khó";
    return "Trung bình";
  };

  const difficultyClass = recipe.difficulty === "Easy"
    ? "difficulty-easy"
    : recipe.difficulty === "Hard"
      ? "difficulty-hard"
      : "difficulty-medium";

  return (
    <div className="recipe-detail-container">
      <Link className="back-link" to="/recipes" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#67e8f9", textDecoration: "none", fontSize: "0.9rem", fontWeight: "600", marginBottom: "16px" }}>
        <ArrowLeft size={17} /> Cẩm nang công thức
      </Link>
      
      {/* Ảnh món ăn lớn dạng banner */}
      <div className="recipe-hero-image">
        {recipe.imageUrl && !hasImageError ? (
          <img
            alt={recipe.title}
            onError={() => setHasImageError(true)}
            src={recipe.imageUrl}
          />
        ) : (
          <div className="recipe-hero-image__placeholder">
            <ChefHat size={64} />
            <span>Chưa có ảnh món ăn</span>
          </div>
        )}
      </div>

      {/* Thông tin món ăn */}
      <div className="recipe-info-panel">
        <div style={{ display: "flex", gap: "8px" }}>
          <span className={`recipe-meta-pill ${difficultyClass}`} style={{ fontWeight: "700" }}>
            {getDifficultyLabel(recipe.difficulty)}
          </span>
        </div>
        
        <h1>{recipe.title}</h1>
        
        <p className="recipe-info-panel__desc">{recipe.description}</p>
        
        {/* Metadata pills */}
        <div className="recipe-meta-pills">
          <div className="recipe-meta-pill">
            <Clock3 size={15} style={{ color: "#22f3ff" }} />
            <span>{recipe.cookingTime || 30} phút</span>
          </div>
          <div className="recipe-meta-pill">
            <Users size={15} style={{ color: "#22f3ff" }} />
            <span>{recipe.servings || 2} khẩu phần</span>
          </div>
          {author && (
            <Link to={`/fisherman/${author._id || author.id}`} className="recipe-meta-pill" style={{ textDecoration: "none" }}>
              <span className="recipe-author__avatar" style={{ width: "16px", height: "16px", fontSize: "0.6rem", background: "#22f3ff", color: "#0b1728", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "700", marginRight: "4px" }}>
                {initials(author.name)}
              </span>
              <span>Đăng bởi: <strong>{author.name}</strong></span>
            </Link>
          )}
          <div className="recipe-meta-pill">
            <span>Nguyên liệu: <strong>{recipe.ingredients?.length || 0} mục</strong></span>
          </div>
          <div className="recipe-meta-pill">
            <span>Các bước: <strong>{recipe.instructions?.length || 0} bước</strong></span>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="recipe-action-bar">
          <button
            className={`button button--primary like-button ${user && recipe.likes?.map(String).includes(String(user.id || user._id)) ? "is-liked" : ""}`}
            onClick={like}
            type="button"
          >
            <Heart size={17} />
            <span>{user && recipe.likes?.map(String).includes(String(user.id || user._id)) ? "Đã thích" : "Thích"}</span>
            <span>({recipe.likeCount ?? recipe.likes?.length ?? 0})</span>
          </button>
          
          <button className="button button--secondary" onClick={shareRecipe} type="button">
            <Share2 size={17} /> Chia sẻ
          </button>

          <ReportButton onSubmit={(reason) => apiReports.createForRecipe(id, reason)} />

          {canManageOwnedContent(user, recipe.authorId) && (
            <>
              <button className="button button--secondary owner-edit-button" onClick={editRecipe} type="button">
                <Pencil size={17} /> Sửa công thức
              </button>
              <button className="button owner-delete-button" disabled={deleting} onClick={deleteRecipe} type="button">
                <Trash2 size={17} /> {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid 2 cột: Nguyên liệu & Cách thực hiện */}
      <div className="recipe-content-grid">
        {/* Nguyên liệu */}
        <section className="recipe-ingredients-card">
          <h2>Nguyên liệu</h2>
          {recipe.ingredients && recipe.ingredients.length > 0 ? (
            <ul className="magazine-ingredients-list">
              {recipe.ingredients.map((item, index) => (
                <li key={`${item}-${index}`} className="magazine-ingredient-item">
                  <Check className="magazine-ingredient-check" size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="recipe-empty-box" style={{ textAlign: "center", padding: "20px 0", color: "#475569" }}>
              <ChefHat size={32} style={{ margin: "0 auto 8px" }} />
              <p style={{ margin: 0, fontSize: "0.9rem" }}>Chưa có nguyên liệu.</p>
            </div>
          )}
        </section>

        {/* Cách thực hiện */}
        <section className="recipe-steps-card">
          <h2>Cách thực hiện</h2>
          {recipe.instructions && recipe.instructions.length > 0 ? (
            <ol className="magazine-steps-list">
              {recipe.instructions.map((item, index) => (
                <li key={`${item}-${index}`} className="magazine-step-item">
                  <span className="magazine-step-number">{index + 1}</span>
                  <p className="magazine-step-text">{item}</p>
                </li>
              ))}
            </ol>
          ) : (
            <div className="recipe-empty-box" style={{ textAlign: "center", padding: "20px 0", color: "#475569" }}>
              <ChefHat size={32} style={{ margin: "0 auto 8px" }} />
              <p style={{ margin: 0, fontSize: "0.9rem" }}>Chưa có bước thực hiện.</p>
            </div>
          )}
        </section>
      </div>

      {/* Bình luận */}
      <section className="recipe-comments-card" style={{ marginTop: "28px" }}>
        <h2>Bình luận ({recipe.comments?.length || 0})</h2>
        
        {recipe.comments && recipe.comments.length > 0 ? (
          <div className="comments-list" style={{ display: "grid", gap: "16px", marginBottom: "24px" }}>
            {recipe.comments.map((item) => (
              <article className="comment-item" key={item._id || item.id} style={{ display: "flex", gap: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "14px", borderRadius: "12px" }}>
                <div className="comment-item__avatar" style={{ width: "36px", height: "36px", background: "rgba(34, 243, 255, 0.1)", color: "#22f3ff", display: "grid", placeItems: "center", borderRadius: "50%", fontWeight: "700", fontSize: "0.85rem", flexShrink: 0 }}>
                  {initials(item.userName)}
                </div>
                <div className="comment-item__body" style={{ flex: 1, minWidth: 0 }}>
                  <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                    <strong style={{ color: "#fff", fontSize: "0.9rem" }}>{item.userName}</strong>
                    <small style={{ color: "#64748b", fontSize: "0.75rem" }}>{formatCommentDate(item.createdAt)}</small>
                  </header>
                  <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.88rem", lineHeight: "1.5" }}>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="comments-empty" style={{ textAlign: "center", padding: "28px 0", color: "#64748b", background: "rgba(255,255,255,0.01)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.06)", marginBottom: "24px" }}>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>Chưa có bình luận nào. Hãy chia sẻ kinh nghiệm nấu món này.</p>
          </div>
        )}

        <form className="comment-composer" onSubmit={addComment} style={{ display: "flex", gap: "12px" }}>
          <input
            onChange={(event) => setComment(event.target.value)}
            placeholder="Trao đổi kinh nghiệm nấu hoặc đặt câu hỏi..."
            required
            value={comment}
            style={{ flex: 1 }}
          />
          <button aria-label="Gửi bình luận" type="submit" className="button button--primary" style={{ padding: "0 16px", height: "42px", display: "grid", placeItems: "center" }}>
            <Send size={16} />
          </button>
        </form>
      </section>
    </div>
  );
}
