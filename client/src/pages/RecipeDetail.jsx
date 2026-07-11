import { ArrowLeft, ChefHat, Clock3, Heart, Send, Trash2, Users, Pencil, Share2, Check, MessageSquare, X } from "lucide-react";
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
  const [showComments, setShowComments] = useState(false);

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

  const cleanStepText = (text) => {
    if (!text) return "";
    return text.replace(/^(?:bước\s+\d+|step\s+\d+|\d+)(?:\s*[:\.\)-]\s*|\s+)/i, "").trim();
  };

  return (
    <div className="page-container recipe-detail-page">
      <div className="recipe-one-screen">
        {/* Header */}
        <header className="recipe-one-screen__header">
          <Link className="back-link" to="/recipes" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#67e8f9", textDecoration: "none", fontSize: "0.9rem", fontWeight: "600" }}>
            <ArrowLeft size={17} /> Cẩm nang công thức
          </Link>
        </header>

        {/* 3 Columns Grid */}
        <div className="recipe-detail-grid">
          
          {/* Cột 1: Thông tin món */}
          <div className="recipe-summary-card">
            <div className="recipe-summary-card__media">
              {recipe.imageUrl && !hasImageError ? (
                <img
                  alt={recipe.title}
                  className="recipe-summary-image"
                  onError={() => setHasImageError(true)}
                  src={recipe.imageUrl}
                />
              ) : (
                <div className="recipe-hero-image__placeholder" style={{ borderRadius: "14px", height: "100%" }}>
                  <ChefHat size={48} />
                  <span style={{ fontSize: "0.85rem" }}>Chưa có ảnh món ăn</span>
                </div>
              )}
            </div>

            <div className="recipe-card-body">
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <span className={`recipe-meta-pill ${difficultyClass}`} style={{ fontWeight: "700" }}>
                  {getDifficultyLabel(recipe.difficulty)}
                </span>
              </div>
              
              <h1 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#fff", margin: "8px 0 10px 0", lineHeight: "1.3" }}>{recipe.title}</h1>
              
              <p style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: "1.5", margin: "0 0 14px 0" }}>{recipe.description}</p>
              
              <div className="recipe-summary-card__meta" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="recipe-meta-pill">
                  <Clock3 size={14} style={{ color: "#22f3ff" }} />
                  <span>{recipe.cookingTime || 30} phút</span>
                </div>
                <div className="recipe-meta-pill">
                  <Users size={14} style={{ color: "#22f3ff" }} />
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
              </div>
            </div>
          </div>

          {/* Cột 2: Nguyên liệu */}
          <div className="recipe-ingredients-card">
            <h2>Nguyên liệu ({recipe.ingredients?.length || 0})</h2>
            <div className="recipe-card-scroll">
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                <ul className="magazine-ingredients-list" style={{ listStyle: "none", padding: 0 }}>
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
            </div>
          </div>

          {/* Cột 3: Cách thực hiện */}
          <div className="recipe-steps-card">
            <h2>Cách thực hiện ({recipe.instructions?.length || 0})</h2>
            <div className="recipe-card-scroll">
              {recipe.instructions && recipe.instructions.length > 0 ? (
                <ol className="magazine-steps-list" style={{ listStyle: "none", padding: 0 }}>
                  {recipe.instructions.map((item, index) => (
                    <li key={`${item}-${index}`} className="magazine-step-item">
                      <span className="magazine-step-number">{index + 1}</span>
                      <p className="magazine-step-text">{cleanStepText(item)}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="recipe-empty-box" style={{ textAlign: "center", padding: "20px 0", color: "#475569" }}>
                  <ChefHat size={32} style={{ margin: "0 auto 8px" }} />
                  <p style={{ margin: 0, fontSize: "0.9rem" }}>Chưa có bước thực hiện.</p>
                </div>
              )}
            </div>
          </div>

          {/* Hàng 2: Thanh nút hành động nằm ngang bên dưới */}
          <div className="recipe-action-bar">
            <button
              className={`button button--primary like-button ${user && recipe.likes?.map(String).includes(String(user.id || user._id)) ? "is-liked" : ""}`}
              onClick={like}
              type="button"
            >
              <Heart size={16} />
              <span>{user && recipe.likes?.map(String).includes(String(user.id || user._id)) ? "Đã thích" : "Thích"}</span>
              <span>({recipe.likeCount ?? recipe.likes?.length ?? 0})</span>
            </button>
            
            <button className="button button--secondary" onClick={shareRecipe} type="button">
              <Share2 size={16} /> Chia sẻ
            </button>

            <button className="button button--secondary" onClick={() => setShowComments(true)} type="button">
              <MessageSquare size={16} /> Bình luận ({recipe.comments?.length || 0})
            </button>

            <ReportButton onSubmit={(reason) => apiReports.createForRecipe(id, reason)} />

            {canManageOwnedContent(user, recipe.authorId) && (
              <>
                <button className="button button--secondary owner-edit-button" onClick={editRecipe} type="button">
                  <Pencil size={16} /> Sửa
                </button>
                <button className="button owner-delete-button" disabled={deleting} onClick={deleteRecipe} type="button">
                  <Trash2 size={16} /> Xóa
                </button>
              </>
            )}
          </div>

        </div>

      </div>

      {/* Slide-out Comments Drawer */}
      <div className={`recipe-comments-drawer-backdrop ${showComments ? "is-open" : ""}`} onClick={() => setShowComments(false)} />
      <div className={`recipe-comments-drawer ${showComments ? "is-open" : ""}`}>
        <div className="recipe-comments-drawer__header">
          <h2>Bình luận ({recipe.comments?.length || 0})</h2>
          <button onClick={() => setShowComments(false)} className="recipe-comments-drawer__close" aria-label="Đóng bình luận">
            <X size={18} />
          </button>
        </div>

        <div className="recipe-comments-drawer__list">
          {recipe.comments && recipe.comments.length > 0 ? (
            recipe.comments.map((item) => (
              <article className="comment-item" key={item._id || item.id} style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "10px 12px", borderRadius: "10px", marginBottom: "12px" }}>
                <div className="comment-item__avatar" style={{ width: "30px", height: "30px", background: "rgba(34, 243, 255, 0.1)", color: "#22f3ff", display: "grid", placeItems: "center", borderRadius: "50%", fontWeight: "700", fontSize: "0.75rem", flexShrink: 0 }}>
                  {initials(item.userName)}
                </div>
                <div className="comment-item__body" style={{ flex: 1, minWidth: 0 }}>
                  <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <strong style={{ color: "#fff", fontSize: "0.8rem" }}>{item.userName}</strong>
                    <small style={{ color: "#64748b", fontSize: "0.7rem" }}>{formatCommentDate(item.createdAt)}</small>
                  </header>
                  <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.8rem", lineHeight: "1.4" }}>{item.text}</p>
                </div>
              </article>
            ))
          ) : (
            <div className="comments-empty" style={{ textAlign: "center", padding: "28px 0", color: "#64748b", background: "rgba(255,255,255,0.01)", borderRadius: "10px", border: "1px dashed rgba(255,255,255,0.06)" }}>
              <p style={{ margin: 0, fontSize: "0.85rem" }}>Chưa có bình luận nào. Hãy chia sẻ kinh nghiệm nấu món này.</p>
            </div>
          )}
        </div>

        <div className="recipe-comments-drawer__footer">
          <form className="comment-composer" onSubmit={addComment} style={{ display: "flex", gap: "8px", width: "100%", boxSizing: "border-box" }}>
            <input
              onChange={(event) => setComment(event.target.value)}
              placeholder="Viết câu hỏi hoặc trao đổi kinh nghiệm..."
              required
              value={comment}
              style={{ flex: 1, height: "40px", fontSize: "0.85rem" }}
            />
            <button aria-label="Gửi bình luận" type="submit">
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
