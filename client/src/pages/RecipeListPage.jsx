// Import hook quản lý state cục bộ từ React
import { useState } from "react";
// Import hook tối ưu SEO tiêu đề, mô tả
import { useSEO } from "../hooks/useSEO";
// Import hook lấy thông tin tài khoản đăng nhập hiện hành
import { useAuth } from "../context/AuthContext";
// Import hook hiển thị thông báo góc màn hình (Toast)
import { useToast } from "../context/ToastContext";
// Import helper gọi API dùng chung
import { api } from "../services/api";
// Import hook tùy biến để tự động fetch API và quản lý trạng thái load/data
import { useApiFetch } from "../hooks/useApiFetch";
// Import thẻ Link dùng để chuyển trang trong React Router
import { Link } from "react-router-dom";
// Import component hiển thị badge xác minh tài khoản
import { VerifiedBadge } from "../components/VerifiedBadge";

// Hàm nén ảnh phía client trước khi upload lên Cloudinary nhằm tiết kiệm băng thông và tăng tốc độ tải
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1000; // Chiều rộng tối đa cho phép là 1000px
        let width = img.width;
        let height = img.height;

        // Tính toán lại chiều cao theo tỷ lệ tương ứng nếu chiều rộng lớn hơn giới hạn
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Xuất canvas ra đối tượng Blob JPEG chất lượng nén 85%
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

// Component chính hiển thị trang danh sách các công thức nấu ăn hải sản
export function RecipeListPage() {
  // Thiết lập SEO meta title và description cho trang danh sách công thức
  useSEO({
    title: "Bí Quyết Nấu Nướng - Công Thức Hải Sản | Haisan.vn",
    description:
      "Khám phá hàng trăm công thức chế biến hải sản hấp dẫn được chia sẻ trực tiếp từ các ngư dân và đầu bếp bản địa.",
  });

  // Lấy thông tin user đăng nhập hiện tại từ AuthContext
  const { user } = useAuth();
  // Lấy đối tượng hiển thị toast thông báo
  const toast = useToast();

  // Các States quản lý bộ lọc trên giao diện (UI Filters)
  const [search, setSearch] = useState(""); // Lưu trữ giá trị gõ trong ô tìm kiếm
  const [appliedSearch, setAppliedSearch] = useState(""); // Lưu giá trị tìm kiếm đã áp dụng thực tế sau khi nhấn Enter/Submit
  const [difficulty, setDifficulty] = useState(""); // Lưu bộ lọc độ khó (Easy, Medium, Hard)
  const [selectedTag, setSelectedTag] = useState(""); // Lưu bộ lọc theo thẻ tag món ăn (Cá, Tôm, Lẩu...)

  // State quản lý số trang hiện tại của danh sách công thức
  const [currentPage, setCurrentPage] = useState(1);
  // State phiên bản để kích hoạt tải lại danh sách khi đăng công thức mới thành công
  const [version, setVersion] = useState(0);

  // Xây dựng chuỗi API query parameters dựa trên các trạng thái lọc hiện hành
  const queryUrl =
    `/recipes?page=${currentPage}&limit=9` +
    (appliedSearch ? `&search=${encodeURIComponent(appliedSearch)}` : "") +
    (difficulty ? `&difficulty=${difficulty}` : "") +
    (selectedTag ? `&tag=${encodeURIComponent(selectedTag)}` : "");

  // Áp dụng Custom Hook useApiFetch gọi API lấy danh sách công thức, tự động gọi lại khi queryUrl hoặc version thay đổi
  const { data, loading } = useApiFetch(queryUrl, [
    currentPage,
    appliedSearch,
    difficulty,
    selectedTag,
    version,
  ]);

  // Trích xuất danh sách công thức và thông tin phân trang từ kết quả API
  const recipes = data?.recipes || [];
  const page = data?.page || 1;
  const pages = data?.pages || 1;

  // States quản lý việc đóng/mở và xử lý gửi modal đăng công thức nấu ăn mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // States quản lý dữ liệu nhập vào Form chia sẻ công thức nấu ăn mới
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIngredients, setNewIngredients] = useState(""); // Lưu dạng chuỗi, phân tách bằng xuống dòng
  const [newInstructions, setNewInstructions] = useState(""); // Lưu dạng chuỗi, phân tách bằng xuống dòng
  const [newDifficulty, setNewDifficulty] = useState("Medium");
  const [newCookingTime, setNewCookingTime] = useState(30);
  const [newServings, setNewServings] = useState(2);
  const [newTags, setNewTags] = useState(""); // Ngăn cách bởi dấu phẩy
  const [imageFile, setImageFile] = useState(null); // Lưu đối tượng File hình ảnh
  const [imagePreview, setImagePreview] = useState(null); // Lưu link URL xem trước hình ảnh

  // Danh sách thẻ phân loại gợi ý sẵn hiển thị trên thanh bộ lọc
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

  // Xử lý khi người dùng nhấn nút Tìm kiếm công thức
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset số trang về 1 khi bắt đầu tìm kiếm mới
    setAppliedSearch(search); // Áp dụng từ khóa gõ vào state chính để kích hoạt fetch API
  };

  // Xử lý khi người dùng chọn hình ảnh món ăn từ máy tính
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Tạo link xem trước ảnh cục bộ
    }
  };

  // Xử lý gửi biểu mẫu tạo công thức mới lên server
  const handleCreateRecipe = async (e) => {
    e.preventDefault();
    // Kiểm tra tính hợp lệ dữ liệu nhập
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

      // Nếu người dùng có tải ảnh lên, tiến hành lấy chữ ký signature và đăng ảnh lên Cloudinary
      if (imageFile) {
        const sigData = await api("/images/signature");
        // Nén ảnh cục bộ
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

      // Chuẩn bị payload dữ liệu gửi lên API tạo công thức
      const payload = {
        title: newTitle,
        description: newDesc,
        // Phân tách chuỗi nguyên liệu nhập vào theo ký tự xuống dòng
        ingredients: newIngredients.split("\n").filter((i) => i.trim() !== ""),
        // Phân tách chuỗi các bước thực hiện theo ký tự xuống dòng
        instructions: newInstructions
          .split("\n")
          .filter((i) => i.trim() !== ""),
        imageUrl,
        difficulty: newDifficulty,
        cookingTime: Number(newCookingTime),
        servings: Number(newServings),
        // Phân tách chuỗi thẻ tags theo dấu phẩy
        tags: newTags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t !== ""),
      };

      // Gọi API POST tạo công thức nấu ăn
      await api("/recipes", {
        method: "POST",
        body: payload,
      });

      toast.success("Tạo công thức thành công!");
      setShowCreateModal(false); // Đóng modal

      // Thiết lập lại Form về giá trị rỗng mặc định
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

      setCurrentPage(1); // Quay về trang 1 để xem bài viết mới
      setVersion((v) => v + 1); // Kích hoạt reload lại danh sách
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  // Chỉ cho phép tài khoản Admin hoặc tài khoản đã được xác minh (Verified) đăng chia sẻ công thức nấu ăn
  const isVerifiedUser = user && (user.role === "Admin" || user.isVerified);

  return (
    /* Lớp bao bọc ngoài cùng chiếm toàn bộ chiều cao màn hình và căn lề giữa */
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
        {/* Phần đầu giới thiệu trang (Intro Header) và Nút đăng bài */}
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

          {/* Chỉ hiển thị nút Chia sẻ nếu là tài khoản đã xác minh */}
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

        {/* Khối Bộ lọc tìm kiếm */}
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
          {/* Form tìm kiếm văn bản */}
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

          {/* Dòng chọn thẻ tags bộ lọc và độ khó */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            {/* Bộ lọc Thẻ Tag */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {/* Nút reset chọn Tất cả */}
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
              {/* Vòng lặp hiển thị danh sách các tag gợi ý */}
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

            {/* Dropdown lọc Độ khó */}
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

        {/* Hiển thị danh sách kết quả công thức */}
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
          // Hiển thị khi không có kết quả phù hợp bộ lọc
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
            {/* Grid hiển thị lưới danh sách công thức */}
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
                    {/* Phần hiển thị ảnh món ăn và nhãn độ khó đè lên ảnh */}
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
                        // Biểu tượng cá mặc định nếu công thức không có ảnh
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
                      {/* Nhãn độ khó */}
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

                    {/* Phần thân thông tin văn bản */}
                    <div
                      style={{
                        padding: "20px",
                        flex: "1",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
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

                      {/* Footer của thẻ: thông tin thời gian chế biến, khẩu phần và tác giả */}
                      <div
                        style={{
                          borderTop: "1px solid var(--border-l)",
                          paddingTop: "14px",
                          display: "flex",
                          justifyContent: "space-between",
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

            {/* Phân trang dưới lưới công thức */}
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

      {/* Modal tạo/chia sẻ công thức mới */}
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
              overflowY: "auto", // Cho phép cuộn dọc nếu form quá dài
              padding: "36px",
              boxShadow: "var(--shadow-xl)",
              position: "relative",
            }}
          >
            {/* Nút đóng Modal dấu X */}
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
              {/* Tiêu đề món */}
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

              {/* Mô tả ngắn */}
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

              {/* Layout hai cột nhập Nguyên liệu & Các bước */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                {/* Nguyên liệu */}
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
                {/* Các bước */}
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

              {/* Các thông số: Độ khó, Thời gian, Khẩu phần */}
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

              {/* Nhập tags ngăn cách dấu phẩy */}
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

              {/* Upload hình ảnh đính kèm */}
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

              {/* Hai nút Hủy bỏ / Chia sẻ */}
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

