import { ChefHat, Clock3, Heart, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import ImageUploader from "../components/shared/ImageUploader";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRecipes } from "../services/api";
import { getOptimizedImageUrl, getRecipeImageSrcSet } from "../utils/image";
import { canManageOwnedContent } from "../utils/ownership";
import { useConfirm } from "../context/ConfirmContext";


const initialForm = {
  title: "",
  description: "",
  ingredients: "",
  instructions: "",
  imageFile: null,   // File | null
  imageUrl: "",
  difficulty: "Medium",
  cookingTime: 30,
  servings: 2,
  tags: "",
};

const difficultyClassNames = {
  Easy: "is-easy",
  Medium: "is-medium",
  Hard: "is-hard",
};

const toMultilineText = (value) =>
  Array.isArray(value) ? value.join("\n") : String(value || "");

const toRecipeForm = (recipe) => ({
  title: recipe.title || "",
  description: recipe.description || "",
  ingredients: toMultilineText(recipe.ingredients),
  instructions: toMultilineText(recipe.instructions),
  imageFile: null,
  imageUrl: recipe.imageUrl || "",
  difficulty: recipe.difficulty || "Medium",
  cookingTime: recipe.cookingTime || 30,
  servings: recipe.servings || 2,
  tags: Array.isArray(recipe.tags) ? recipe.tags.join(", ") : String(recipe.tags || ""),
});

const buildRecipePayload = (recipeForm, imageUrl) => ({
  title: recipeForm.title,
  description: recipeForm.description,
  imageUrl: imageUrl || null,
  difficulty: recipeForm.difficulty,
  cookingTime: Number(recipeForm.cookingTime),
  servings: Number(recipeForm.servings),
  ingredients: recipeForm.ingredients.split("\n").map((item) => item.trim()).filter(Boolean),
  instructions: recipeForm.instructions.split("\n").map((item) => item.trim()).filter(Boolean),
  tags: recipeForm.tags.split(",").map((item) => item.trim()).filter(Boolean),
});

const uploadRecipeImage = async (imageFile) => {
  const formData = new FormData();
  formData.append("images", imageFile);
  const uploadResult = await apiRecipes.uploadImage(formData);
  const imageUrl = uploadResult?.urls?.[0] || "";
  if (!imageUrl) throw new Error("Máy chủ không trả về URL ảnh công thức.");
  return imageUrl;
};

function RecipeCardImage({ imageUrl, title }) {
  const [fallbackReason, setFallbackReason] = useState("");

  useEffect(() => {
    setFallbackReason("");
  }, [imageUrl]);

  if (!imageUrl || fallbackReason) {
    const fallbackLabel =
      fallbackReason === "low-resolution"
        ? "Ảnh công thức có độ phân giải quá thấp"
        : "Công thức chưa có ảnh";

    return (
      <span
        aria-label={fallbackLabel}
        className="recipe-card__image-fallback"
        role="img"
        title={fallbackLabel}
      >
        <ChefHat size={42} />
      </span>
    );
  }

  const srcSet = getRecipeImageSrcSet(imageUrl);

  return (
    <img
      alt={title}
      decoding="async"
      loading="lazy"
      onError={() => setFallbackReason("load-error")}
      onLoad={(event) => {
        if (srcSet) return;
        const { naturalHeight, naturalWidth } = event.currentTarget;
        if (naturalWidth < 320 || naturalHeight < 200) {
          setFallbackReason("low-resolution");
        }
      }}
      sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 900px) 50vw, 33vw"
      src={getOptimizedImageUrl(imageUrl)}
      srcSet={srcSet || undefined}
    />
  );
}


export default function Recipes() {
  const { confirm, alert } = useConfirm();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [recipes, setRecipes] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadRecipes = () =>
    apiRecipes
      .getAll({ limit: 30 })
      .then((data) => setRecipes(data?.recipes || []))
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    if (location.state?.editRecipeId && recipes.length > 0) {
      const targetRecipe = recipes.find(
        (r) => String(r.id || r._id) === String(location.state.editRecipeId)
      );
      if (targetRecipe && canManageOwnedContent(user, targetRecipe.authorId)) {
        openEditForm(targetRecipe);
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, recipes, user, navigate]);

  const editTitleInputRef = useRef(null);
  const editModalBodyRef = useRef(null);

  useEffect(() => {
    if (editingRecipe) {
      document.body.classList.add("modal-open");
      const timer = setTimeout(() => {
        if (editTitleInputRef.current) {
          editTitleInputRef.current.focus();
        }
        if (editModalBodyRef.current) {
          editModalBodyRef.current.scrollTop = 0;
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      document.body.classList.remove("modal-open");
    }
  }, [editingRecipe]);

  const openForm = () => {
    if (!user) {
      navigate("/login", { state: { message: "Bạn cần đăng nhập để chia sẻ công thức." } });
      return;
    }
    setFormOpen((open) => !open);
  };

  const createRecipe = async (event) => {
    event.preventDefault();
    try {
      let imageUrl = "";
      if (form.imageFile) {
        imageUrl = await uploadRecipeImage(form.imageFile);
      }
      await apiRecipes.create(buildRecipePayload(form, imageUrl));
      await loadRecipes();
      setForm(initialForm);
      setFormOpen(false);
    } catch (error) {
      await alert({
        title: "Lỗi đăng công thức",
        message: error.message,
        variant: "danger"
      });
    }
  };

  const openEditForm = (recipe) => {
    if (!canManageOwnedContent(user, recipe.authorId)) return;
    setEditForm(toRecipeForm(recipe));
    setEditingRecipe(recipe);
  };

  const closeEditForm = async () => {
    if (savingEdit) return;

    // Check if form has changed
    const originalForm = toRecipeForm(editingRecipe);
    const hasChanged =
      editForm.title !== originalForm.title ||
      editForm.description !== originalForm.description ||
      editForm.ingredients !== originalForm.ingredients ||
      editForm.instructions !== originalForm.instructions ||
      editForm.difficulty !== originalForm.difficulty ||
      Number(editForm.cookingTime) !== Number(originalForm.cookingTime) ||
      Number(editForm.servings) !== Number(originalForm.servings) ||
      editForm.tags !== originalForm.tags ||
      editForm.imageFile !== null;

    if (hasChanged) {
      const ok = await confirm({
        title: "Hủy thay đổi?",
        message: "Bạn có chắc muốn hủy các thay đổi chưa lưu?",
        confirmText: "Hủy thay đổi",
        variant: "danger"
      });
      if (!ok) return;
    }

    setEditingRecipe(null);
    setEditForm(initialForm);
  };

  useEffect(() => {
    if (!editingRecipe) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !savingEdit) {
        void closeEditForm();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [editingRecipe, savingEdit, editForm]);

  const saveRecipe = async (event) => {
    event.preventDefault();
    const id = editingRecipe?.id || editingRecipe?._id;
    if (!id || !canManageOwnedContent(user, editingRecipe.authorId)) return;

    setSavingEdit(true);
    try {
      let imageUrl = editForm.imageUrl;
      if (editForm.imageFile) {
        imageUrl = await uploadRecipeImage(editForm.imageFile);
      }

      await apiRecipes.update(id, buildRecipePayload(editForm, imageUrl));
      await loadRecipes();
      setEditingRecipe(null);
      setEditForm(initialForm);
    } catch (error) {
      await alert({
        title: "Lỗi sửa công thức",
        message: error.message,
        variant: "danger"
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteRecipe = async (recipe) => {
    const id = recipe.id || recipe._id;
    if (!id || !canManageOwnedContent(user, recipe.authorId)) return;
    const ok = await confirm({
      title: "Xóa công thức?",
      message: `Bạn có chắc muốn xóa công thức "${recipe.title}"? Thao tác này không thể hoàn tác.`,
      confirmText: "Xóa công thức",
      variant: "danger"
    });
    if (!ok) return;

    setDeletingId(id);
    try {
      await apiRecipes.delete(id);
      setRecipes((current) => current.filter((item) => (item.id || item._id) !== id));
    } catch (error) {
      await alert({
        title: "Lỗi xóa công thức",
        message: error.message,
        variant: "danger"
      });
    } finally {
      setDeletingId(null);
    }
  };



  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const updateEdit = (field) => (event) =>
    setEditForm((current) => ({ ...current, [field]: event.target.value }));

  return (
    <div className="page-container recipes-page">
      <header className="page-heading" data-tour="recipes-heading">
        <div><span className="eyebrow">SEAFOOD KITCHEN</span><h1>Cẩm nang công thức</h1><p>Công thức chế biến từ cộng đồng ngư dân đã xác minh.</p></div>
        <button className="button button--primary" data-tour="recipes-create" onClick={openForm} type="button"><Plus size={17} /> Chia sẻ công thức</button>
      </header>

      {formOpen && (
        <form className="dashboard-panel feature-form" onSubmit={createRecipe}>
          <input onChange={update("title")} placeholder="Tên món ăn" required value={form.title} />
          <textarea onChange={update("description")} placeholder="Mô tả món ăn" required rows="3" value={form.description} />
          <div className="form-grid">
            <textarea onChange={update("ingredients")} placeholder="Nguyên liệu, mỗi dòng một mục" required rows="5" value={form.ingredients} />
            <textarea onChange={update("instructions")} placeholder="Các bước, mỗi dòng một bước" required rows="5" value={form.instructions} />
            <div className="recipe-image-field">
              <ImageUploader
                files={form.imageFile ? [form.imageFile] : []}
                maxFiles={1}
                onChange={(files) => setForm((f) => ({ ...f, imageFile: files[0] || null }))}
              />
              <small>Nên dùng ảnh ngang tối thiểu 800 × 500 px để hiển thị rõ nét.</small>
            </div>

            <select onChange={update("difficulty")} value={form.difficulty}><option value="Easy">Dễ</option><option value="Medium">Trung bình</option><option value="Hard">Khó</option></select>
            <input min="1" onChange={update("cookingTime")} type="number" value={form.cookingTime} />
            <input min="1" onChange={update("servings")} type="number" value={form.servings} />
          </div>
          <input onChange={update("tags")} placeholder="Thẻ, phân cách bằng dấu phẩy" value={form.tags} />
          <div className="form-actions"><button className="button button--primary" type="submit">Đăng công thức</button></div>
        </form>
      )}

      {editingRecipe && createPortal(
        <div
          className="recipe-edit-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) void closeEditForm();
          }}
          role="presentation"
        >
          <form
            aria-labelledby="recipe-edit-title"
            aria-modal="true"
            className="recipe-edit-modal"
            onSubmit={saveRecipe}
            role="dialog"
          >
            <div className="recipe-edit-modal__header">
              <div>
                <span className="eyebrow">CHỈNH SỬA CÔNG THỨC</span>
                <h2 id="recipe-edit-title">{editForm.title || editingRecipe.title}</h2>
              </div>
              <button
                aria-label="Đóng form sửa công thức"
                disabled={savingEdit}
                onClick={closeEditForm}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="recipe-edit-modal__body" ref={editModalBodyRef}>
              <label className="form-field">
                <span>Tên món ăn</span>
                <input
                  ref={editTitleInputRef}
                  onChange={updateEdit("title")}
                  required
                  value={editForm.title}
                />
              </label>
              <label className="form-field">
                <span>Mô tả</span>
                <textarea onChange={updateEdit("description")} required rows="3" value={editForm.description} />
              </label>
              <div className="recipe-edit-form__columns">
                <label className="form-field">
                  <span>Nguyên liệu</span>
                  <textarea onChange={updateEdit("ingredients")} required rows="6" value={editForm.ingredients} />
                </label>
                <label className="form-field">
                  <span>Các bước thực hiện</span>
                  <textarea onChange={updateEdit("instructions")} required rows="6" value={editForm.instructions} />
                </label>
              </div>
              <div className="recipe-edit-form__details">
                <label className="form-field">
                  <span>Độ khó</span>
                  <select onChange={updateEdit("difficulty")} value={editForm.difficulty}>
                    <option value="Easy">Dễ</option>
                    <option value="Medium">Trung bình</option>
                    <option value="Hard">Khó</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>Thời gian (phút)</span>
                  <input min="1" onChange={updateEdit("cookingTime")} required type="number" value={editForm.cookingTime} />
                </label>
                <label className="form-field">
                  <span>Khẩu phần</span>
                  <input min="1" onChange={updateEdit("servings")} required type="number" value={editForm.servings} />
                </label>
              </div>
              <label className="form-field">
                <span>Thẻ, phân cách bằng dấu phẩy</span>
                <input onChange={updateEdit("tags")} value={editForm.tags} />
              </label>

              <div className="recipe-edit-image">
                {editForm.imageUrl && (
                  <figure>
                    <img alt={`Ảnh hiện tại của ${editForm.title}`} src={getOptimizedImageUrl(editForm.imageUrl, 320, 200)} />
                    <figcaption>Ảnh hiện tại</figcaption>
                  </figure>
                )}
                <div className="recipe-image-field">
                  <ImageUploader
                    files={editForm.imageFile ? [editForm.imageFile] : []}
                    maxFiles={1}
                    onChange={(files) =>
                      setEditForm((current) => ({ ...current, imageFile: files[0] || null }))
                    }
                  />
                  <small>Chọn ảnh mới nếu muốn thay ảnh hiện tại. Khuyến nghị tối thiểu 800 × 500 px.</small>
                </div>
              </div>
            </div>

            <div className="recipe-edit-modal__footer">
              <button className="button button--secondary" disabled={savingEdit} onClick={closeEditForm} type="button">
                Hủy
              </button>
              <button className="button button--primary" disabled={savingEdit} type="submit">
                <Pencil size={16} /> {savingEdit ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {loading && <div className="page-state">Đang tải công thức...</div>}
      <div className="recipe-grid" data-tour="recipes-grid">
        {recipes.map((recipe) => {
          const id = recipe.id || recipe._id;
          const canManage = canManageOwnedContent(user, recipe.authorId);
          const difficultyClass = difficultyClassNames[recipe.difficulty] || "is-medium";
          return (
            <article className="recipe-card" data-tour="recipe-card" key={id}>
              <Link className="recipe-card__link" data-tour="recipe-card-details" to={`/recipes/${id}`}>
                <div className="recipe-card__media">
                  <RecipeCardImage imageUrl={recipe.imageUrl} title={recipe.title} />
                </div>
                <div className="recipe-card__body"><span className={`recipe-card__difficulty ${difficultyClass}`}>{recipe.difficulty}</span><h2>{recipe.title}</h2><p>{recipe.description}</p>
                  <footer><small><Clock3 size={14} /> {recipe.cookingTime} phút</small><small><Users size={14} /> {recipe.servings}</small><small><Heart size={14} /> {recipe.likes?.length || 0}</small></footer>
                </div>
              </Link>
              {canManage && (
                <div className="recipe-card__actions">
                  <button
                    aria-label={`Sửa công thức ${recipe.title}`}
                    className="recipe-card__action recipe-card__edit"
                    onClick={() => openEditForm(recipe)}
                    title="Sửa công thức"
                    type="button"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    aria-label={`Xóa công thức ${recipe.title}`}
                    className="recipe-card__action recipe-card__delete"
                    disabled={deletingId === id}
                    onClick={() => deleteRecipe(recipe)}
                    title="Xóa công thức"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {!loading && recipes.length === 0 && <div className="empty-state">Chưa có công thức nào.</div>}
    </div>
  );
}
