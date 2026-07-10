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
    try {
      const result = await apiRecipes.toggleLike(id);
      setRecipe((current) => ({ ...current, likeCount: result.likeCount }));
    } catch (error) {
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

  return (
    <div className="page-container recipe-detail-page">
      <Link className="back-link" to="/recipes">
        <ArrowLeft size={17} /> Cẩm nang công thức
      </Link>
      
      <article className="recipe-detail">
        {/* Cột trái: Ảnh món ăn */}
        <div className="recipe-detail__media">
          {recipe.imageUrl && !hasImageError ? (
            <img
              alt={recipe.title}
              onError={() => setHasImageError(true)}
              src={recipe.imageUrl}
            />
          ) : (
            <div className="recipe-detail__placeholder">
              <ChefHat size={80} />
              <span>Chưa có ảnh món ăn</span>
            </div>
          )}
        </div>

        {/* Cột phải: Thông tin công thức */}
        <div className="recipe-detail__content">
          <div className="recipe-detail__badge-row">
            <span className="eyebrow">{recipe.difficulty || "Medium"}</span>
          </div>
          <h1>{recipe.title}</h1>
          <p className="recipe-detail__desc">{recipe.description}</p>
          
          <div className="recipe-meta">
            <div className="recipe-meta__item">
              <Clock3 size={18} />
              <span>{recipe.cookingTime || 30} phút</span>
            </div>
            <div className="recipe-meta__item">
              <Users size={18} />
              <span>{recipe.servings || 2} khẩu phần</span>
            </div>
          </div>

          {author && (
            <div className="recipe-author">
              <Link to={`/fisherman/${author._id || author.id}`}>
                <span className="recipe-author__avatar">
                  {initials(author.name)}
                </span>
                <span>Công thức từ Ngư dân: <strong>{author.name}</strong></span>
              </Link>
            </div>
          )}

          <div className="recipe-detail__actions">
            <button className="button button--primary" onClick={like} type="button">
              <Heart size={17} /> Thích ({recipe.likeCount ?? recipe.likes?.length ?? 0})
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
      </article>

      <div className="recipe-columns">
        {/* Nguyên liệu */}
        <section className="dashboard-panel recipe-ingredients-card">
          <h2>Nguyên liệu</h2>
          {recipe.ingredients && recipe.ingredients.length > 0 ? (
            <ul className="ingredients-list">
              {recipe.ingredients.map((item, index) => (
                <li key={`${item}-${index}`}>
                  <Check className="check-icon" size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="recipe-empty-box">
              <ChefHat size={32} />
              <p>Món ăn chưa cấu hình nguyên liệu cụ thể.</p>
            </div>
          )}
        </section>

        {/* Cách thực hiện */}
        <section className="dashboard-panel recipe-instructions-card">
          <h2>Cách thực hiện</h2>
          {recipe.instructions && recipe.instructions.length > 0 ? (
            <ol className="instructions-list">
              {recipe.instructions.map((item, index) => (
                <li key={`${item}-${index}`}>
                  <span className="step-badge">{index + 1}</span>
                  <p>{item}</p>
                </li>
              ))}
            </ol>
          ) : (
            <div className="recipe-empty-box">
              <ChefHat size={32} />
              <p>Món ăn chưa có mô tả các bước thực hiện.</p>
            </div>
          )}
        </section>
      </div>

      {/* Bình luận */}
      <section className="dashboard-panel recipe-comments">
        <h2>Bình luận ({recipe.comments?.length || 0})</h2>
        
        {recipe.comments && recipe.comments.length > 0 ? (
          <div className="comments-list">
            {recipe.comments.map((item) => (
              <article className="comment-item" key={item._id || item.id}>
                <div className="comment-item__avatar">
                  {initials(item.userName)}
                </div>
                <div className="comment-item__body">
                  <header>
                    <strong>{item.userName}</strong>
                    <small>{formatCommentDate(item.createdAt)}</small>
                  </header>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="comments-empty">
            <p>Chưa có bình luận nào. Hãy chia sẻ kinh nghiệm nấu món này.</p>
          </div>
        )}

        <form className="comment-composer" onSubmit={addComment}>
          <input
            onChange={(event) => setComment(event.target.value)}
            placeholder="Trao đổi kinh nghiệm nấu hoặc đặt câu hỏi..."
            required
            value={comment}
          />
          <button aria-label="Gửi bình luận" type="submit">
            <Send size={16} />
          </button>
        </form>
      </section>
    </div>
  );
}
