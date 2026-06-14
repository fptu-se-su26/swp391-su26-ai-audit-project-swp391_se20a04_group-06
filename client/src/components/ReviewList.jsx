// Import các hook React để quản lý trạng thái, vòng đời và ghi nhớ hàm tối ưu hiệu suất
import { useState, useEffect, useCallback } from "react";
// Import helper api để gửi yêu cầu API
import { api } from "../services/api";
// Import bảng màu theme C từ thư mục tiện ích utils/theme
import { C } from "../utils/theme";
// Import hook useToast từ ToastContext để hiển thị các thông báo dạng toast trên giao diện
import { useToast } from "../context/ToastContext";

// Định nghĩa và export component ReviewList để quản lý và hiển thị danh sách đánh giá của người bán
export function ReviewList({ sellerId, user, productId, scrollToReviewId }) {
  // Lấy ra hàm hiển thị thông báo toast
  const toast = useToast();
  // Khởi tạo state reviews lưu trữ danh sách các đánh giá của người bán
  const [reviews, setReviews] = useState([]);

  // KHẮC PHỤC 1: Khởi tạo loading dựa trên sự tồn tại của sellerId
  const [loading, setLoading] = useState(!!sellerId);

  // ─── Các state quản lý hộp thoại viết đánh giá mới (Write modal) ───
  // State hiển thị/ẩn modal viết đánh giá
  const [showModal, setShowModal] = useState(false);
  // State lưu số sao đánh giá (mặc định ban đầu là 5 sao)
  const [rating, setRating] = useState(5);
  // State lưu nội dung nhận xét bằng văn bản
  const [comment, setComment] = useState("");
  // State lưu file hình ảnh đính kèm đánh giá
  const [imageFile, setImageFile] = useState(null);
  // State kiểm soát nút bấm khi đang trong tiến trình gửi đánh giá mới lên máy chủ
  const [submitting, setSubmitting] = useState(false);

  // ─── Các state quản lý hộp thoại chỉnh sửa đánh giá (Edit modal) ───
  // Đối tượng đánh giá đang được chọn chỉnh sửa (mặc định null)
  const [editingReview, setEditingReview] = useState(null);
  // Số sao chỉnh sửa
  const [editRating, setEditRating] = useState(5);
  // Văn bản nhận xét chỉnh sửa
  const [editComment, setEditComment] = useState("");
  // File ảnh đính kèm mới chỉnh sửa
  const [editImageFile, setEditImageFile] = useState(null);
  // State kiểm soát nút bấm khi đang gửi yêu cầu cập nhật đánh giá
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ─── Các state quản lý việc xác nhận xóa đánh giá (Delete confirm) ───
  // ID của đánh giá đang chờ xác nhận xóa
  const [deletingId, setDeletingId] = useState(null);
  // State kiểm soát khi đang thực hiện xóa đánh giá trên server
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // KHẮC PHỤC 2: Bọc fetchReviews vào useCallback để giữ tham chiếu ổn định giữa các lần re-render
  const fetchReviews = useCallback(() => {
    // Nếu không có sellerId, không thực thi cuộc gọi API
    if (!sellerId) return;
    // Gọi API lấy danh sách đánh giá của ngư dân/người bán cụ thể
    api(`/reviews/seller/${sellerId}`)
      .then((res) => {
        // Chuẩn hóa dữ liệu trả về từ API lưu vào state reviews tương ứng với các cấu trúc response khác nhau
        if (Array.isArray(res)) setReviews(res);
        else if (res && Array.isArray(res.data)) setReviews(res.data);
        else if (res && Array.isArray(res.reviews)) setReviews(res.reviews);
        // Mặc định gán mảng rỗng nếu không tìm thấy cấu trúc mảng phù hợp
        else setReviews([]);
      })
      // Nếu xảy ra lỗi gán mảng rỗng
      .catch(() => setReviews([]))
      // Tắt trạng thái tải dữ liệu sau khi kết thúc
      .finally(() => setLoading(false));
  }, [sellerId]); // Hàm phụ thuộc vào biến sellerId

  // Hook useEffect tự động chạy fetchReviews khi sellerId hoặc hàm fetchReviews thay đổi
  useEffect(() => {
    if (!sellerId) {
      return;
    }
    fetchReviews();
  }, [sellerId, fetchReviews]);

  // KHẮC PHỤC 3: Loại bỏ hoàn toàn biến reviewsList thừa, sử dụng trực tiếp state 'reviews' để cuộn mượt và highlight đánh giá được chỉ định
  useEffect(() => {
    // Nếu không có ID đánh giá cần cuộn tới, đang tải hoặc danh sách reviews trống thì bỏ qua
    if (!scrollToReviewId || loading || reviews.length === 0) return;
    // Tìm phần tử DOM của đánh giá theo ID
    const el = document.getElementById(`review-${scrollToReviewId}`);
    if (el) {
      // Đặt hẹn giờ nhỏ 100ms để đảm bảo giao diện đã được kết xuất hoàn chỉnh trong DOM
      setTimeout(() => {
        // Cuộn mượt mà đưa đánh giá đó vào chính giữa màn hình
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Áp dụng các thuộc tính style CSS chuyển tiếp highlight màu nền
        el.style.transition = "background 0.3s ease, box-shadow 0.3s ease";
        el.style.background = "#FEF9C3"; // Nền màu vàng nhạt nổi bật
        el.style.boxShadow = "0 0 0 3px #FACC15"; // Viền bóng vàng dày 3px
        el.style.borderRadius = "12px"; // Bo tròn nhẹ viền
        // Sau 3 giây, tự động xóa các màu nền highlight để trả về giao diện bình thường
        setTimeout(() => {
          el.style.background = "";
          el.style.boxShadow = "";
        }, 3000);
      }, 100);
    }
  }, [scrollToReviewId, loading, reviews]); // Effect phụ thuộc vào scrollToReviewId, loading và mảng reviews

  // Gửi thông tin đánh giá mới lên Backend
  const handleSubmit = (e) => {
    // Ngăn chặn sự kiện submit mặc định của form làm tải lại trang
    e.preventDefault();
    // Yêu cầu bắt buộc phải chọn số sao đánh giá
    if (!rating) return;
    // Khóa nút submit bằng cách đặt submitting là true
    setSubmitting(true);
    // Sử dụng đối tượng FormData để cho phép upload file ảnh đính kèm
    const fd = new FormData();
    fd.append("productId", productId); // Truyền ID sản phẩm
    fd.append("sellerId", sellerId); // Truyền ID người bán
    fd.append("rating", rating); // Truyền số sao
    fd.append("comment", comment); // Truyền nội dung nhận xét
    if (imageFile) fd.append("image", imageFile); // Đính kèm file ảnh nếu có

    // Gửi yêu cầu POST lên server
    api("/reviews", { method: "POST", body: fd })
      .then(() => {
        // Hiển thị thông báo thành công
        toast.success("Cảm ơn bạn đã gửi đánh giá thực tế!");
        // Đóng hộp thoại viết đánh giá
        setShowModal(false);
        // Reset sạch các trường nhập liệu
        setComment("");
        setImageFile(null);
        setRating(5);
        // Tải lại danh sách đánh giá mới nhất từ server
        fetchReviews();
      })
      // Đưa thông báo toast nếu gặp lỗi
      .catch((err) => toast.error(err.message))
      // Mở khóa nút bấm submit
      .finally(() => setSubmitting(false));
  };

  // Mở hộp thoại chỉnh sửa đánh giá hiện có
  const openEdit = (r) => {
    setEditingReview(r); // Lưu đối tượng đánh giá cần sửa
    setEditRating(r.Rating); // Gán số sao hiện tại
    setEditComment(r.Comment || ""); // Gán nội dung nhận xét cũ
    setEditImageFile(null); // Reset sạch file ảnh mới
  };

  // Gửi nội dung chỉnh sửa đánh giá lên server
  const handleEditSubmit = (e) => {
    // Ngăn chặn tải lại trang
    e.preventDefault();
    // Yêu cầu có số sao và đối tượng đánh giá
    if (!editRating || !editingReview) return;
    // Khóa nút bấm cập nhật
    setEditSubmitting(true);
    // Sử dụng FormData để gửi kèm ảnh đính kèm mới
    const fd = new FormData();
    fd.append("rating", editRating);
    fd.append("comment", editComment);
    if (editImageFile) fd.append("image", editImageFile);

    // Gửi yêu cầu PUT cập nhật đánh giá
    api(`/reviews/${editingReview.ReviewID}`, { method: "PUT", body: fd })
      .then(() => {
        // Thông báo thành công
        toast.success("Đã cập nhật đánh giá của bạn!");
        // Đóng hộp thoại chỉnh sửa
        setEditingReview(null);
        // Tải lại danh sách đánh giá mới nhất
        fetchReviews();
      })
      // Thông báo lỗi nếu thất bại
      .catch((err) => toast.error(err.message))
      // Mở khóa nút bấm cập nhật
      .finally(() => setEditSubmitting(false));
  };

  // Xác nhận và thực hiện xóa đánh giá
  const handleDeleteConfirm = () => {
    // Nếu không có ID đánh giá cần xóa thì dừng lại
    if (!deletingId) return;
    // Khóa nút bấm xác nhận xóa
    setDeleteSubmitting(true);
    // Gửi yêu cầu DELETE lên server
    api(`/reviews/${deletingId}`, { method: "DELETE" })
      .then(() => {
        // Thông báo thành công
        toast.success("Đã xóa đánh giá.");
        // Đóng hộp thoại xác nhận xóa
        setDeletingId(null);
        // Tải lại danh sách đánh giá mới nhất
        fetchReviews();
      })
      // Thông báo lỗi
      .catch((err) => toast.error(err.message))
      // Mở khóa nút bấm
      .finally(() => setDeleteSubmitting(false));
  };

  // Component phụ Stars để hiển thị số sao đánh giá bằng ký tự sao đặc ★ và sao rỗng ☆
  const Stars = ({ n }) => (
    <span style={{ color: "#F59E0B", fontSize: 14 }}>
      {"★".repeat(n)}
      {"☆".repeat(5 - n)}
    </span>
  );

  return (
    // Div bao bọc chính danh sách đánh giá
    <div
      style={{
        marginTop: 24, // Khoảng cách cách khối phía trên
        padding: 20, // Đệm lề trong
        background: C.white, // Nền màu trắng
        borderRadius: 12, // Bo tròn viền 12px
        border: `1px solid ${C.border}`, // Viền ngoài màu nhẹ mặc định
      }}
    >
      {/* ─── Phần tiêu đề Header và nút viết đánh giá ─── */}
      <div
        style={{
          display: "flex", // Bố cục flex ngang
          justifyContent: "space-between", // Căn đều 2 đầu trái phải
          alignItems: "center", // Căn giữa dọc
          marginBottom: 16,
        }}
      >
        {/* Số lượng đánh giá hiện có */}
        <h3 style={{ margin: 0, fontSize: 16, color: C.dark }}>
          ⭐ Đánh giá người bán ({reviews.length})
        </h3>
        {/* Chỉ hiển thị nút 'Viết đánh giá' nếu người dùng đã đăng nhập và không phải trang của chính họ */}
        {user && user.userId !== sellerId && (
          <button
            onClick={() => setShowModal(true)} // Click mở hộp thoại viết đánh giá
            style={{
              padding: "6px 12px", // Đệm nút
              background: C.coral, // Nền màu đỏ san hô nổi bật
              color: "#fff", // Chữ màu trắng
              border: "none",
              borderRadius: 6, // Bo góc viền nhẹ 6px
              cursor: "pointer", // Con trỏ pointer
              fontWeight: 600, // Chữ in đậm
              fontSize: 13,
            }}
          >
            + Viết đánh giá
          </button>
        )}
      </div>

      {/* ─── Danh sách các dòng đánh giá ─── */}
      {loading ? (
        // Hiển thị nhãn đang tải
        <div style={{ color: C.muted, fontSize: 13 }}>Đang tải đánh giá...</div>
      ) : reviews.length === 0 ? (
        // Thông báo nếu chưa có đánh giá nào
        <div style={{ color: C.muted, fontSize: 13 }}>
          Chưa có đánh giá nào cho người bán này.
        </div>
      ) : (
        // Khung chứa các dòng đánh giá lặp qua mảng reviews
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {reviews.map((r) => {
            // Xác định xem người dùng hiện tại có phải là tác giả của đánh giá này hay không
            const isOwner =
              user && String(user.userId) === String(r.ReviewerID);
            return (
              <div
                key={r.ReviewID} // Khóa React duy nhất
                id={`review-${r.ReviewID}`} // Gán ID để hỗ trợ cuộn và highlight
                style={{
                  paddingBottom: 16, // Đệm đáy dòng
                  borderBottom: `1px solid ${C.border}`, // Đường gạch chia dòng
                }}
              >
                {/* Row: name + date + actions */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 4,
                    gap: 8,
                  }}
                >
                  {/* Tên người đánh giá */}
                  <strong style={{ fontSize: 14 }}>{r.ReviewerName}</strong>
                  {/* Cụm ngày tháng và nút hành động sửa/xóa */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    {/* Ngày tạo đánh giá định dạng nội địa */}
                    <span style={{ fontSize: 12, color: C.muted }}>
                      {new Date(r.CreatedAt).toLocaleDateString("vi")}
                    </span>

                    {/* Chỉ hiển thị cặp nút Sửa / Xóa cho chủ nhân của đánh giá đó */}
                    {isOwner && (
                      <div style={{ display: "flex", gap: 4 }}>
                        {/* Nút sửa */}
                        <button
                          onClick={() => openEdit(r)} // Mở hộp thoại sửa
                          title="Sửa đánh giá"
                          style={actionBtnStyle("#EFF6FF", "#3B82F6")} // Style nền xanh nhạt chữ xanh lam
                        >
                          ✏️
                        </button>
                        {/* Nút xóa */}
                        <button
                          onClick={() => setDeletingId(r.ReviewID)} // Mở hộp thoại xác nhận xóa
                          title="Xóa đánh giá"
                          style={actionBtnStyle("#FFF1F2", "#EF4444")} // Style nền đỏ nhạt chữ đỏ
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Số sao đánh giá */}
                <div style={{ marginBottom: 8 }}>
                  <Stars n={r.Rating} />
                </div>

                {/* Văn bản nội dung nhận xét (nếu có) */}
                {r.Comment && (
                  <p style={{ margin: "0 0 8px", fontSize: 14, color: C.text }}>
                    {r.Comment}
                  </p>
                )}
                {/* Hình ảnh thực tế đính kèm (nếu có) */}
                {r.ImageURL && (
                  <img
                    src={r.ImageURL} // Đường dẫn ảnh thực tế từ Backend
                    alt="review"
                    style={{
                      width: 100, // Chiều rộng 100px
                      height: 100, // Chiều cao 100px
                      objectFit: "cover", // Cắt xén ảnh vừa vặn
                      borderRadius: 8, // Bo tròn viền ảnh 8px
                    }}
                  />
                )}
                {/* Tên sản phẩm được liên kết đánh giá */}
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                  Sản phẩm: {r.ProductName}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Hộp thoại Viết đánh giá mới (ReviewModal) ─── */}
      {showModal && (
        <ReviewModal
          title="Viết đánh giá"
          rating={rating}
          setRating={setRating}
          comment={comment}
          setComment={setComment}
          imageFile={imageFile}
          setImageFile={setImageFile}
          submitting={submitting}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)} // Hủy bỏ
          submitLabel="Gửi đánh giá"
          C={C}
        />
      )}

      {/* ─── Hộp thoại Sửa đánh giá đã có (ReviewModal) ─── */}
      {editingReview && (
        <ReviewModal
          title="Sửa đánh giá"
          rating={editRating}
          setRating={setEditRating}
          comment={editComment}
          setComment={setEditComment}
          imageFile={editImageFile}
          setImageFile={setEditImageFile}
          existingImageURL={editingReview.ImageURL} // Đường dẫn ảnh cũ có sẵn để hiển thị xem trước
          submitting={editSubmitting}
          onSubmit={handleEditSubmit}
          onClose={() => setEditingReview(null)} // Hủy bỏ
          submitLabel="Lưu thay đổi"
          C={C}
        />
      )}

      {/* ─── Hộp thoại Xác nhận xóa đánh giá (Delete confirm dialog) ─── */}
      {deletingId && (
        <div style={overlayStyle}>
          {/* Khung nội dung hộp thoại nhỏ căn giữa */}
          <div
            style={{
              background: "#fff", // Nền trắng
              padding: 24, // Đệm lề trong
              borderRadius: 12, // Bo tròn viền 12px
              width: "100%", // Chiều rộng tối đa tự động co giãn
              maxWidth: 360, // Chiều rộng tối đa 360px
              textAlign: "center", // Căn chữ giữa
            }}
          >
            {/* Icon thùng rác lớn */}
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            {/* Tiêu đề cảnh báo */}
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Xóa đánh giá?</h3>
            {/* Lời nhắn nhủ */}
            <p style={{ margin: "0 0 20px", fontSize: 14, color: C.muted }}>
              Hành động này không thể hoàn tác. Đánh giá của bạn sẽ bị xóa vĩnh
              viễn.
            </p>
            {/* Khối cặp nút bấm Hủy / Xóa */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {/* Nút hủy bỏ */}
              <button
                onClick={() => setDeletingId(null)} // Click đóng hộp thoại
                disabled={deleteSubmitting} // Khóa khi đang xóa
                style={{
                  padding: "8px 20px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  background: "#f1f1f1",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Hủy
              </button>
              {/* Nút bấm xác nhận xóa thực sự */}
              <button
                onClick={handleDeleteConfirm} // Thực hiện xóa
                disabled={deleteSubmitting} // Khóa khi đang gửi API
                style={{
                  padding: "8px 20px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  background: "#EF4444", // Nền màu đỏ nổi bật cảnh báo
                  color: "#fff", // Chữ trắng
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {deleteSubmitting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Component phụ ReviewModal tái sử dụng chung cho Soạn và Chỉnh sửa đánh giá ───
function ReviewModal({
  title, // Tiêu đề modal
  rating, // Số sao hiện tại
  setRating, // Setter cập nhật sao
  comment, // Nhận xét văn bản
  setComment, // Setter cập nhật nhận xét
  imageFile, // File ảnh đính kèm mới
  setImageFile, // Setter cập nhật file ảnh
  existingImageURL, // Đường dẫn ảnh cũ có sẵn
  submitting, // Trạng thái đang tải gửi dữ liệu
  onSubmit, // Callback submit form
  onClose, // Callback đóng modal
  submitLabel, // Tên nút submit
  C, // Đối tượng theme màu
}) {
  return (
    // Lớp phủ tối mờ nền sau modal phủ toàn màn hình
    <div style={overlayStyle}>
      {/* Khung form modal chính */}
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          width: "100%",
          maxWidth: 400, // Chiều rộng tối đa 400px
        }}
      >
        {/* Tiêu đề */}
        <h3 style={{ margin: "0 0 16px" }}>{title}</h3>
        {/* Form nhập liệu */}
        <form onSubmit={onSubmit}>
          {/* Mục chọn Số sao đánh giá */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Số sao</label>
            {/* Bộ chọn sao động lặp qua 5 ngôi sao */}
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button" // Bắt buộc khai báo type button để tránh submit form
                  onClick={() => setRating(n)} // Click chọn số sao tương ứng
                  style={{
                    fontSize: 24,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    // Màu sắc: sao được chọn thì màu vàng cam, chưa chọn thì màu xám nhạt
                    color: n <= rating ? "#F59E0B" : "#D1D5DB",
                    transition: "color 0.15s, transform 0.1s",
                    // Phóng to nhẹ sao đang chọn để tạo cảm giác tương tác sống động
                    transform: n <= rating ? "scale(1.15)" : "scale(1)",
                  }}
                >
                  ★
                </button>
              ))}
              {/* Nhãn mô tả cảm xúc tương ứng số sao đã chọn */}
              <span
                style={{
                  fontSize: 13,
                  color: "#6B7280",
                  marginLeft: 4,
                  alignSelf: "center",
                }}
              >
                {
                  ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời"][
                    rating
                  ]
                }
              </span>
            </div>
          </div>

          {/* Mục nhập Nhận xét văn bản */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Nhận xét</label>
            <textarea
              value={comment} // Liên kết state
              onChange={(e) => setComment(e.target.value)} // Cập nhật văn bản nhận xét
              placeholder="Hải sản có tươi không? Đóng gói thế nào?"
              rows={3}
              style={{
                width: "100%", // Chiều rộng 100%
                padding: 8, // Đệm trong
                borderRadius: 6, // Bo góc 6px
                border: `1px solid ${C.border}`, // Viền xám mỏng mặc định
                fontFamily: "inherit",
                boxSizing: "border-box",
                fontSize: 13, // Cỡ chữ 13px
                marginTop: 4,
                resize: "vertical", // Chỉ cho co giãn dọc
              }}
            />
          </div>

          {/* Mục chọn ảnh đính kèm sản phẩm */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Ảnh đánh giá (Tùy chọn)</label>
            {/* Ô chọn file hình ảnh */}
            <input
              type="file"
              accept="image/*" // Chỉ chấp nhận các file ảnh
              // Bắt sự kiện chọn file: lưu file đầu tiên được chọn, ngược lại gán null
              onChange={(e) => setImageFile(e.target.files[0] || null)}
              style={{ fontSize: 13, marginTop: 4, display: "block" }}
            />
            {/* Khung hiển thị xem trước ảnh mới chọn từ máy tính nội bộ */}
            {imageFile && (
              <img
                src={URL.createObjectURL(imageFile)} // Sinh ra URL tạm thời từ blob file local để hiển thị xem trước
                alt="preview"
                style={{
                  width: 80,
                  height: 80,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  marginTop: 8,
                }}
              />
            )}
            {/* Khung hiển thị ảnh cũ có sẵn trên server nếu người dùng chưa chọn ảnh mới thay thế */}
            {!imageFile && existingImageURL && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={existingImageURL}
                  alt="existing"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 6,
                    border: `1px solid ${C.border}`,
                  }}
                />
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                  Ảnh hiện tại
                </div>
              </div>
            )}
          </div>

          {/* Nhóm các nút gác Hủy / Gửi ở chân modal */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            {/* Nút hủy bỏ */}
            <button
              type="button" // Tránh submit form
              onClick={onClose} // Sự kiện đóng modal
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: "#f1f1f1",
                fontSize: 13,
              }}
            >
              Hủy
            </button>
            {/* Nút gửi hoặc cập nhật thay đổi */}
            <button
              type="submit" // Submit form gửi dữ liệu
              disabled={submitting} // Khóa nút bấm khi đang lưu
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: C.ocean, // Màu xanh ocean chủ đạo
                color: "#fff", // Chữ trắng
                fontWeight: 600, // Chữ in đậm
                fontSize: 13,
                opacity: submitting ? 0.7 : 1, // Làm mờ nhẹ khi disabled
              }}
            >
              {submitting ? "Đang lưu..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Style inline tiện ích dùng chung ───
// Style lớp phủ đen mờ nền sau modal phủ kín toàn màn hình
const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)", // Nền đen mờ 50%
  display: "flex",
  alignItems: "center", // Căn giữa dọc
  justifyContent: "center", // Căn giữa ngang
  zIndex: 9999, // Đè lên trên mọi lớp
  padding: 16,
};

// Style cho nhãn tiêu đề trường nhập liệu
const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
};

// KHẮC PHỤC 4: Bổ sung thuộc tính color vào chữ ký hàm actionBtnStyle để hiển thị đúng màu chữ cho các nút hành động nhỏ (✏️, 🗑️)
const actionBtnStyle = (bg, color) => ({
  padding: "3px 7px", // Đệm trong nhỏ gọn
  borderRadius: 5, // Bo tròn viền nhẹ 5px
  border: "none",
  cursor: "pointer", // Con trỏ chuột dạng bàn tay khi hover
  background: bg, // Màu nền
  color: color, // Bổ sung màu sắc chữ/biểu tượng
  fontSize: 13, // Cỡ chữ 13px
  lineHeight: 1, // Chiều cao dòng bằng 1
  display: "flex", // Bố cục flex
  alignItems: "center", // Căn giữa dọc
  transition: "opacity 0.15s", // Hiệu ứng mờ nhẹ
});
