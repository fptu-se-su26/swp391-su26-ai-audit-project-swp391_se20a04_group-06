// Nhập hook useState từ thư viện React để quản lý các trạng thái cục bộ
import { useState } from "react";
// Nhập cấu hình màu sắc CSS theme chung
import { C } from "../../utils/theme";
// Nhập custom hook useApiFetch để tự động gọi API và theo dõi trạng thái loading
import { useApiFetch } from "../../hooks/useApiFetch";
// Nhập hàm api chung phục vụ các hành động gửi yêu cầu lên server
import { api } from "../../services/api";
// Nhập hook useAuth để lấy thông tin tài khoản người dùng hiện tại
import { useAuth } from "../../context/AuthContext";
// Nhập hook useToast để hiển thị thông báo
import { useToast } from "../../context/ToastContext";

// Component tab hiển thị danh sách bài đăng diễn đàn của ngư dân
export function FishermanPostsTab({ sellerId }) {
  // Lấy thông tin user hiện tại từ context xác thực
  const { user } = useAuth();
  // Lấy hàm thông báo toast
  const toast = useToast();
  // Gọi API lấy tối đa 10 bài đăng cộng đồng của ngư dân dựa trên sellerId
  const { data, loading } = useApiFetch(
    `/fishermen/${sellerId}/posts?limit=10`,
    [sellerId],
  );
  // State lưu bài viết đang được click chọn để hiển thị popup modal xem đầy đủ nội dung
  const [activePost, setActivePost] = useState(null);
  // State lưu ID của bài viết đang được xử lý gửi yêu cầu thích (để vô hiệu hóa click liên tục)
  const [likingId, setLikingId] = useState(null);

  // Lấy danh sách bài viết từ kết quả trả về của API
  const posts = data?.data ?? data?.posts ?? [];

  // Hàm xử lý thích/bỏ thích bài viết
  const handleLike = async (postId, e) => {
    // Ngăn chặn nổi bọt sự kiện click ra thẻ bao ngoài (mở modal)
    e.stopPropagation();
    // Yêu cầu đăng nhập nếu chưa có session hoạt động
    if (!user) {
      toast.warn("Vui lòng đăng nhập để thích bài viết");
      return;
    }
    // Đánh dấu ID bài viết đang được click thích
    setLikingId(postId);
    try {
      // Gọi API POST thích bài viết
      await api(`/posts/${postId}/like`, { method: "POST" });
    } catch {
      /* Bỏ qua lỗi mạng */
    } finally {
      // Giải phóng trạng thái đang thích
      setLikingId(null);
    }
  };

  // Nếu dữ liệu đang tải, hiển thị 3 thẻ khung xương skeleton nhấp nháy
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{ height: 120, borderRadius: 12 }}
          />
        ))}
      </div>
    );
  }

  // Nếu ngư dân chưa đăng bài viết nào, hiển thị màn hình báo trống
  if (posts.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          background: C.white,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
        }}
      >
        {/* Biểu tượng bong bóng trò chuyện */}
        <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
        {/* Nhãn báo trống */}
        <div style={{ fontWeight: 700, color: C.dark }}>
          Chưa có bài đăng cộng đồng
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Khối chứa danh sách các thẻ bài viết */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {posts.map((post) => (
          <div
            key={post._id}
            // Click vào thẻ bài viết để mở popup xem đầy đủ nội dung chi tiết
            onClick={() => setActivePost(post)}
            style={{
              background: C.white,
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              padding: "18px 20px",
              cursor: "pointer",
              // Hiệu ứng đổi bóng đổ mượt mà khi hover chuột
              transition: "box-shadow 0.2s",
            }}
            // Hover chuột: hiện bóng đổ nổi
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)")
            }
            // Rời chuột: phục hồi trạng thái cũ
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
          >
            {/* Tiêu đề bài đăng */}
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: C.dark,
                marginBottom: 6,
              }}
            >
              {post.title}
            </div>
            {/* Đoạn mô tả ngắn trích dẫn nội dung bài viết (giới hạn 2 dòng hiển thị) */}
            <div
              style={{
                fontSize: 13,
                color: C.muted,
                display: "-webkit-box",
                WebkitLineClamp: 2, // Giới hạn 2 dòng
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                marginBottom: 10,
                lineHeight: 1.55,
              }}
            >
              {post.content}
            </div>

            {/* Danh sách ảnh đính kèm xem trước (hiển thị tối đa 4 hình ảnh) */}
            {post.images?.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginBottom: 10,
                  flexWrap: "wrap", // Cho phép tự động xuống hàng nếu nhiều ảnh
                }}
              >
                {post.images.slice(0, 4).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: "cover", // Giữ ảnh vuông cân đối
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Thanh thông tin tương tác phụ ở đáy bài viết (thả tim, bình luận, lượt xem, ngày đăng) */}
            <div
              style={{
                display: "flex",
                gap: 16,
                fontSize: 12,
                color: C.muted,
                alignItems: "center",
              }}
            >
              {/* Nút thích bài viết */}
              <button
                onClick={(e) => handleLike(post._id, e)}
                // Vô hiệu hóa nút khi đang gửi yêu cầu mạng để tránh spam
                disabled={likingId === post._id}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                ❤️ {post.likes?.length ?? 0}
              </button>
              {/* Số lượng bình luận */}
              <span>💬 {post.comments?.length ?? 0}</span>
              {/* Số lượt xem */}
              <span>👁️ {post.viewCount ?? 0}</span>
              {/* Định dạng ngày tháng năm viết bài đăng */}
              <span style={{ marginLeft: "auto" }}>
                {new Date(post.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Popup modal hiển thị chi tiết đầy đủ nội dung bài đăng cộng đồng */}
      {activePost && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)", // Nền tối mờ 60%
            zIndex: 9999, // Nổi lên trên cùng
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          // Click vùng nền tối bên ngoài sẽ tự động đóng popup
          onClick={() => setActivePost(null)}
        >
          <div
            // Chặn sự kiện click bên trong thân hộp thoại nội dung
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.white,
              borderRadius: 20,
              padding: 28,
              maxWidth: 520, // Chiều rộng tối đa 520px
              width: "100%",
              maxHeight: "90vh", // Chiều cao tối đa 90% màn hình
              overflowY: "auto", // Cho phép cuộn dọc
              boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
              position: "relative",
            }}
          >
            {/* Nút đóng hình chữ X ở góc trên bên phải popup */}
            <button
              onClick={() => setActivePost(null)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 22,
                cursor: "pointer",
                color: C.muted,
              }}
            >
              ×
            </button>
            {/* Tiêu đề bài viết đầy đủ */}
            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: C.dark,
                marginBottom: 12,
                marginTop: 0,
              }}
            >
              {activePost.title}
            </h3>
            {/* Nội dung bài viết đầy đủ, giữ định dạng xuống hàng thô */}
            <p
              style={{
                fontSize: 14,
                color: "#475569",
                lineHeight: 1.7,
                whiteSpace: "pre-line", // Giữ định dạng xuống dòng của nội dung
                marginBottom: 16,
              }}
            >
              {activePost.content}
            </p>
            {/* Hiển thị danh sách tất cả các hình ảnh đính kèm lớn */}
            {activePost.images?.length > 0 && (
              <div
                style={{
                  display: "grid",
                  // Chia làm 1 cột nếu chỉ có 1 ảnh, chia làm 2 cột đối xứng nếu từ 2 ảnh trở lên
                  gridTemplateColumns:
                    activePost.images.length === 1 ? "1fr" : "repeat(2, 1fr)",
                  gap: 8,
                  borderRadius: 12,
                  overflow: "hidden", // Bo góc các hình ảnh bên trong
                  marginBottom: 16,
                }}
              >
                {activePost.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    style={{
                      width: "100%",
                      // Ảnh đơn giữ nguyên tỷ lệ, nhiều ảnh cố định chiều cao 160px
                      height: activePost.images.length === 1 ? "auto" : 160,
                      objectFit: "cover",
                    }}
                  />
                ))}
              </div>
            )}
            {/* Footer thông tin tương tác ở chân popup */}
            <div
              style={{
                fontSize: 12,
                color: C.muted,
                borderTop: `1px solid ${C.border}`, // Đường viền ngăn cách mảnh
                paddingTop: 12,
              }}
            >
              ❤️ {activePost.likes?.length ?? 0} thích · 💬{" "}
              {activePost.comments?.length ?? 0} bình luận ·{" "}
              {new Date(activePost.createdAt).toLocaleString("vi-VN")}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
