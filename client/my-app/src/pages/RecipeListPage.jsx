import React, { useState, useEffect } from "react";
import { useSEO } from "../hooks/useSEO";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";
import { Link } from "react-router-dom";
import { VerifiedBadge } from "../components/VerifiedBadge";

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1000;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.85
        );
      };
    };
  });
};

export function RecipeListPage() {
  useSEO({
    title: "Bí Quyết Nấu Nướng - Công Thức Hải Sản | HảiSản.vn",
    description: "Khám phá hàng trăm công thức chế biến hải sản hấp dẫn được chia sẻ trực tiếp từ các ngư dân và đầu bếp bản địa.",
  });

  const { user } = useAuth();
  const { addToast } = useToast();

  const [recipes, setRecipes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  // Modal Creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // New Recipe Form states
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIngredients, setNewIngredients] = useState("");
  const [newInstructions, setNewInstructions] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("Medium");
  const [newCookingTime, setNewCookingTime] = useState(30);
  const [newServings, setNewServings] = useState(2);
  const [newTags, setNewTags] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const tagsList = ["Cá", "Tôm", "Cua", "Mực", "Nghêu", "Ốc", "Lẩu", "Hấp", "Nướng", "Xào"];

  const fetchRecipes = async (pageNum = 1) => {
    setLoading(true);
    try {
      let query = `/recipes?page=${pageNum}&limit=9`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (difficulty) query += `&difficulty=${difficulty}`;
      if (selectedTag) query += `&tag=${encodeURIComponent(selectedTag)}`;
      
      const res = await api(query);
      setRecipes(res.recipes || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
      setPages(res.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes(1);
  }, [difficulty, selectedTag]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecipes(1);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateRecipe = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim() || !newIngredients.trim() || !newInstructions.trim()) {
      addToast("Vui lòng điền đầy đủ các trường thông tin bắt buộc", "warn");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = null;

      // Upload to Cloudinary if file selected
      if (imageFile) {
        const sigData = await api("/images/signature");
        const compressed = await compressImage(imageFile);
        
        const fd = new FormData();
        fd.append("file", compressed);
        fd.append("api_key", sigData.apiKey);
        fd.append("timestamp", sigData.timestamp);
        fd.append("signature", sigData.signature);
        fd.append("folder", sigData.folder);

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
          { method: "POST", body: fd }
        );

        if (!cloudRes.ok) {
          throw new Error("Không thể tải ảnh lên máy chủ CDN");
        }

        const cloudData = await cloudRes.json();
        imageUrl = cloudData.secure_url;
      }

      const payload = {
        title: newTitle,
        description: newDesc,
        ingredients: newIngredients.split("\n").filter(i => i.trim() !== ""),
        instructions: newInstructions.split("\n").filter(i => i.trim() !== ""),
        imageUrl,
        difficulty: newDifficulty,
        cookingTime: Number(newCookingTime),
        servings: Number(newServings),
        tags: newTags.split(",").map(t => t.trim()).filter(t => t !== ""),
      };

      await api("/recipes", {
        method: "POST",
        body: payload,
      });

      addToast("Tạo công thức thành công!", "success");
      setShowCreateModal(false);
      // Reset form
      setNewTitle("");
      setNewDesc("");
      setNewIngredients("");
      setNewInstructions("");
      setNewDifficulty("Medium");
      setNewCookingTime(30);
      setNewServings(2);
      setNewTags("");
      setImageFile(null);
      setImagePreview(null);
      fetchRecipes(1);
    } catch (err) {
      addToast(err.message || "Có lỗi xảy ra", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const isVerifiedUser = user && (user.role === "Admin" || user.isVerified);

  return (
    <div className="page-wrap-lg fade-up">
      {/* Intro Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: "20px",
        marginBottom: "40px"
      }}>
        <div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: "900", color: "var(--dark)", marginBottom: "12px" }}>
            Bí Quyết Nấu Nướng Hải Sản
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: "600px", fontSize: "15px", lineHeight: "1.6" }}>
            Học hỏi cách chế biến các món hải sản đậm chất làng chài từ chính những ngư dân đánh bắt và các chuyên gia ẩm thực.
          </p>
        </div>

        {isVerifiedUser && (
          <button 
            onClick={() => setShowCreateModal(true)}
            style={{
              background: "var(--ocean)",
              color: "var(--white)",
              border: "none",
              borderRadius: "99px",
              padding: "12px 24px",
              fontWeight: "700",
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "var(--shadow-md)",
              transition: "var(--transition)"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            🍳 Chia Sẻ Công Thức
          </button>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div style={{
        background: "var(--white)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        marginBottom: "32px",
        border: "1px solid var(--border-l)",
        boxShadow: "var(--shadow-sm)"
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <input 
            type="text"
            placeholder="Tìm kiếm công thức nấu ăn (ví dụ: Cá chẽm sốt cam, mực nướng...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: "1",
              minWidth: "260px",
              padding: "12px 18px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              fontSize: "14px",
              outline: "none"
            }}
          />
          <button type="submit" style={{
            background: "var(--ocean)",
            color: "var(--white)",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: "12px 24px",
            fontWeight: "700",
            cursor: "pointer"
          }}>Tìm kiếm</button>
        </form>

        {/* Tag pills and Difficulty */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button 
              onClick={() => setSelectedTag("")}
              style={{
                padding: "6px 14px",
                borderRadius: "99px",
                border: "1px solid var(--border)",
                fontSize: "13px",
                background: selectedTag === "" ? "var(--ocean-p)" : "var(--white)",
                color: selectedTag === "" ? "var(--ocean-d)" : "var(--text-2)",
                fontWeight: selectedTag === "" ? "700" : "500",
                cursor: "pointer",
                transition: "var(--transition)"
              }}
            >
              Tất cả
            </button>
            {tagsList.map(t => (
              <button 
                key={t}
                onClick={() => setSelectedTag(t)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "99px",
                  border: "1px solid var(--border)",
                  fontSize: "13px",
                  background: selectedTag === t ? "var(--ocean-p)" : "var(--white)",
                  color: selectedTag === t ? "var(--ocean-d)" : "var(--text-2)",
                  fontWeight: selectedTag === t ? "700" : "500",
                  cursor: "pointer",
                  transition: "var(--transition)"
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)", fontWeight: "600" }}>Độ khó:</span>
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                fontSize: "13px",
                background: "var(--white)",
                outline: "none"
              }}
            >
              <option value="">Tất cả</option>
              <option value="Easy">Dễ</option>
              <option value="Medium">Trung bình</option>
              <option value="Hard">Khó</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)" }}>
          Đang tải công thức...
        </div>
      ) : recipes.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "80px 20px",
          color: "var(--muted)",
          background: "var(--white)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-l)"
        }}>
           Không tìm thấy công thức nấu ăn nào khớp với bộ lọc của bạn.
        </div>
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "28px",
            marginBottom: "40px"
          }}>
            {recipes.map((recipe) => (
              <Link 
                key={recipe._id} 
                to={`/cong-thuc/${recipe._id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{
                  background: "var(--white)",
                  borderRadius: "var(--radius-xl)",
                  overflow: "hidden",
                  border: "1px solid var(--border-l)",
                  boxShadow: "var(--shadow-sm)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "var(--transition)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}>
                  {/* Recipe Image */}
                  <div style={{ position: "relative", height: "200px", background: "var(--bg-2)" }}>
                    {recipe.imageUrl ? (
                      <img 
                        src={recipe.imageUrl} 
                        alt={recipe.title} 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        fontSize: "48px",
                        color: "var(--border)"
                      }}>🐟</div>
                    )}
                    {/* Difficulty Tag */}
                    <span style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      background: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(4px)",
                      color: "var(--white)",
                      padding: "4px 10px",
                      borderRadius: "99px",
                      fontSize: "11px",
                      fontWeight: "700"
                    }}>
                      {recipe.difficulty === "Easy" ? "Dễ" : recipe.difficulty === "Medium" ? "Vừa" : "Khó"}
                    </span>
                  </div>

                  {/* Recipe Content */}
                  <div style={{ padding: "24px", flex: "1", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--dark)", marginBottom: "8px", lineHeight: "1.4" }}>
                        {recipe.title}
                      </h3>
                      <p style={{
                        color: "var(--muted)",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        marginBottom: "16px",
                        display: "-webkit-box",
                        WebkitLineClamp: "2",
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {recipe.description}
                      </p>
                    </div>

                    <div style={{
                      borderTop: "1px solid var(--border-l)",
                      paddingTop: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "13px",
                      color: "var(--text-2)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span>⏱️ {recipe.cookingTime} phút</span>
                        <span>👥 {recipe.servings} người</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--ocean-d)" }}>
                          {recipe.authorId?.name || "Ngư dân"}
                        </span>
                        {recipe.authorId?.isVerified && <VerifiedBadge size="sm" />}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
              <button 
                disabled={page === 1}
                onClick={() => fetchRecipes(page - 1)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  background: "var(--white)",
                  cursor: "pointer",
                  opacity: page === 1 ? 0.5 : 1
                }}
              >
                Trở lại
              </button>
              <span style={{ display: "flex", alignItems: "center", padding: "0 12px", fontSize: "14px", fontWeight: "600" }}>
                Trang {page} / {pages}
              </span>
              <button 
                disabled={page === pages}
                onClick={() => fetchRecipes(page + 1)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  background: "var(--white)",
                  cursor: "pointer",
                  opacity: page === pages ? 0.5 : 1
                }}
              >
                Tiếp theo
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Recipe Modal */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          inset: "0",
          background: "rgba(15,27,41,0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: "9999",
          padding: "16px"
        }}>
          <div style={{
            background: "var(--white)",
            borderRadius: "var(--radius-xl)",
            width: "100%",
            maxWidth: "680px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "36px",
            boxShadow: "var(--shadow-xl)",
            position: "relative"
          }}>
            <button 
              onClick={() => setShowCreateModal(false)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "var(--muted)"
              }}
            >
              &times;
            </button>

            <h2 style={{ fontSize: "22px", fontWeight: "900", color: "var(--dark)", marginBottom: "24px" }}>
              Chia Sẻ Bí Quyết Chế Biến Hải Sản
            </h2>

            <form onSubmit={handleCreateRecipe} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Tiêu đề món ăn*</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Cá Bớp Kho Tộ Kiểu Cổ Truyền"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", outline: "none" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Mô tả ngắn*</label>
                <textarea 
                  rows="2"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Mô tả sơ qua về hương vị và điểm đặc biệt của món ăn."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", outline: "none", resize: "vertical" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Nguyên liệu (Mỗi dòng 1 nguyên liệu)*</label>
                  <textarea 
                    rows="5"
                    value={newIngredients}
                    onChange={(e) => setNewIngredients(e.target.value)}
                    placeholder="Ví dụ:&#13;500g cá bớp tươi&#13;3 muỗng nước mắm cốt&#13;Hành lá, tiêu sọ..."
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", outline: "none", resize: "vertical" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Các bước thực hiện (Mỗi dòng 1 bước)*</label>
                  <textarea 
                    rows="5"
                    value={newInstructions}
                    onChange={(e) => setNewInstructions(e.target.value)}
                    placeholder="Ví dụ:&#13;Bước 1: Rửa sạch cá bằng nước muối loãng.&#13;Bước 2: Ướp cá với mắm, tiêu trong 15 phút..."
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", outline: "none", resize: "vertical" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Độ khó</label>
                  <select 
                    value={newDifficulty} 
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}
                  >
                    <option value="Easy">Dễ</option>
                    <option value="Medium">Vừa</option>
                    <option value="Hard">Khó</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>TG nấu (phút)</label>
                  <input 
                    type="number" 
                    value={newCookingTime}
                    onChange={(e) => setNewCookingTime(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Khẩu phần (người)</label>
                  <input 
                    type="number" 
                    value={newServings}
                    onChange={(e) => setNewServings(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Thẻ phân loại (ngăn cách bằng dấu phẩy)</label>
                <input 
                  type="text" 
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Ví dụ: Cá, Kho, Bữa cơm gia đình"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>Hình ảnh món ăn</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ marginBottom: "10px" }}
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "var(--radius-sm)" }} />
                )}
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: "1",
                    padding: "12px",
                    borderRadius: "99px",
                    border: "1px solid var(--border)",
                    background: "var(--white)",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: "1",
                    padding: "12px",
                    borderRadius: "99px",
                    border: "none",
                    background: "var(--ocean)",
                    color: "var(--white)",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "var(--shadow-sm)"
                  }}
                >
                  {submitting ? "Đang chia sẻ..." : "Chia Sẻ Công Thức"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
