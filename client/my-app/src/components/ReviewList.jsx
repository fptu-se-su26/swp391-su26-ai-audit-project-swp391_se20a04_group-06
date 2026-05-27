import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { C } from "../utils/theme";

export function ReviewList({ sellerId, user, productId, scrollToReviewId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = () => {
    api(`/reviews/seller/${sellerId}`)
      .then((res) => {
        if (Array.isArray(res)) {
          setReviews(res);
        } else if (res && Array.isArray(res.data)) {
          setReviews(res.data);
        } else if (res && Array.isArray(res.reviews)) {
          setReviews(res.reviews);
        } else {
          setReviews([]);
        }
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // FIX: guard tránh gọi API với sellerId = undefined
    if (!sellerId) {
      setLoading(false);
      return;
    }
    fetchReviews();
  }, [sellerId]);

  const reviewsList = Array.isArray(reviews) ? reviews : [];

  useEffect(() => {
    if (!scrollToReviewId || loading || reviewsList.length === 0) return;
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
  }, [scrollToReviewId, loading, reviewsList]);

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
        alert("Cảm ơn bạn đã đánh giá!");
        setShowModal(false);
        setComment("");
        setImageFile(null);
        setRating(5);
        fetchReviews();
      })
      .catch((err) => alert(err.message))
      .finally(() => setSubmitting(false));
  };

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, color: C.dark }}>
          ⭐ Đánh giá người bán ({reviewsList.length})
        </h3>
        {/* FIX: dùng user.userId thay vì user.id cho nhất quán với auth payload */}
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

      {loading ? (
        <div style={{ color: C.muted, fontSize: 13 }}>Đang tải đánh giá...</div>
      ) : reviewsList.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 13 }}>
          Chưa có đánh giá nào cho người bán này.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {reviewsList.map((r) => (
            <div
              key={r.ReviewID}
              id={`review-${r.ReviewID}`}
              style={{
                paddingBottom: 16,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <strong style={{ fontSize: 14 }}>{r.ReviewerName}</strong>
                <span style={{ fontSize: 12, color: C.muted }}>
                  {new Date(r.CreatedAt).toLocaleDateString("vi")}
                </span>
              </div>
              <div style={{ color: "#F59E0B", fontSize: 14, marginBottom: 8 }}>
                {"★".repeat(r.Rating)}
                {"☆".repeat(5 - r.Rating)}
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
          ))}
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <h3 style={{ margin: "0 0 16px" }}>Viết đánh giá</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Số sao
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 6,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} Sao
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Nhận xét
                </label>
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
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Ảnh đánh giá (Tùy chọn)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0] || null)}
                  style={{ fontSize: 13 }}
                />
                {imageFile && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="preview"
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                      }}
                    />
                  </div>
                )}
              </div>
              <div
                style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    background: "#f1f1f1",
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
                  }}
                >
                  {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
