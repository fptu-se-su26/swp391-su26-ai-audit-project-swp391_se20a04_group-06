/**
 * useViewTransitionNavigate.js
 * Wrap useNavigate với View Transitions API.
 * Khi navigate sang trang mới, browser sẽ chạy hiệu ứng
 * fade/slide native (::view-transition-old/new trong index.css).
 *
 * Fallback graceful: nếu browser không hỗ trợ (Firefox < 128, Safari < 18)
 * sẽ navigate bình thường — không ảnh hưởng gì.
 */
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

export function useViewTransitionNavigate() {
  const navigate = useNavigate();

  const vtNavigate = useCallback(
    (to, options) => {
      if (!document.startViewTransition) {
        navigate(to, options);
        return;
      }
      document.startViewTransition(() => {
        navigate(to, options);
      });
    },
    [navigate],
  );

  return vtNavigate;
}
