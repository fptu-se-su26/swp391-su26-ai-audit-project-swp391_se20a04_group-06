// Import hook useState từ React để quản lý state cục bộ
import { useState } from "react";
// Import hook tối ưu SEO tiêu đề, mô tả
import { useSEO } from "../hooks/useSEO";
// Import hook lấy thông tin tài khoản đăng nhập hiện hành
import { useAuth } from "../context/AuthContext";
// Import hook hiển thị thông báo popup (Toast)
import { useToast } from "../context/ToastContext";
// Import helper gọi API dùng chung
import { api } from "../services/api";
// Import hook tùy biến để tự động fetch API và theo dõi trạng thái tải
import { useApiFetch } from "../hooks/useApiFetch";
// Import định nghĩa bảng màu theme của dự án
import { C } from "../utils/theme";

// Hàm nén ảnh phía client trước khi upload lên Cloudinary nhằm giảm băng thông và dung lượng lưu trữ
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    // Đọc file dưới dạng Data URL (Base64)
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1000; // Giới hạn chiều rộng tối đa là 1000px
        let width = img.width;
        let height = img.height;

        // Tính toán tỷ lệ chiều cao tương ứng nếu chiều rộng vượt quá giới hạn
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        // Vẽ ảnh gốc lên canvas với kích thước mới đã thu nhỏ
        ctx.drawImage(img, 0, 0, width, height);

        // Xuất canvas thành đối tượng Blob định dạng JPEG với chất lượng nén 85%
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

/* Hộp thoại xác nhận tùy chỉnh dạng Modal hiển thị xác nhận trước khi thực hiện hành động xóa */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)", // Lớp nền tối mờ
        zIndex: 99999, // Đảm bảo đè lên trên mọi phần tử khác
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.15s ease",
      }}
      onClick={onCancel} // Bấm ra ngoài vùng modal để đóng modal
    >
      <div
        onClick={(e) => e.stopPropagation()} // Ngăn sự kiện nổi bọt làm đóng modal
        style={{
          background: C.white,
          borderRadius: 16,
          padding: "24px 28px",
          maxWidth: 380,
          width: "90%",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>🗑️</div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: C.dark,
            marginBottom: 20,
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {/* Nút Hủy bỏ */}
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.white,
              color: C.muted,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
            }}
          >
            Hủy
          </button>
          {/* Nút Đồng ý */}
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              border: "none",
              background: "#EF4444",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
            }}
          >
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
}

// Component chính hiển thị Diễn đàn cộng đồng
export function CommunityPage() {
  // Thiết lập SEO tiêu đề và mô tả cho trang Diễn đàn
  useSEO({
    title: "Diễn Đàn Cộng Đồng - Chia Sẻ Mâm Cơm Hải Sản | Haisan.vn",
    description:
      "Nơi giao lưu, chia sẻ những khoảnh khắc nấu nướng, mâm cơm gia đình ấm cúng và phản hồi về sản phẩm từ biển khơi.",
  });

  // Lấy thông tin user đăng nhập hiện tại từ context Auth
  const { user } = useAuth();
  // Khởi tạo hàm toast thông báo
  const toast = useToast();

  // State quản lý số trang hiện tại của danh sách bài viết
  const [page, setPage] = useState(1);
  // State phiên bản (version) để kích hoạt tải lại dữ liệu khi có bài viết mới được đăng
  const [version, setVersion] = useState(0);

  // Áp dụng Custom Hook useApiFetch gọi API lấy danh sách bài đăng theo trang hiện tại và version
  const { data, loading, refetch } = useApiFetch(
    `/posts?page=${page}&limit=10`,
    [page, version],
  );

  // Trích xuất mảng bài viết và tổng số trang từ kết quả API trả về
  const posts = data?.posts || [];
  const pages = data?.pages || 1;

  // States quản lý Form đăng bài viết mới
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [imageFiles, setImageFiles] = useState([]); // Mảng lưu các đối tượng File ảnh thực tế
  const [imagePreviews, setImagePreviews] = useState([]); // Mảng lưu link URL.createObjectURL để xem trước ảnh
  const [submittingPost, setSubmittingPost] = useState(false); // Trạng thái đang gửi bài viết

  // State lưu trữ văn bản bình luận đang gõ cho từng bài viết, tổ chức dưới dạng { [postId]: commentText }
  const [commentInputs, setCommentInputs] = useState({});

  // Trạng thái cho modal xác nhận xóa bài viết hoặc xóa bình luận
  const [confirmDelete, setConfirmDelete] = useState(null); // Đối tượng dạng { type: 'post' | 'comment', postId, commentId }

  // Xử lý khi người dùng chọn tải ảnh lên từ máy tính
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    // Giới hạn tối đa được đăng 4 ảnh cho mỗi bài viết
    if (files.length + imageFiles.length > 4) {
      toast.warn("Bạn chỉ được tải lên tối đa 4 hình ảnh");
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    // Tạo các đường dẫn blob xem trước cục bộ cho các ảnh vừa chọn
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  // Xóa ảnh đã chọn xem trước ra khỏi danh sách chuẩn bị đăng
  const removeSelectedImage = (idx) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== idx);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== idx);
    setImageFiles(updatedFiles);
    setImagePreviews(updatedPreviews);
  };

  // Xử lý hành động gửi đăng bài viết mới lên server
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.warn("Vui lòng nhập tiêu đề và nội dung bài viết");
      return;
    }

    setSubmittingPost(true);
    try {
      let uploadedImageUrls = [];

      // Nếu có hình ảnh đính kèm, thực hiện nén và tải lên Cloudinary
      if (imageFiles.length > 0) {
        // Lấy thông tin chữ ký signature từ backend để cấp quyền upload an toàn lên Cloudinary
        const sigData = await api("/images/signature");

        uploadedImageUrls = await Promise.all(
          imageFiles.map(async (file) => {
            // Nén ảnh client-side
            const compressed = await compressImage(file);
            const fd = new FormData();
            fd.append("file", compressed);
            fd.append("api_key", sigData.apiKey);
            fd.append("timestamp", sigData.timestamp);
            fd.append("signature", sigData.signature);
            fd.append("folder", sigData.folder);

            // Gửi ảnh lên Cloudinary
            const cloudRes = await fetch(
              `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
              { method: "POST", body: fd },
            );

            if (!cloudRes.ok) {
              throw new Error("Không thể tải ảnh lên CDN");
            }

            const cloudData = await cloudRes.json();
            return cloudData.secure_url; // Trả về link ảnh HTTPS an toàn
          }),
        );
      }

      // Gửi bài đăng mới lên backend kèm mảng link ảnh đã upload
      await api("/posts", {
        method: "POST",
        body: {
          title: newTitle,
          content: newContent,
          images: uploadedImageUrls,
          tags: ["Cộng Đồng"],
        },
      });

      toast.success("Đăng bài viết thành công!");
      // Reset lại toàn bộ form đăng bài
      setNewTitle("");
      setNewContent("");
      setImageFiles([]);
      setImagePreviews([]);
      // Tăng version để trigger hook fetch bài viết tải lại danh sách mới
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmittingPost(false);
    }
  };

  // Xử lý thích/bỏ thích bài viết
  const handleLikePost = async (postId) => {
    if (!user) {
      toast.warn("Vui lòng đăng nhập để thích bài viết");
      return;
    }

    try {
      await api(`/posts/${postId}/like`, { method: "POST" });
      refetch(); // Tải lại dữ liệu bài viết để cập nhật số lượt thích và trạng thái
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    }
  };

  // Xử lý gửi bình luận cho một bài viết
  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    if (!user) {
      toast.warn("Vui lòng đăng nhập để bình luận");
      return;
    }

    const text = commentInputs[postId] || "";
    if (!text.trim()) return;

    try {
      // Gọi API POST gửi bình luận mới
      await api(`/posts/${postId}/comments`, {
        method: "POST",
        body: { text },
      });

      // Reset lại ô nhập bình luận của bài đăng này về rỗng
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      refetch(); // Tải lại bài đăng để hiển thị bình luận mới
    } catch (err) {
      toast.error(err.message || "Không thể gửi bình luận");
    }
  };

  // Cập nhật state nội dung bình luận khi người dùng đang gõ phím
  const handleCommentInputChange = (postId, text) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  // Thực hiện hành động xóa bài viết hoặc xóa bình luận sau khi người dùng xác nhận "Đồng ý" trên Modal
  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { type, postId, commentId } = confirmDelete;
    try {
      if (type === "post") {
        // Gọi API DELETE xóa bài viết
        await api(`/posts/${postId}`, { method: "DELETE" });
        toast.success("Xóa bài viết thành công");
      } else if (type === "comment") {
        // Gọi API DELETE xóa bình luận cụ thể của bài viết
        await api(`/posts/${postId}/comments/${commentId}`, {
          method: "DELETE",
        });
        toast.success("Đã xóa bình luận");
      }
      refetch(); // Tải lại danh sách
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setConfirmDelete(null); // Đóng hộp thoại xác nhận xóa
    }
  };

  return (
    <div className="page-wrap-sm fade-up">
      {/* Hiển thị modal xác nhận xóa nếu confirmDelete có giá trị */}
      {confirmDelete && (
        <ConfirmDialog
          message={
            confirmDelete.type === "post"
              ? "Bạn có chắc muốn xóa bài viết này không?"
              : "Bạn có chắc muốn xóa bình luận này?"
          }
          onConfirm={executeDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Tiêu đề trang */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <h1
          style={{
            fontSize: "2.2rem",
            fontWeight: "900",
            color: "var(--dark)",
            marginBottom: "12px",
          }}
        >
          Diễn Đàn Cộng Đồng
        </h1>
      </div>

      {/* Biểu mẫu đăng bài viết mới: Chỉ hiển thị nếu người dùng đã đăng nhập */}
      {user ? (
        <div
          style={{
            background: "var(--white)",
            borderRadius: "var(--radius-xl)",
            padding: "24px",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
            marginBottom: "40px",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "800",
              color: "var(--dark)",
              marginBottom: "16px",
            }}
          >
            Đăng bài viết mới
          </h3>
          <form
            onSubmit={handleCreatePost}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {/* Ô nhập tiêu đề */}
            <input
              type="text"
              placeholder="Tiêu đề bài viết..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                fontSize: "14px",
                outline: "none",
              }}
              required
            />
            {/* Ô nhập nội dung bài viết */}
            <textarea
              rows="3"
              placeholder="Chia sẻ cảm nhận nấu nướng của bạn tại đây..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                fontSize: "14px",
                outline: "none",
                resize: "vertical",
              }}
              required
            />

            {/* Xem trước danh sách các ảnh đã chọn */}
            {imagePreviews.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "4px",
                }}
              >
                {imagePreviews.map((preview, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: "relative",
                      width: "80px",
                      height: "80px",
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={preview}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    {/* Nút hủy bỏ ảnh này */}
                    <button
                      type="button"
                      onClick={() => removeSelectedImage(idx)}
                      style={{
                        position: "absolute",
                        top: "2px",
                        right: "2px",
                        background: "rgba(0,0,0,0.6)",
                        color: "var(--white)",
                        border: "none",
                        borderRadius: "50%",
                        width: "18px",
                        height: "18px",
                        fontSize: "11px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "6px",
              }}
            >
              {/* Nút chọn hình ảnh ẩn đằng sau nhãn nhấp chuột */}
              <label
                style={{
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "var(--ocean)",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                📷 Thêm hình ảnh
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </label>

              {/* Nút đăng bài */}
              <button
                type="submit"
                disabled={submittingPost}
                style={{
                  background: "var(--coral)",
                  color: "var(--white)",
                  border: "none",
                  borderRadius: "99px",
                  padding: "8px 24px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(232, 100, 58, 0.25)",
                }}
              >
                {submittingPost ? "Đang đăng..." : "Đăng bài"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Banner thông báo nếu người dùng chưa đăng nhập
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            background: "var(--ocean-p)",
            borderRadius: "var(--radius-lg)",
            color: "var(--ocean-d)",
            fontSize: "14px",
            fontWeight: "600",
            marginBottom: "40px",
          }}
        >
          💡 Vui lòng đăng nhập để viết bài viết và thảo luận cùng mọi người.
        </div>
      )}

      {/* Hiển thị danh sách các bài đăng */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--muted)",
          }}
        >
          Đang tải bài viết...
        </div>
      ) : posts.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--muted)",
            background: "var(--white)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-l)",
          }}
        >
          Chưa có bài viết nào trên cộng đồng.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {posts.map((post) => {
            // Kiểm tra xem người dùng hiện tại đã thích bài viết này hay chưa
            const hasLiked =
              user && post.likes.includes(user.userId || user.id);
            // Kiểm tra quyền xóa (phải là tác giả bài viết hoặc tài khoản Admin)
            const isPostAuthor =
              user &&
              (user.role === "Admin" ||
                post.userId === user.userId ||
                post.userId === user.id);

            return (
              <div
                key={post._id}
                style={{
                  background: "var(--white)",
                  borderRadius: "var(--radius-xl)",
                  padding: "28px",
                  border: "1px solid var(--border-l)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {/* Header của thẻ bài viết: thông tin tác giả và nút xóa bài */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {/* Avatar đại diện bằng ký tự đầu tiên */}
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "var(--bg-2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        color: "var(--ocean)",
                        fontSize: "16px",
                      }}
                    >
                      {post.userName
                        ? post.userName.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                    <div>
                      <strong
                        style={{
                          fontSize: "14px",
                          color: "var(--dark)",
                          display: "block",
                        }}
                      >
                        {post.userName || "Thành viên"}
                      </strong>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}{" "}
                        lúc{" "}
                        {new Date(post.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Nút xóa bài viết chỉ dành cho tác giả bài viết hoặc Admin */}
                  {isPostAuthor && (
                    <button
                      onClick={() =>
                        setConfirmDelete({ type: "post", postId: post._id })
                      }
                      style={{
                        background: "none",
                        border: "none",
                        color: "#e74c3c",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Xóa bài
                    </button>
                  )}
                </div>

                {/* Tiêu đề bài viết */}
                <h4
                  style={{
                    fontSize: "16px",
                    fontWeight: "800",
                    color: "var(--dark)",
                    marginBottom: "8px",
                  }}
                >
                  {post.title}
                </h4>
                {/* Nội dung bài viết */}
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--text-2)",
                    lineHeight: "1.6",
                    whiteSpace: "pre-line",
                    marginBottom: "16px",
                  }}
                >
                  {post.content}
                </p>

                {/* Hiển thị danh sách hình ảnh đính kèm bài đăng dạng lưới */}
                {post.images && post.images.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      // Nếu có 1 ảnh thì chiếm toàn bộ chiều rộng, ngược lại chia đôi cột
                      gridTemplateColumns:
                        post.images.length === 1 ? "1fr" : "repeat(2, 1fr)",
                      gap: "8px",
                      borderRadius: "var(--radius-lg)",
                      overflow: "hidden",
                      marginBottom: "16px",
                    }}
                  >
                    {post.images.map((imgUrl, i) => (
                      <img
                        key={i}
                        src={imgUrl}
                        alt="Attached"
                        style={{
                          width: "100%",
                          height: post.images.length === 1 ? "auto" : "180px",
                          objectFit: "cover",
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Các nút tương tác: Thích, số lượt Xem, số lượt bình luận */}
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                    borderTop: "1px solid var(--border-l)",
                    borderBottom: "1px solid var(--border-l)",
                    padding: "10px 0",
                    marginBottom: "16px",
                  }}
                >
                  {/* Nút thích bài viết */}
                  <button
                    onClick={() => handleLikePost(post._id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: hasLiked ? "var(--coral)" : "var(--text-2)",
                      fontWeight: "700",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    ❤️ Thích ({post.likes?.length || 0})
                  </button>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--muted)",
                      fontWeight: "600",
                    }}
                  >
                    💬 Bình luận ({post.comments?.length || 0})
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--muted)",
                      marginLeft: "auto",
                    }}
                  >
                    👁️ {post.viewCount || 0} lượt xem
                  </span>
                </div>

                {/* Danh sách bình luận */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    background: "var(--bg)",
                    borderRadius: "var(--radius-lg)",
                    padding: "16px",
                  }}
                >
                  {post.comments && post.comments.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        marginBottom: "10px",
                      }}
                    >
                      {post.comments.map((comment) => {
                        // Xác định xem user hiện tại có quyền xóa bình luận hay không (admin hoặc tác giả bình luận hoặc chủ bài viết)
                        const isCommentAuthor =
                          user &&
                          (user.role === "Admin" ||
                            comment.userId === user.userId ||
                            comment.userId === user.id ||
                            post.userId === user.userId ||
                            post.userId === user.id);
                        return (
                          <div
                            key={comment._id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              fontSize: "13px",
                            }}
                          >
                            <div>
                              <strong style={{ color: "var(--dark)" }}>
                                {comment.userName}:
                              </strong>
                              <span
                                style={{
                                  color: "var(--text-2)",
                                  marginLeft: "6px",
                                }}
                               >
                                {comment.text}
                              </span>
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "11px",
                                  color: "var(--muted)",
                                  marginTop: "2px",
                                }}
                              >
                                {new Date(comment.createdAt).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </span>
                            </div>
                            {/* Nút xóa bình luận (hiển thị dấu x) */}
                            {isCommentAuthor && (
                              <button
                                onClick={() =>
                                  setConfirmDelete({
                                    type: "comment",
                                    postId: post._id,
                                    commentId: comment._id,
                                  })
                                }
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--muted)",
                                  fontSize: "10px",
                                  cursor: "pointer",
                                }}
                              >
                                &times; Xóa
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Ô nhập gửi bình luận mới - chỉ hiển thị nếu người dùng đã đăng nhập */}
                  {user && (
                    <form
                      onSubmit={(e) => handleAddComment(e, post._id)}
                      style={{ display: "flex", gap: "8px" }}
                    >
                      <input
                        type="text"
                        placeholder="Viết bình luận..."
                        value={commentInputs[post._id] || ""}
                        onChange={(e) =>
                          handleCommentInputChange(post._id, e.target.value)
                        }
                        style={{
                          flex: "1",
                          padding: "8px 12px",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border)",
                          fontSize: "13px",
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
                          padding: "8px 16px",
                          fontWeight: "700",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Gửi
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Thanh phân trang ở đáy màn hình */}
      {pages > 1 && (
        <div
          style={{
            display: "flex",
            justify: "center",
            gap: "8px",
            marginTop: "24px",
          }}
        >
          {/* Nút quay lại trang trước */}
          <button
            disabled={page === 1}
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
            }}
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
          {/* Số trang hiện tại */}
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
          {/* Nút sang trang tiếp theo */}
          <button
            disabled={page === pages}
            onClick={() => {
              setPage((p) => Math.min(pages, p + 1));
            }}
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
    </div>
  );
}

