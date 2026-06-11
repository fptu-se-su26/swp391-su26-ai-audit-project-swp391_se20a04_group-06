import { useState } from "react";
import { useSEO } from "../hooks/useSEO";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";
import { useApiFetch } from "../hooks/useApiFetch";
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
          0.85,
        );
      };
    };
  });
};

export function RecipeListPage() {
  useSEO({
    title: "Bí Quyết Nấu Nướng - Công Thức Hải Sản | Haisan.vn",
    description:
      "Khám phá hàng trăm công thức chế biến hải sản hấp dẫn được chia sẻ trực tiếp từ các ngư dân và đầu bếp bản địa.",
  });

  const { user } = useAuth();
  const toast = useToast();

  // Filter UI states
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [version, setVersion] = useState(0);

  // Xây dựng truy vấn URL dựa trên bộ lọc
  const queryUrl =
    `/recipes?page=${currentPage}&limit=9` +
    (appliedSearch ? `&search=${encodeURIComponent(appliedSearch)}` : "") +
    (difficulty ? `&difficulty=${difficulty}` : "") +
    (selectedTag ? `&tag=${encodeURIComponent(selectedTag)}` : "");

  // Áp dụng Custom Hook useApiFetch
  const { data, loading } = useApiFetch(queryUrl, [
    currentPage,
    appliedSearch,
    difficulty,
    selectedTag,
    version,
  ]);

  const recipes = data?.recipes || [];
  const page = data?.page || 1;
  const pages = data?.pages || 1;

  // Modal Creation states
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

  const tagsList = [
    "Cá",
    "Tôm",
    "Cua",
    "Mực",
    "Nghêu",
    "Ốc",
    "Lẩu",
    "Hấp",
    "Nướng",
    "Xào",
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setAppliedSearch(search);
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
    if (
      !newTitle.trim() ||
      !newDesc.trim() ||
      !newIngredients.trim() ||
      !newInstructions.trim()
    ) {
      toast.warn("Vui lòng điền đầy đủ các trường thông tin bắt buộc");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = null;

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
          { method: "POST", body: fd },
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
        ingredients: newIngredients.split("\n").filter((i) => i.trim() !== ""),
        instructions: newInstructions
          .split("\n")
          .filter((i) => i.trim() !== ""),
        imageUrl,
        difficulty: newDifficulty,
        cookingTime: Number(newCookingTime),
        servings: Number(newServings),
        tags: newTags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t !== ""),
      };

      await api("/recipes", {
        method: "POST",
        body: payload,
      });

      toast.success("Tạo công thức thành công!");
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

      setCurrentPage(1);
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const isVerifiedUser = user && (user.role === "Admin" || user.isVerified);

  return (
    /* Wrapper ngoài cùng nhận diện màu nền trải rộng 100% chiều rộng */
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "var(--bg-1, #f8fafc)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Container nội dung ở giữa hẹp hơn (960px) và căn lề đều đặn */}
      <div
        className="fade-up"
        style={{
          width: "100%",
          maxWidth: "960px",
          padding: "40px 24px 80px",
          boxSizing: "border-box",
        }}
      >
        {/* Intro Header */}
        <div
          style={{
            display: "flex",
            justify: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: "900",
                color: "var(--dark)",
                marginBottom: "12px",
              }}
            >
              Bí Quyết Nấu Nướng Hải Sản
            </h1>
            <p
              style={{
                color: "var(--muted)",
                maxWidth: "600px",
                fontSize: "14.5px",
                lineHeight: "1.6",
              }}
            >
              Học hỏi cách chế biến các món hải sản đậm chất làng chài từ chính
              những ngư dân đánh bắt và các chuyên gia ẩm thực.
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
              }}
            >
              🍳 Chia Sẻ Công Thức
            </button>
          )}
        </div>

        {/* Bộ lọc tìm kiếm */}
        <div
          style={{
            background: "var(--white)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            marginBottom: "32px",
            border: "1px solid var(--border-l)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Tìm kiếm công thức nấu ăn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: "1",
                minWidth: "260px",
                padding: "12px 18px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                background: "var(--ocean)",
                color: "var(--white)",
                border: "none",
                borderRadius: "var(--radius-md)",
                padding: "12px 24px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Tìm kiếm
            </button>
          </form>

          <div
            style={{
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  setSelectedTag("");
                  setCurrentPage(1);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "99px",
                  border: "1px solid var(--border)",
                  fontSize: "13px",
                  background:
                    selectedTag === "" ? "var(--ocean-p)" : "var(--white)",
                  color:
                    selectedTag === "" ? "var(--ocean-d)" : "var(--text-2)",
                  fontWeight: selectedTag === "" ? "700" : "500",
                  cursor: "pointer",
                }}
              >
                Tất cả
              </button>
              {tagsList.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedTag(t);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "99px",
                    border: "1px solid var(--border)",
                    fontSize: "13px",
                    background:
                      selectedTag === t ? "var(--ocean-p)" : "var(--white)",
                    color:
                      selectedTag === t ? "var(--ocean-d)" : "var(--text-2)",
                    fontWeight: selectedTag === t ? "700" : "500",
                    cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--muted)",
                  fontWeight: "600",
                }}
              >
                Độ khó:
              </span>
              <select
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  fontSize: "13px",
                  background: "var(--white)",
                  outline: "none",
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

        {/* Hiển thị danh sách */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              color: "var(--muted)",
            }}
          >
            Đang tải công thức...
          </div>
        ) : recipes.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              color: "var(--muted)",
              background: "var(--white)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-l)",
            }}
          >
            Không tìm thấy công thức nấu ăn nào khớp với bộ lọc của bạn.
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                gap: "24px",
                marginBottom: "40px",
              }}
            >
              {recipes.map((recipe) => (
                <Link
                  key={recipe._id}
                  to={`/cong-thuc/${recipe._id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{
                      background: "var(--white)",
                      borderRadius: "var(--radius-xl)",
                      overflow: "hidden",
                      border: "1px solid var(--border-l)",
                      boxShadow: "var(--shadow-sm)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        height: "180px",
                        background: "var(--bg-2)",
                      }}
                    >
                      {recipe.imageUrl ? (
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            fontSize: "48px",
                            color: "var(--border)",
                          }}
                        >
                          🐟
                        </div>
                      )}
                      <span
                        style={{
                          position: "absolute",
                          top: "12px",
                          left: "12px",
                          background: "rgba(0,0,0,0.6)",
                          backdropFilter: "blur(4px)",
                          color: "var(--white)",
                          padding: "4px 10px",
                          borderRadius: "99px",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        {recipe.difficulty === "Easy"
                          ? "Dễ"
                          : recipe.difficulty === "Medium"
                            ? "Vừa"
                            : "Khó"}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: "20px",
                        flex: "1",
                        display: "flex",
                        flexDirection: "column",
                        justify: "space-between",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: "16px",
                            fontWeight: "800",
                            color: "var(--dark)",
                            marginBottom: "8px",
                            lineHeight: "1.4",
                          }}
                        >
                          {recipe.title}
                        </h3>
                        <p
                          style={{
                            color: "var(--muted)",
                            fontSize: "13px",
                            lineHeight: "1.5",
                            marginBottom: "16px",
                            display: "-webkit-box",
                            WebkitLineClamp: "2",
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {recipe.description}
                        </p>
                      </div>

                      <div
                        style={{
                          borderTop: "1px solid var(--border-l)",
                          paddingTop: "14px",
                          display: "flex",
                          justify: "space-between",
                          alignItems: "center",
                          fontSize: "12.5px",
                          color: "var(--text-2)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span>⏱️ {recipe.cookingTime} phút</span>
                          <span>👥 {recipe.servings} người</span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "var(--ocean-d)",
                            }}
                          >
                            {recipe.authorId?.name || "Ngư dân"}
                          </span>
                          {recipe.authorId?.isVerified && (
                            <VerifiedBadge size="sm" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Phân trang */}
            {pages > 1 && (
              <div
                style={{
                  display: "flex",
                  justify: "center",
                  gap: "8px",
                  marginTop: "24px",
                }}
              >
                <button
                  disabled={page === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    background: "var(--white)",
                    cursor: "pointer",
                    opacity: page === 1 ? 0.5 : 1,
                  }}
                >
                  Trở lại
                </button>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 12px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Trang {page} / {pages}
                </span>
                <button
                  disabled={page === pages}
                  onClick={() => setCurrentPage((p) => Math.min(pages, p + 1))}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    background: "var(--white)",
                    cursor: "pointer",
                    opacity: page === pages ? 0.5 : 1,
                  }}
                >
                  Tiếp theo
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal chia sẻ công thức mới */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: "0",
            background: "rgba(15,27,41,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "9999",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "var(--white)",
              borderRadius: "var(--radius-xl)",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "36px",
              boxShadow: "var(--shadow-xl)",
              position: "relative",
            }}
          >
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
                color: "var(--muted)",
              }}
            >
              &times;
            </button>

            <h2
              style={{
                fontSize: "22px",
                fontWeight: "900",
                color: "var(--dark)",
                marginBottom: "24px",
              }}
            >
              Chia Sẻ Bí Quyết Chế Biến Hải Sản
            </h2>

            <form
              onSubmit={handleCreateRecipe}
              style={{ display: "flex", flexDirection: "column", gap: "18px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    marginBottom: "6px",
                  }}
                >
                  Tiêu đề món ăn*
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Cá Bớp Kho Tộ Kiểu Cổ Truyền"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    outline: "none",
                  }}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    marginBottom: "6px",
                  }}
                >
                  Mô tả ngắn*
                </label>
                <textarea
                  rows="2"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Mô tả sơ qua hương vị món ăn."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    outline: "none",
                    resize: "vertical",
                  }}
                  required
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      marginBottom: "6px",
                    }}
                  >
                    Nguyên liệu (Mỗi dòng 1 nguyên liệu)*
                  </label>
                  <textarea
                    rows="5"
                    value={newIngredients}
                    onChange={(e) => setNewIngredients(e.target.value)}
                    placeholder="Ví dụ:&#13;500g cá bớp tươi&#13;3 muỗng nước mắm..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      outline: "none",
                      resize: "vertical",
                    }}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      marginBottom: "6px",
                    }}
                  >
                    Các bước thực hiện (Mỗi dòng 1 bước)*
                  </label>
                  <textarea
                    rows="5"
                    value={newInstructions}
                    onChange={(e) => setNewInstructions(e.target.value)}
                    placeholder="Ví dụ:&#13;Bước 1: Rửa sạch cá...&#13;Bước 2: Ướp cá..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      outline: "none",
                      resize: "vertical",
                    }}
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      marginBottom: "6px",
                    }}
                  >
                    Độ khó
                  </label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <option value="Easy">Dễ</option>
                    <option value="Medium">Vừa</option>
                    <option value="Hard">Khó</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      marginBottom: "6px",
                    }}
                  >
                    TG nấu (phút)
                  </label>
                  <input
                    type="number"
                    value={newCookingTime}
                    onChange={(e) => setNewCookingTime(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      marginBottom: "6px",
                    }}
                  >
                    Khẩu phần (người)
                  </label>
                  <input
                    type="number"
                    value={newServings}
                    onChange={(e) => setNewServings(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    marginBottom: "6px",
                  }}
                >
                  Thẻ phân loại (ngăn cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Ví dụ: Cá, Kho, Bữa cơm gia đình"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    marginBottom: "6px",
                  }}
                >
                  Hình ảnh món ăn
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ marginBottom: "10px" }}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "var(--radius-sm)",
                    }}
                  />
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
                    cursor: "pointer",
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
