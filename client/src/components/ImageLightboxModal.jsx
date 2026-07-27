import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function ImageLightboxModal({ images = [], currentIndex = 0, onClose, onSelectIndex }) {
  const safeImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const safeIndex = Math.max(0, Math.min(currentIndex || 0, Math.max(0, safeImages.length - 1)));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft" && safeIndex > 0) onSelectIndex?.(safeIndex - 1);
      if (e.key === "ArrowRight" && safeIndex < safeImages.length - 1) onSelectIndex?.(safeIndex + 1);
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [safeIndex, safeImages.length, onClose, onSelectIndex]);

  if (!safeImages || safeImages.length === 0) return null;

  const currentImage = safeImages[safeIndex] || safeImages[0];

  const modalContent = (
    <div className="lightbox-overlay" onClick={() => onClose?.()} role="dialog" aria-label="Xem ảnh phóng to">
      <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
        {/* Header bar */}
        <div className="lightbox-header">
          <span className="lightbox-counter">
            {safeIndex + 1} / {safeImages.length}
          </span>
          <button className="lightbox-close-btn" onClick={() => onClose?.()} aria-label="Đóng xem ảnh" type="button">
            <X size={24} />
          </button>
        </div>

        {/* Main image content */}
        <div className="lightbox-content">
          <img src={currentImage} alt="Ảnh phóng to" className="lightbox-image" />
        </div>

        {/* Navigation arrows */}
        {safeImages.length > 1 && (
          <>
            {safeIndex > 0 && (
              <button
                className="lightbox-arrow is-left"
                onClick={() => onSelectIndex?.(safeIndex - 1)}
                aria-label="Ảnh trước"
                type="button"
              >
                <ChevronLeft size={32} />
              </button>
            )}
            {safeIndex < safeImages.length - 1 && (
              <button
                className="lightbox-arrow is-right"
                onClick={() => onSelectIndex?.(safeIndex + 1)}
                aria-label="Ảnh tiếp theo"
                type="button"
              >
                <ChevronRight size={32} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
