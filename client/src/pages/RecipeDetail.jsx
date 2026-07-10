import { ArrowLeft, ChefHat, Clock3, Heart, Send, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReportButton from "../components/ReportButton";
import { useAuth } from "../context/AuthContext";
import { apiRecipes, apiReports } from "../services/api";
import { canManageOwnedContent } from "../utils/ownership";
import { useConfirm } from "../context/ConfirmContext";


export default function RecipeDetail() {
  const { confirm, alert } = useConfirm();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiRecipes.getById(id).then(setRecipe).catch(() => setRecipe(null)).finally(() => setLoading(false));
  }, [id]);

  const requireLogin = () => {
    if (user) return true;
    navigate("/login", { state: { message: "Bạn cần đăng nhập để tương tác." } });
    return false;
  };

  const like = async () => {
    if (!requireLogin()) return;
    const result = await apiRecipes.toggleLike(id);
    setRecipe((current) => ({ ...current, likeCount: result.likeCount }));
  };

  const addComment = async (event) => {
    event.preventDefault();
    if (!requireLogin() || !comment.trim()) return;
    const result = await apiRecipes.addComment(id, comment.trim());
    setRecipe((current) => ({ ...current, comments: result.comments }));
    setComment("");
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
      <Link className="back-link" to="/recipes"><ArrowLeft size={17} /> Cẩm nang công thức</Link>
      <article className="recipe-detail">
        <div className="recipe-detail__media">{recipe.imageUrl ? <img alt={recipe.title} src={recipe.imageUrl} /> : <ChefHat size={64} />}</div>
        <div className="recipe-detail__content">
          <span className="eyebrow">{recipe.difficulty}</span>
          <h1>{recipe.title}</h1>
          <p>{recipe.description}</p>
          <div className="recipe-meta"><span><Clock3 /> {recipe.cookingTime} phút</span><span><Users /> {recipe.servings} khẩu phần</span></div>
          {author && <Link to={`/fisherman/${author._id || author.id}`}>Công thức của {author.name}</Link>}
          <div className="recipe-detail__actions">
            <button className="button button--primary" onClick={like} type="button"><Heart size={17} /> {recipe.likeCount ?? recipe.likes?.length ?? 0}</button>
            <ReportButton onSubmit={(reason) => apiReports.createForRecipe(id, reason)} />
            {canManageOwnedContent(user, recipe.authorId) && (
              <button className="button owner-delete-button" disabled={deleting} onClick={deleteRecipe} type="button">
                <Trash2 size={17} /> {deleting ? "Đang xóa..." : "Xóa công thức"}
              </button>
            )}
          </div>
        </div>
      </article>
      <div className="recipe-columns">
        <section className="dashboard-panel"><h2>Nguyên liệu</h2><ul>{recipe.ingredients?.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></section>
        <section className="dashboard-panel"><h2>Cách thực hiện</h2><ol>{recipe.instructions?.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ol></section>
      </div>
      <section className="dashboard-panel recipe-comments">
        <h2>Bình luận ({recipe.comments?.length || 0})</h2>
        {recipe.comments?.map((item) => <p key={item._id}><strong>{item.userName}</strong> {item.text}</p>)}
        <form className="comment-composer" onSubmit={addComment}><input onChange={(event) => setComment(event.target.value)} placeholder="Trao đổi kinh nghiệm nấu..." value={comment} /><button aria-label="Gửi bình luận" type="submit"><Send size={16} /></button></form>
      </section>
    </div>
  );
}
