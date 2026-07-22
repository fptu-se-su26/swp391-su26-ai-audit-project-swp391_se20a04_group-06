import { Calendar, ChefHat, Clock3, Heart, Loader, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import ImageUploader from "../components/shared/ImageUploader";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRecipes } from "../services/api";
import { getOptimizedImageUrl, getRecipeImageSrcSet } from "../utils/image";
import { canManageOwnedContent } from "../utils/ownership";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import IconActionButton from "../components/common/IconActionButton";
import LivePreviewShell from "../components/preview/LivePreviewShell";
import RecipeLivePreview from "../components/preview/RecipeLivePreview";
import { formatRelativeDate } from "../utils/date";


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
  easy: "is-easy",
  medium: "is-medium",
  hard: "is-hard",
  EASY: "is-easy",
  MEDIUM: "is-medium",
  HARD: "is-hard",
};

const difficultyLabels = {
  Easy: "Dễ",
  Medium: "Trung bình",
  Hard: "Khó",
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
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


import useSEO from "../hooks/useSEO";


export default function Recipes() {
  useSEO("Góc ẩm thực", "Tìm kiếm và chia sẻ các công thức chế biến hải sản tươi ngon, hấp dẫn.");
  const { confirm } = useConfirm();
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);

  const loadRecipes = () => {
    setLoading(true);
    setError("");
    apiRecipes
      .getAll({ limit: 30 })
      .then((data) => setRecipes(data?.recipes || []))
      .catch((err) => {
        setRecipes([]);
        setError(err.message || "Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền.");
      })
      .finally(() => setLoading(false));
  };

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
    if (user.role !== "Admin" && !user.isVerified) {
      toast.error("Chỉ quản trị viên hoặc ngư dân đã xác minh mới có thể chia sẻ công thức.");
      return;
    }
    setFormOpen((open) => !open);
  };

  const validateRecipeForm = (recipeForm) => {
    if (!recipeForm.title || recipeForm.title.trim().length === 0) {
      throw new Error("Tiêu đề không được để trống.");
    }
    if (recipeForm.title.trim().length > 150) {
      throw new Error("Tiêu đề không được vượt quá 150 ký tự.");
    }
    if (!recipeForm.description || recipeForm.description.trim().length === 0) {
      throw new Error("Mô tả không được để trống.");
    }
    if (recipeForm.description.trim().length > 5000) {
      throw new Error("Mô tả không được vượt quá 5000 ký tự.");
    }
    const cTime = Number(recipeForm.cookingTime);
    if (isNaN(cTime) || cTime <= 0 || cTime > 1440) {
      throw new Error("Thời gian chế biến phải lớn hơn 0 và tối đa 1440 phút (24 giờ).");
    }
    const servs = Number(recipeForm.servings);
    if (isNaN(servs) || servs <= 0 || servs > 100) {
      throw new Error("Khẩu phần ăn phải lớn hơn 0 và tối đa 100 người.");
    }
    if (recipeForm.ingredients.trim().length > 2000) {
      throw new Error("Nguyên liệu không được vượt quá 2000 ký tự.");
    }
    const ingredientsArray = recipeForm.ingredients.split("\n").map((item) => item.trim()).filter(Boolean);
    if (ingredientsArray.length > 100) {
      throw new Error("Số lượng nguyên liệu tối đa là 100.");
    }
    if (recipeForm.instructions.trim().length > 4000) {
      throw new Error("Hướng dẫn không được vượt quá 4000 ký tự.");
    }
    const instructionsArray = recipeForm.instructions.split("\n").map((item) => item.trim()).filter(Boolean);
    if (instructionsArray.length > 100) {
      throw new Error("Số lượng bước hướng dẫn tối đa là 100.");
    }
    const tagsArray = recipeForm.tags.split(",").map((item) => item.trim()).filter(Boolean);
    if (tagsArray.length > 10) {
      throw new Error("Số lượng tags tối đa là 10.");
    }
    for (const tag of tagsArray) {
      if (tag.length > 30) {
        throw new Error("Mỗi tag tối đa 30 ký tự.");
      }
    }
  };

  const createRecipe = async (event) => {
    event.preventDefault();
    try {
      validateRecipeForm(form);
    } catch (err) {
      toast.error(err.message);
      return;
    }
    if (form.imageFile) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!allowedTypes.includes(form.imageFile.type)) {
        toast.error("Chỉ cho phép tải lên hình ảnh định dạng JPG, PNG hoặc WEBP.");
        return;
      }
      if (form.imageFile.size > 2 * 1024 * 1024) {
        toast.error("Vui lòng chọn hình ảnh có dung lượng nhỏ hơn 2MB.");
        return;
      }
    }

    setSavingCreate(true);
    const toastId = toast.loading("Đang đăng công thức...");
    try {
      let imageUrl = "";
      if (form.imageFile) {
        imageUrl = await uploadRecipeImage(form.imageFile);
      }
      await apiRecipes.create(buildRecipePayload(form, imageUrl));
      await loadRecipes();
      setForm(initialForm);
      setFormOpen(false);
      toast.update(toastId, "Đăng công thức thành công!", "success");
    } catch (error) {
      toast.update(toastId, error.message || "Không thể đăng công thức.", "error");
    } finally {
      setSavingCreate(false);
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

    try {
      validateRecipeForm(editForm);
    } catch (err) {
      toast.error(err.message);
      return;
    }

    if (editForm.imageFile) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!allowedTypes.includes(editForm.imageFile.type)) {
        toast.error("Chỉ cho phép tải lên hình ảnh định dạng JPG, PNG hoặc WEBP.");
        return;
      }
      if (editForm.imageFile.size > 2 * 1024 * 1024) {
        toast.error("Vui lòng chọn hình ảnh có dung lượng nhỏ hơn 2MB.");
        return;
      }
    }

    setSavingEdit(true);
    const toastId = toast.loading("Đang cập nhật công thức...");
    try {
      let imageUrl = editForm.imageUrl;
      if (editForm.imageFile) {
        imageUrl = await uploadRecipeImage(editForm.imageFile);
      }

      await apiRecipes.update(id, buildRecipePayload(editForm, imageUrl));
      await loadRecipes();
      setEditingRecipe(null);
      setEditForm(initialForm);
      toast.update(toastId, "Cập nhật công thức thành công!", "success");
    } catch (error) {
      toast.update(toastId, error.message || "Không thể cập nhật công thức.", "error");
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
      toast.success("Đã xóa công thức thành công.");
    } catch (error) {
      toast.error(error.message || "Không thể xóa công thức.");
    } finally {
      setDeletingId(null);
    }
  };



  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const updateEdit = (field) => (event) =>
    setEditForm((current) => ({ ...current, [field]: event.target.value }));

  const selectDifficulty = (value) => setForm((current) => ({ ...current, difficulty: value }));
  const selectDifficultyEdit = (value) => setEditForm((current) => ({ ...current, difficulty: value }));

  return (
    <div className="page-container recipes-page">
      <header className="page-heading" data-tour="recipes-heading">
        <div><h1>Cẩm nang công thức</h1><p>Công thức chế biến từ cộng đồng ngư dân đã xác minh.</p></div>
        <button className="button button--primary" data-tour="recipes-create" onClick={openForm} type="button"><Plus size={17} /> Chia sẻ công thức</button>
      </header>

      {error && (
        <div className="inline-notice inline-notice--danger" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.08)", padding: "14px 18px", borderRadius: "8px", marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {formOpen && (
        <div className="recipe-editor-layout" style={{ marginBottom: "28px" }}>
          <form className="dashboard-panel feature-form recipe-form-card recipe-form-layout" onSubmit={createRecipe}>
            <label className="form-field recipe-form-layout__full">
              <span>Tên món ăn *</span>
              <input onChange={update("title")} placeholder="Ví dụ: Lẩu hải sản chua cay" required value={form.title} />
            </label>
            <label className="form-field recipe-form-layout__full">
              <span>Mô tả *</span>
              <textarea onChange={update("description")} placeholder="Mô tả ngắn gọn về hương vị hoặc nguồn gốc món ăn..." required rows="3" value={form.description} />
            </label>

            <label className="form-field recipe-form-layout__half">
              <span>Nguyên liệu (mỗi dòng một mục) *</span>
              <textarea onChange={update("ingredients")} placeholder="Ví dụ:&#10;500g tôm sú&#10;300g mực ống&#10;1 lít nước dùng xương" required rows="6" value={form.ingredients} />
            </label>
            <label className="form-field recipe-form-layout__half">
              <span>Các bước thực hiện (mỗi dòng một bước) *</span>
              <textarea onChange={update("instructions")} placeholder="Ví dụ:&#10;Sơ chế sạch các loại hải sản&#10;Đun sôi nước dùng và thêm gia vị lẩu&#10;Thả hải sản vào và dùng nóng" required rows="6" value={form.instructions} />
            </label>

            <div className="recipe-form-layout__half">
              <label className="form-field">
                <span>Ảnh công thức</span>
                <div className="recipe-image-field" style={{ marginTop: 0 }}>
                  <ImageUploader
                    files={form.imageFile ? [form.imageFile] : []}
                    maxFiles={1}
                    onChange={(files) => setForm((f) => ({ ...f, imageFile: files[0] || null }))}
                  />
                  <small>Khuyến nghị ảnh ngang tối thiểu 800 × 500 px.</small>
                </div>
              </label>
            </div>

            <div className="recipe-form-layout__half recipe-form-details-group">
              <div className="form-field">
                <span>Mức độ</span>
                <div className="difficulty-toggle">
                  <button type="button" className={`difficulty-option ${form.difficulty === "Easy" ? "active" : ""}`} onClick={() => selectDifficulty("Easy")}>Dễ</button>
                  <button type="button" className={`difficulty-option ${form.difficulty === "Medium" ? "active" : ""}`} onClick={() => selectDifficulty("Medium")}>Trung bình</button>
                  <button type="button" className={`difficulty-option ${form.difficulty === "Hard" ? "active" : ""}`} onClick={() => selectDifficulty("Hard")}>Khó</button>
                </div>
              </div>
              <div className="recipe-form-sub-details">
                <label className="form-field">
                  <span>Thời gian (phút)</span>
                  <input min="1" onChange={update("cookingTime")} required type="number" value={form.cookingTime} />
                </label>
                <label className="form-field">
                  <span>Khẩu phần</span>
                  <input min="1" onChange={update("servings")} required type="number" value={form.servings} />
                </label>
              </div>
            </div>

            <label className="form-field recipe-form-layout__full">
              <span>Thẻ (tags, phân cách bằng dấu phẩy)</span>
              <input onChange={update("tags")} placeholder="Ví dụ: cay, lẩu, tôm, mực" value={form.tags} />
            </label>

            <div className="recipe-form-footer recipe-form-layout__full">
              <button className="button button--primary" disabled={savingCreate} type="submit">{savingCreate ? <><Loader size={15} className="toast-spinner" /> Đang xử lý...</> : "Đăng công thức"}</button>
            </div>
          </form>

          <div className="recipe-preview-panel">
            <LivePreviewShell title="Xem trước công thức" subtext="Giao diện mô phỏng khi chia sẻ" badge="XEM TRƯỚC">
              <RecipeLivePreview form={form} />
            </LivePreviewShell>
          </div>
        </div>
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
              <div className="recipe-editor-layout">
                <div className="recipe-form-card recipe-form-layout">
                  <label className="form-field recipe-form-layout__full">
                    <span>Tên món ăn *</span>
                    <input
                      ref={editTitleInputRef}
                      onChange={updateEdit("title")}
                      required
                      value={editForm.title}
                    />
                  </label>
                  <label className="form-field recipe-form-layout__full">
                    <span>Mô tả *</span>
                    <textarea onChange={updateEdit("description")} required rows="3" value={editForm.description} />
                  </label>

                  <label className="form-field recipe-form-layout__half">
                    <span>Nguyên liệu (mỗi dòng một mục) *</span>
                    <textarea onChange={updateEdit("ingredients")} required rows="6" value={editForm.ingredients} />
                  </label>
                  <label className="form-field recipe-form-layout__half">
                    <span>Các bước thực hiện (mỗi dòng một bước) *</span>
                    <textarea onChange={updateEdit("instructions")} required rows="6" value={editForm.instructions} />
                  </label>

                  <div className="recipe-form-layout__half">
                    <label className="form-field">
                      <span>Ảnh công thức</span>
                      <div className="recipe-edit-image" style={{ marginTop: 0 }}>
                        {editForm.imageUrl && (
                          <figure style={{ marginBottom: "12px" }}>
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
                          <small>Chọn ảnh mới nếu muốn thay ảnh hiện tại.</small>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="recipe-form-layout__half recipe-form-details-group">
                    <div className="form-field">
                      <span>Mức độ</span>
                      <div className="difficulty-toggle">
                        <button type="button" className={`difficulty-option ${editForm.difficulty === "Easy" ? "active" : ""}`} onClick={() => selectDifficultyEdit("Easy")}>Dễ</button>
                        <button type="button" className={`difficulty-option ${editForm.difficulty === "Medium" ? "active" : ""}`} onClick={() => selectDifficultyEdit("Medium")}>Trung bình</button>
                        <button type="button" className={`difficulty-option ${editForm.difficulty === "Hard" ? "active" : ""}`} onClick={() => selectDifficultyEdit("Hard")}>Khó</button>
                      </div>
                    </div>
                    <div className="recipe-form-sub-details">
                      <label className="form-field">
                        <span>Thời gian (phút)</span>
                        <input min="1" onChange={updateEdit("cookingTime")} required type="number" value={editForm.cookingTime} />
                      </label>
                      <label className="form-field">
                        <span>Khẩu phần</span>
                        <input min="1" onChange={updateEdit("servings")} required type="number" value={editForm.servings} />
                      </label>
                    </div>
                  </div>

                  <label className="form-field recipe-form-layout__full">
                    <span>Thẻ, phân cách bằng dấu phẩy</span>
                    <input onChange={updateEdit("tags")} value={editForm.tags} />
                  </label>

                  <div className="recipe-form-footer recipe-form-layout__full">
                    <button className="button button--secondary" disabled={savingEdit} onClick={closeEditForm} type="button">
                      Hủy
                    </button>
                    <button className="button button--primary" disabled={savingEdit} type="submit">
                      <Pencil size={16} /> {savingEdit ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>

                <div className="recipe-preview-panel">
                  <LivePreviewShell title="Xem trước công thức" subtext="Giao diện mô phỏng khi chia sẻ" badge="XEM TRƯỚC">
                    <RecipeLivePreview form={editForm} />
                  </LivePreviewShell>
                </div>
              </div>
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
                <div className="recipe-card__body">
                  <span className={`recipe-card__difficulty ${difficultyClass}`}>
                    {difficultyLabels[recipe.difficulty] || recipe.difficulty}
                  </span>
                  <h2>{recipe.title}</h2>
                  <p>{recipe.description}</p>
                  <footer>
                    <small><Clock3 size={14} /> {recipe.cookingTime} phút</small>
                    <small><Users size={14} /> {recipe.servings} khẩu phần</small>
                    <small><Heart size={14} /> {recipe.likes?.length || 0} lượt thích</small>
                    {recipe.createdAt && (
                      <small><Calendar size={14} /> {formatRelativeDate(recipe.createdAt)}</small>
                    )}
                  </footer>
                </div>
              </Link>
              {canManage && (
                <div className="recipe-card__actions action-button-group card-action-buttons">
                  <IconActionButton
                    icon={<Pencil />}
                    label="Chỉnh sửa"
                    variant="primary"
                    onClick={() => openEditForm(recipe)}
                  />
                  <IconActionButton
                    icon={<Trash2 />}
                    label="Xóa"
                    variant="danger"
                    disabled={deletingId === id}
                    onClick={() => deleteRecipe(recipe)}
                  />
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
