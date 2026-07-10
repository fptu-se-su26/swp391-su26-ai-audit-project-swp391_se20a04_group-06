import { ImagePlus, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import { apiReviews } from "../services/api";
import { formatDate } from "../utils/product";

export default function ReviewSection({
  allowReview = false,
  productId,
  sellerId,
}) {
  const { alert } = useConfirm();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [image, setImage] = useState(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    if (!sellerId) return;
    apiReviews
      .getBySeller(sellerId)
      .then((data) => setReviews((data?.data || []).map((review) => ({
        ...review,
        id: review.id || review._id || review.ReviewID,
        rating: Number(review.rating ?? review.Rating ?? 0),
        comment: review.comment ?? review.Comment,
        imageUrl: review.imageUrl ?? review.ImageURL,
        createdAt: review.createdAt ?? review.CreatedAt,
        reviewerName: review.reviewerName ?? review.ReviewerName,
        productName: review.productName ?? review.ProductName,
      }))))
      .catch(() => setReviews([]));
  }, [sellerId]);

  useEffect(load, [load]);

  const average = useMemo(
    () =>
      reviews.length
        ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
          reviews.length
        : 0,
    [reviews],
  );

  const submit = async (event) => {
    event.preventDefault();
    if (!user) {
      navigate("/login", { state: { message: "Bạn cần đăng nhập để đánh giá." } });
      return;
    }
    const formData = new FormData();
    formData.append("productId", productId);
    formData.append("sellerId", sellerId);
    formData.append("rating", String(rating));
    formData.append("comment", comment.trim());
    if (image) formData.append("image", image);

    setSending(true);
    try {
      await apiReviews.create(formData);
      setComment("");
      setImage(null);
      load();
    } catch (error) {
      await alert({
        title: "Lỗi đăng đánh giá",
        message: error.message,
        variant: "danger"
      });
    } finally {
      setSending(false);
    }
  };


  return (
    <section className="reviews-section">
      <header className="section-heading">
        <div>
          <span className="eyebrow">BUYER REVIEWS</span>
          <h2>Đánh giá ngư dân</h2>
        </div>
        <strong className="rating-summary"><Star size={18} /> {average.toFixed(1)} ({reviews.length})</strong>
      </header>

      {allowReview && productId && (
        <form className="review-form dashboard-panel" onSubmit={submit}>
          <div className="star-picker" aria-label="Chọn số sao">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                aria-label={`${value} sao`}
                className={value <= rating ? "is-active" : ""}
                key={value}
                onClick={() => setRating(value)}
                type="button"
              >
                <Star size={21} />
              </button>
            ))}
          </div>
          <textarea
            maxLength={500}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Chia sẻ chất lượng mẻ hàng và trải nghiệm với người bán..."
            rows="3"
            value={comment}
          />
          <div className="form-actions">
            <label className="button button--secondary">
              <ImagePlus size={16} /> Ảnh thực tế
              <input accept="image/*" className="visually-hidden" onChange={(event) => setImage(event.target.files?.[0] || null)} type="file" />
            </label>
            <button className="button button--primary" disabled={sending} type="submit">
              {sending ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      )}

      <div className="review-list">
        {reviews.map((review) => (
          <article key={review.id || review._id}>
            <header>
              <strong>{review.reviewerName || "Người mua"}</strong>
              <span>{Array.from({ length: 5 }, (_, index) => (
                <Star className={index < review.rating ? "is-active" : ""} key={index} size={14} />
              ))}</span>
              <small>{formatDate(review.createdAt)}</small>
            </header>
            {review.comment && <p>{review.comment}</p>}
            {review.imageUrl && <img alt="Ảnh đánh giá thực tế" loading="lazy" src={review.imageUrl} />}
          </article>
        ))}
        {reviews.length === 0 && <p className="muted-copy">Chưa có đánh giá nào.</p>}
      </div>
    </section>
  );
}
