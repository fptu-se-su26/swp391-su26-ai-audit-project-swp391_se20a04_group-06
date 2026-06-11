import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { C } from "../utils/theme";
import { useToast } from "../context/ToastContext";

export function ReviewList({ sellerId, user, productId, scrollToReviewId }) {
  const toast = useToast();
  const [reviews, setReviews] = useState([]);

  // 🌟 KHẮC PHỤC 1: Khởi tạo loading dựa trên sự tồn tại của sellerId
  const [loading, setLoading] = useState(!!sellerId);

  // ─── Write modal ───
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ─── Edit modal ───
  const [editingReview, setEditingReview] = useState(null); // review object
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ─── Delete confirm ───
  const [deletingId, setDeletingId] = useState(null); // reviewId pending confirm
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // 🌟 KHẮC PHỤC 2: Bọc fetchReviews vào useCallback để giữ tham chiếu ổn định
  const fetchReviews = useCallback(() => {
    if (!sellerId) return;
    api(`/reviews/seller/${sellerId}`)
      .then((res) => {
        if (Array.isArray(res)) setReviews(res);
        else if (res && Array.isArray(res.data)) setReviews(res.data);
        else if (res && Array.isArray(res.reviews)) setReviews(res.reviews);
        else setReviews([]);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [sellerId]);

  useEffect(() => {
    if (!sellerId) {
      return;
    }
    fetchReviews();
  }, [sellerId, fetchReviews]);

  // 🌟 KHẮC PHỤC 3: Loại bỏ hoàn toàn biến reviewsList thừa, sử dụng trực tiếp state 'reviews'
  useEffect(() => {
    if (!scrollToReviewId || loading || reviews.length === 0) return;
    const el = document.getElementById(`review-${scrollToReviewId}`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.style.transition = "background 0.3s ease, box-shadow 0.3s ease";
        el.style.background = "#FEF9C3";
        el.style.boxShadow = "0 0 0 3px #FACC15";
        el.style.borderRadius = "12px";
        setTimeout(() => {
          el.style.background = "";
          el.style.boxShadow = "";
        }, 3000);
      }, 100);
    }
  }, [scrollToReviewId, loading, reviews]);

  // ─── Submit new review ───
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.append("productId", productId);
    fd.append("sellerId", sellerId);
    fd.append("rating", rating);
    fd.append("comment", comment);
    if (imageFile) fd.append("image", imageFile);

    api("/reviews", { method: "POST", body: fd })
      .then(() => {
        toast.success("Cảm ơn bạn đã gửi đánh giá thực tế!");
        setShowModal(false);
        setComment("");
        setImageFile(null);
        setRating(5);
        fetchReviews();
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setSubmitting(false));
  };

  // ─── Open edit modal ───
  const openEdit = (r) => {
    setEditingReview(r);
    setEditRating(r.Rating);
    setEditComment(r.Comment || "");
    setEditImageFile(null);
  };

  // ─── Submit edit ───
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editRating || !editingReview) return;
    setEditSubmitting(true);
    const fd = new FormData();
    fd.append("rating", editRating);
    fd.append("comment", editComment);
    if (editImageFile) fd.append("image", editImageFile);

    api(`/reviews/${editingReview.ReviewID}`, { method: "PUT", body: fd })
      .then(() => {
        toast.success("Đã cập nhật đánh giá của bạn!");
        setEditingReview(null);
        fetchReviews();
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setEditSubmitting(false));
  };

  // ─── Confirm & delete ───
  const handleDeleteConfirm = () => {
    if (!deletingId) return;
    setDeleteSubmitting(true);
    api(`/reviews/${deletingId}`, { method: "DELETE" })
      .then(() => {
        toast.success("Đã xóa đánh giá.");
        setDeletingId(null);
        fetchReviews();
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setDeleteSubmitting(false));
  };

  // ─── Star renderer ───
  const Stars = ({ n }) => (
    <span style={{ color: "#F59E0B", fontSize: 14 }}>
      {"★".repeat(n)}
      {"☆".repeat(5 - n)}
    </span>
  );

  return (
    <div
      style={{
        marginTop: 24,
        padding: 20,
        background: C.white,
        borderRadius: 12,
        border: `1px solid ${C.border}`,
      }}
    >
      {/* ─── Header ─── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, color: C.dark }}>
          ⭐ Đánh giá người bán ({reviews.length})
        </h3>
        {user && user.userId !== sellerId && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "6px 12px",
              background: C.coral,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            + Viết đánh giá
          </button>
        )}
      </div>

      {/* ─── Review list ─── */}
      {loading ? (
        <div style={{ color: C.muted, fontSize: 13 }}>Đang tải đánh giá...</div>
      ) : reviews.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 13 }}>
          Chưa có đánh giá nào cho người bán này.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {reviews.map((r) => {
            const isOwner =
              user && String(user.userId) === String(r.ReviewerID);
            return (
              <div
                key={r.ReviewID}
                id={`review-${r.ReviewID}`}
                style={{
                  paddingBottom: 16,
                  borderBottom: `1px solid ${C.border}`,
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
                  <strong style={{ fontSize: 14 }}>{r.ReviewerName}</strong>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 12, color: C.muted }}>
                      {new Date(r.CreatedAt).toLocaleDateString("vi")}
                    </span>

                    {/* Edit / Delete — chỉ hiện với chủ đánh giá */}
                    {isOwner && (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => openEdit(r)}
                          title="Sửa đánh giá"
                          style={actionBtnStyle("#EFF6FF", "#3B82F6")}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeletingId(r.ReviewID)}
                          title="Xóa đánh giá"
                          style={actionBtnStyle("#FFF1F2", "#EF4444")}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <Stars n={r.Rating} />
                </div>

                {r.Comment && (
                  <p style={{ margin: "0 0 8px", fontSize: 14, color: C.text }}>
                    {r.Comment}
                  </p>
                )}
                {r.ImageURL && (
                  <img
                    src={r.ImageURL}
                    alt="review"
                    style={{
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                )}
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                  Sản phẩm: {r.ProductName}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Write review modal ─── */}
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
          onClose={() => setShowModal(false)}
          submitLabel="Gửi đánh giá"
          C={C}
        />
      )}

      {/* ─── Edit review modal ─── */}
      {editingReview && (
        <ReviewModal
          title="Sửa đánh giá"
          rating={editRating}
          setRating={setEditRating}
          comment={editComment}
          setComment={setEditComment}
          imageFile={editImageFile}
          setImageFile={setEditImageFile}
          existingImageURL={editingReview.ImageURL}
          submitting={editSubmitting}
          onSubmit={handleEditSubmit}
          onClose={() => setEditingReview(null)}
          submitLabel="Lưu thay đổi"
          C={C}
        />
      )}

      {/* ─── Delete confirm dialog ─── */}
      {deletingId && (
        <div style={overlayStyle}>
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              width: "100%",
              maxWidth: 360,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Xóa đánh giá?</h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: C.muted }}>
              Hành động này không thể hoàn tác. Đánh giá của bạn sẽ bị xóa vĩnh
              viễn.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => setDeletingId(null)}
                disabled={deleteSubmitting}
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
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
                style={{
                  padding: "8px 20px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  background: "#EF4444",
                  color: "#fff",
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

/* ─── Shared Review Form Modal ─── */
function ReviewModal({
  title,
  rating,
  setRating,
  comment,
  setComment,
  imageFile,
  setImageFile,
  existingImageURL,
  submitting,
  onSubmit,
  onClose,
  submitLabel,
  C,
}) {
  return (
    <div style={overlayStyle}>
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          width: "100%",
          maxWidth: 400,
        }}
      >
        <h3 style={{ margin: "0 0 16px" }}>{title}</h3>
        <form onSubmit={onSubmit}>
          {/* Rating */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Số sao</label>
            {/* Star picker */}
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  style={{
                    fontSize: 24,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: n <= rating ? "#F59E0B" : "#D1D5DB",
                    transition: "color 0.15s, transform 0.1s",
                    transform: n <= rating ? "scale(1.15)" : "scale(1)",
                  }}
                >
                  ★
                </button>
              ))}
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

          {/* Comment */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Nhận xét</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Hải sản có tươi không? Đóng gói thế nào?"
              rows={3}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                fontFamily: "inherit",
                boxSizing: "border-box",
                fontSize: 13,
                marginTop: 4,
                resize: "vertical",
              }}
            />
          </div>

          {/* Image */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Ảnh đánh giá (Tùy chọn)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0] || null)}
              style={{ fontSize: 13, marginTop: 4, display: "block" }}
            />
            {/* Preview new file */}
            {imageFile && (
              <img
                src={URL.createObjectURL(imageFile)}
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
            {/* Show existing if no new file selected */}
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

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
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
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: C.ocean,
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                opacity: submitting ? 0.7 : 1,
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

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: 16,
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
};

// 🌟 KHẮC PHỤC 4: Bổ sung thuộc tính color vào chữ ký hàm actionBtnStyle để hiển thị đúng màu
const actionBtnStyle = (bg, color) => ({
  padding: "3px 7px",
  borderRadius: 5,
  border: "none",
  cursor: "pointer",
  background: bg,
  color: color, // Bổ sung thuộc tính này
  fontSize: 13,
  lineHeight: 1,
  display: "flex",
  alignItems: "center",
  transition: "opacity 0.15s",
});
