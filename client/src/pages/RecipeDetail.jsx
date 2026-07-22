import { ArrowLeft, Calendar, ChefHat, Clock3, Heart, Send, Trash2, Users, Pencil, Share2, Check, MessageSquare, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReportButton from "../components/ReportButton";
import { useAuth } from "../context/AuthContext";
import { apiRecipes, apiReports } from "../services/api";
import { canManageOwnedContent } from "../utils/ownership";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import { formatRelativeDate } from "../utils/date";
import useSEO from "../hooks/useSEO";

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
  const { confirm } = useConfirm();
  const toast = useToast();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);

  useSEO(
    recipe ? `${recipe.title} (Công thức)` : "Chi tiết công thức",
    recipe ? recipe.description : "Hướng dẫn chế biến hải sản ngon chi tiết."
  );
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
      toast.error(error.message || "Không thể tương tác.");
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
      toast.error(error.message || "Không thể gửi bình luận.");
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
      toast.success("Liên kết công thức đã được sao chép!");
    } catch (err) {
      toast.error("Không thể sao chép liên kết. Hãy copy thanh địa chỉ trình duyệt nhé.");
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
      toast.success("Đã xóa công thức thành công.");
      navigate("/recipes", { replace: true });
    } catch (error) {
      toast.error(error.message || "Không thể xóa công thức.");
      setDeleting(false);
    }
  };

  if (loading) return <div className="page-state">Đang tải công thức...</div>;
  if (!recipe) return <div className="page-state">Không tìm thấy công thức.</div>;

  const author = typeof recipe.authorId === "object" ? recipe.authorId : null;

  const getDifficultyLabel = (diff) => {
    const d = String(diff || "").toLowerCase();
    if (d === "easy" || d === "dễ") return "Dễ";
    if (d === "hard" || d === "khó") return "Khó";
    return "Trung bình";
  };

  const difficultyClass = (recipe.difficulty === "Easy" || recipe.difficulty === "easy" || recipe.difficulty === "EASY")
    ? "difficulty-easy"
    : (recipe.difficulty === "Hard" || recipe.difficulty === "hard" || recipe.difficulty === "HARD")
      ? "difficulty-hard"
      : "difficulty-medium";

  const cleanStepText = (text) => {
    if (!text) return "";
    return text.replace(/^(?:bước\s+\d+|step\s+\d+|\d+)(?:\s*[:\.\)-]\s*|\s+)/i, "").trim();
  };

  return (
    <div className="page-container recipe-detail-page">
      <div className="recipe-one-screen">
        {/* Header Back Link */}
        <header className="recipe-one-screen__header" style={{ marginBottom: "16px" }}>
          <Link className="back-link recipe-back-link" to="/recipes" style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "var(--market-muted)", fontWeight: "600" }}>
            <ArrowLeft size={17} /> Cẩm nang công thức
          </Link>
        </header>

        {/* Modern 2-Column Container */}
        <div className="recipe-detail-container">
          
          {/* Cột trái: Nội dung chính */}
          <main className="recipe-main-content">
            
            {/* Header thông tin món */}
            <div style={{ borderBottom: "1px solid var(--market-line)", paddingBottom: "20px" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <span className={`recipe-meta-pill ${difficultyClass}`} style={{ fontWeight: "700", textTransform: "uppercase", fontSize: "0.75rem", padding: "6px 12px", borderRadius: "20px" }}>
                  {getDifficultyLabel(recipe.difficulty)}
                </span>
              </div>
              <h1 style={{ fontSize: "2.4rem", fontWeight: "900", color: "var(--market-text)", margin: "0 0 10px 0", lineHeight: "1.2" }}>{recipe.title}</h1>
              <p style={{ fontSize: "1.05rem", color: "var(--market-muted)", lineHeight: "1.6", margin: 0, fontStyle: "italic" }}>{recipe.description}</p>
            </div>

            {/* Banner ảnh món ăn */}
            <div className="recipe-hero-banner">
              {recipe.imageUrl && !hasImageError ? (
                <img
                  alt={recipe.title}
                  onError={() => setHasImageError(true)}
                  src={recipe.imageUrl}
                />
              ) : (
                <div className="recipe-hero-image__placeholder" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", background: "var(--market-surface)", color: "var(--market-muted)", gap: "12px" }}>
                  <ChefHat size={64} />
                  <span>Chưa có ảnh món ăn</span>
                </div>
              )}
            </div>

            {/* Thẻ Nguyên liệu */}
            <section className="recipe-section-card">
              <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--market-text)", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ display: "inline-block", width: "6px", height: "20px", background: "var(--market-primary)", borderRadius: "3px" }} />
                Nguyên liệu nấu ({recipe.ingredients?.length || 0})
              </h2>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                <ul className="recipe-ingredients-list-modern">
                  {recipe.ingredients.map((item, index) => (
                    <li key={`${item}-${index}`} className="recipe-ingredient-item-modern">
                      <Check style={{ color: "var(--market-primary)", flexShrink: 0 }} size={18} />
                      <span style={{ fontSize: "0.95rem", color: "var(--market-text)", fontWeight: "500" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "var(--market-subtle)", margin: 0 }}>Chưa có nguyên liệu.</p>
              )}
            </section>

            {/* Thẻ Các bước thực hiện */}
            <section className="recipe-section-card">
              <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--market-text)", margin: "0 0 24px 0", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ display: "inline-block", width: "6px", height: "20px", background: "var(--market-primary)", borderRadius: "3px" }} />
                Các bước thực hiện ({recipe.instructions?.length || 0})
              </h2>
              {recipe.instructions && recipe.instructions.length > 0 ? (
                <div className="recipe-steps-list-modern">
                  {recipe.instructions.map((item, index) => (
                    <div key={`${item}-${index}`} className="recipe-step-item-modern">
                      <div className="recipe-step-badge">
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--market-text)", margin: "0 0 6px 0" }}>Bước {index + 1}</h4>
                        <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--market-muted)", lineHeight: "1.6" }}>{cleanStepText(item)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--market-subtle)", margin: 0 }}>Chưa có bước thực hiện.</p>
              )}
            </section>
          </main>

          {/* Cột phải: Sidebar thông tin & hành động */}
          <aside className="recipe-sidebar">
            
            {/* Thông tin chung */}
            <section className="recipe-section-card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--market-text)", margin: "0 0 16px 0", borderBottom: "1px solid var(--market-line)", paddingBottom: "10px" }}>
                Thông tin chung
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="recipe-quick-info-box">
                  <Clock3 size={18} style={{ color: "var(--market-primary)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--market-muted)" }}>Thời gian chế biến</div>
                    <strong style={{ fontSize: "0.95rem", color: "var(--market-text)" }}>{recipe.cookingTime || 30} phút</strong>
                  </div>
                </div>
                
                <div className="recipe-quick-info-box">
                  <Users size={18} style={{ color: "var(--market-primary)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--market-muted)" }}>Khẩu phần</div>
                    <strong style={{ fontSize: "0.95rem", color: "var(--market-text)" }}>{recipe.servings || 2} người</strong>
                  </div>
                </div>

                {recipe.createdAt && (
                  <div className="recipe-quick-info-box">
                    <Calendar size={18} style={{ color: "var(--market-primary)", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--market-muted)" }}>Ngày đăng</div>
                      <strong style={{ fontSize: "0.95rem", color: "var(--market-text)" }}>{formatRelativeDate(recipe.createdAt)}</strong>
                    </div>
                  </div>
                )}

                {author && (
                  <Link to={`/fisherman/${author._id || author.id}`} className="recipe-quick-info-box" style={{ textDecoration: "none" }}>
                    <span className="recipe-author__avatar" style={{ width: "24px", height: "24px", fontSize: "0.75rem", background: "var(--market-primary)", color: "var(--market-bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "700", flexShrink: 0 }}>
                      {initials(author.name)}
                    </span>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--market-muted)" }}>Đăng bởi</div>
                      <strong style={{ fontSize: "0.95rem", color: "var(--market-text)", display: "block" }}>{author.name}</strong>
                    </div>
                  </Link>
                )}
              </div>
            </section>

            {/* Bảng tương tác & hành động */}
            <section className="recipe-section-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                className={`button button--primary like-button ${user && recipe.likes?.map(String).includes(String(user.id || user._id)) ? "is-liked" : ""}`}
                onClick={like}
                type="button"
                style={{ width: "100%", height: "45px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", borderRadius: "14px" }}
              >
                <Heart size={16} />
                <span>{user && recipe.likes?.map(String).includes(String(user.id || user._id)) ? "Đã thích" : "Thích"}</span>
                <span>({recipe.likeCount ?? recipe.likes?.length ?? 0})</span>
              </button>
              
              <button className="button button--secondary" onClick={shareRecipe} type="button" style={{ width: "100%", height: "45px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", borderRadius: "14px", border: "1px solid var(--market-line)" }}>
                <Share2 size={16} /> Chia sẻ
              </button>

              <button className="button button--secondary" onClick={() => setShowComments(true)} type="button" style={{ width: "100%", height: "45px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", borderRadius: "14px", border: "1px solid var(--market-line)" }}>
                <MessageSquare size={16} /> Bình luận ({recipe.comments?.length || 0})
              </button>

              <ReportButton onSubmit={(reason) => apiReports.createForRecipe(id, reason)} style={{ width: "100%", height: "45px" }} />

              {canManageOwnedContent(user, recipe.authorId) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "8px", borderTop: "1px solid var(--market-line)", paddingTop: "16px" }}>
                  <button className="button button--secondary owner-edit-button" onClick={editRecipe} type="button" style={{ height: "40px", borderRadius: "12px" }}>
                    <Pencil size={15} /> Sửa
                  </button>
                  <button className="button owner-delete-button" disabled={deleting} onClick={deleteRecipe} type="button" style={{ height: "40px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    <Trash2 size={15} /> Xóa
                  </button>
                </div>
              )}
            </section>
          </aside>

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
              <article className="comment-item" key={item._id || item.id} style={{ display: "flex", gap: "10px", background: "var(--market-surface-raised)", border: "1px solid var(--market-line)", padding: "10px 12px", borderRadius: "10px", marginBottom: "12px" }}>
                <div className="comment-item__avatar" style={{ width: "30px", height: "30px", background: "rgba(8, 145, 178, 0.1)", color: "var(--market-primary)", display: "grid", placeItems: "center", borderRadius: "50%", fontWeight: "700", fontSize: "0.75rem", flexShrink: 0 }}>
                  {initials(item.userName)}
                </div>
                <div className="comment-item__body" style={{ flex: 1, minWidth: 0 }}>
                  <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <strong style={{ color: "var(--market-text)", fontSize: "0.8rem" }}>{item.userName}</strong>
                    <small style={{ color: "var(--market-subtle)", fontSize: "0.7rem" }}>{formatCommentDate(item.createdAt)}</small>
                  </header>
                  <p style={{ margin: 0, color: "var(--market-muted)", fontSize: "0.8rem", lineHeight: "1.4" }}>{item.text}</p>
                </div>
              </article>
            ))
          ) : (
            <div className="comments-empty" style={{ textAlign: "center", padding: "28px 0", color: "var(--market-subtle)", background: "var(--market-surface-raised)", borderRadius: "10px", border: "1px dashed var(--market-line)" }}>
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
