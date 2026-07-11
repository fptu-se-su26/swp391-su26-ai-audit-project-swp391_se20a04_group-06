import { ChefHat, Clock3, Users, Check } from "lucide-react";
import { useEffect, useState } from "react";

export default function RecipeLivePreview({ form }) {
  const [imageSrc, setImageSrc] = useState("");

  useEffect(() => {
    if (form.imageFile) {
      const url = URL.createObjectURL(form.imageFile);
      setImageSrc(url);
      return () => URL.revokeObjectURL(url);
    } else if (form.imageUrl) {
      setImageSrc(form.imageUrl);
    } else {
      setImageSrc("");
    }
    return undefined;
  }, [form.imageFile, form.imageUrl]);

  const ingredientsList = (form.ingredients || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const instructionsList = (form.instructions || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const tagsList = (form.tags || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const getDifficultyLabel = (diff) => {
    if (diff === "Easy") return "Dễ";
    if (diff === "Hard") return "Khó";
    return "Trung bình";
  };

  return (
    <div className="recipe-live-preview">
      {/* Media Image section */}
      <div className="recipe-detail__media" style={{ height: "180px", marginBottom: "16px" }}>
        {imageSrc ? (
          <img
            alt={form.title || "Xem trước món ăn"}
            src={imageSrc}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px" }}
          />
        ) : (
          <div className="recipe-detail__placeholder" style={{ padding: "20px" }}>
            <ChefHat size={40} />
            <span style={{ fontSize: "0.8rem", marginTop: "6px" }}>Ảnh món ăn sẽ hiển thị ở đây</span>
          </div>
        )}
      </div>

      {/* Meta difficulty badge */}
      <div style={{ marginBottom: "8px" }}>
        <span className="eyebrow" style={{ fontSize: "0.7rem", padding: "3px 8px" }}>
          {getDifficultyLabel(form.difficulty)}
        </span>
      </div>

      {/* Title */}
      <h3 style={{ margin: "0 0 8px 0", color: "#f8fafc", fontSize: "1.25rem", fontWeight: "700" }}>
        {form.title?.trim() || <span style={{ color: "#475569" }}>Tên món ăn</span>}
      </h3>

      {/* Description */}
      <p style={{ margin: "0 0 16px 0", color: "#94a3b8", fontSize: "0.85rem", lineHeight: "1.4" }}>
        {form.description?.trim() || <span style={{ color: "#475569" }}>Mô tả món ăn sẽ hiển thị tại đây</span>}
      </p>

      {/* Metadata */}
      <div className="recipe-meta" style={{ display: "flex", gap: "16px", marginBottom: "16px", padding: "0 0 12px 0", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
        <div className="recipe-meta__item" style={{ fontSize: "0.8rem", gap: "6px" }}>
          <Clock3 size={15} />
          <span>{form.cookingTime || 30} phút</span>
        </div>
        <div className="recipe-meta__item" style={{ fontSize: "0.8rem", gap: "6px" }}>
          <Users size={15} />
          <span>{form.servings || 2} khẩu phần</span>
        </div>
      </div>

      {/* Tóm tắt Recipe */}
      <div className="preview-summary">
        <h4 className="preview-summary__title">Tóm tắt</h4>
        <div className="preview-summary__grid">
          <div className="preview-summary__item">
            Độ khó: <strong>{getDifficultyLabel(form.difficulty)}</strong>
          </div>
          <div className="preview-summary__item">
            Thời gian: <strong>{form.cookingTime || 30} phút</strong>
          </div>
          <div className="preview-summary__item">
            Khẩu phần: <strong>{form.servings || 2} người</strong>
          </div>
          <div className="preview-summary__item">
            Nguyên liệu: <strong>{ingredientsList.length} mục</strong>
          </div>
          <div className="preview-summary__item" style={{ gridColumn: "span 2" }}>
            Các bước: <strong>{instructionsList.length} bước</strong>
          </div>
        </div>
      </div>

      {/* Ingredients section */}
      <div style={{ marginBottom: "16px" }}>
        <h4 style={{ margin: "0 0 8px 0", color: "#22f3ff", fontSize: "0.9rem", fontWeight: "600" }}>Nguyên liệu</h4>
        {ingredientsList.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "6px" }}>
            {ingredientsList.map((ing, idx) => (
              <li key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", color: "#cbd5e1", fontSize: "0.8rem" }}>
                <Check size={12} style={{ color: "#22f3ff", flexShrink: 0 }} />
                <span>{ing}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, color: "#475569", fontSize: "0.8rem" }}>Chưa có nguyên liệu</p>
        )}
      </div>

      {/* Instructions section */}
      <div style={{ marginBottom: "16px" }}>
        <h4 style={{ margin: "0 0 8px 0", color: "#22f3ff", fontSize: "0.9rem", fontWeight: "600" }}>Các bước thực hiện</h4>
        {instructionsList.length > 0 ? (
          <ol style={{ paddingLeft: "16px", margin: 0, display: "grid", gap: "8px", color: "#cbd5e1", fontSize: "0.8rem" }}>
            {instructionsList.map((stepText, idx) => (
              <li key={idx} style={{ lineHeight: "1.4" }}>
                <span>{stepText}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p style={{ margin: 0, color: "#475569", fontSize: "0.8rem" }}>Chưa có bước thực hiện</p>
        )}
      </div>

      {/* Tags section */}
      {tagsList.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
          {tagsList.map((tag, idx) => (
            <span key={idx} className="recipe-tag" style={{ background: "rgba(34, 243, 255, 0.08)", border: "1px solid rgba(34, 243, 255, 0.15)", borderRadius: "6px", padding: "2px 6px", fontSize: "0.7rem", color: "#67e8f9" }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Mẹo hiển thị đẹp */}
      <div className="preview-tips">
        <h4 className="preview-tips__title">Mẹo hiển thị đẹp</h4>
        <ul>
          <li>Nên dùng ảnh ngang tối thiểu 800 × 500 px.</li>
          <li>Mỗi nguyên liệu nên xuống một dòng.</li>
          <li>Mỗi bước thực hiện nên xuống một dòng.</li>
        </ul>
      </div>
    </div>
  );
}
