/**
 * ============================================================
 * FILE: useViewTransitionNavigate.js
 * ============================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Đây là một "Custom Hook" — tức là hàm do lập trình viên tự tạo ra,
 * hoạt động theo quy tắc của React Hook (tên bắt đầu bằng "use").
 *
 * Hook này "bọc thêm" chức năng điều hướng trang (chuyển URL) của
 * react-router-dom bằng View Transitions API — một tính năng có sẵn
 * trên trình duyệt hiện đại, giúp tạo hiệu ứng chuyển trang mượt mà
 * (ví dụ: fade in/out, slide) mà KHÔNG cần thư viện animation nào thêm.
 *
 * 💡 VÍ DỤ DỄ HIỂU:
 * Bình thường khi bạn bấm một link và chuyển trang:
 *   [Trang A] → chớp cái → [Trang B]  ← trông thô, không có hiệu ứng
 *
 * Với hook này:
 *   [Trang A] → mờ dần (fade out) → [Trang B hiện dần] ← mượt mà hơn
 *
 * 🛡️ AN TOÀN VỚI TRÌNH DUYỆT CŨ (Graceful Fallback):
 * Nếu trình duyệt chưa hỗ trợ View Transitions API (Firefox cũ, Safari cũ...),
 * code vẫn chạy bình thường — chỉ là không có hiệu ứng, KHÔNG gây lỗi.
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
// PHẦN 1: IMPORT (Nhập khẩu)
// ─────────────────────────────────────────────────────────────

/**
 * useNavigate: Hook gốc của react-router-dom.
 * Khi gọi navigate("/about"), trình duyệt sẽ chuyển đến trang /about
 * mà KHÔNG reload lại cả trang web (đây gọi là SPA - Single Page Application).
 *
 * Hãy hình dung useNavigate như một "tay lái" của ứng dụng —
 * bạn chỉ cần nói "đi đến đây" và nó tự xử lý phần còn lại.
 */
import { useNavigate } from "react-router-dom";

/**
 * useCallback: Hook tối ưu hóa hiệu năng của React.
 *
 * VẤN ĐỀ NẾU KHÔNG DÙNG useCallback:
 * Mỗi lần component cha re-render (vẽ lại), hàm vtNavigate bên dưới
 * sẽ bị tạo ra MỚI HOÀN TOÀN trong bộ nhớ — dù code y hệt.
 * Điều này khiến các component con nhận hàm này cũng bị re-render theo
 * một cách không cần thiết → lãng phí tài nguyên.
 *
 * GIẢI PHÁP VỚI useCallback:
 * React sẽ "ghi nhớ" (memoize) hàm vtNavigate và chỉ tạo lại
 * khi danh sách phụ thuộc [navigate] thay đổi.
 * Kết quả: component con không bị re-render thừa.
 *
 * Hãy hình dung useCallback như một "bộ nhớ đệm" — thay vì
 * viết lại công thức từ đầu mỗi lần, bạn lưu nó lại và dùng lại.
 */
import { useCallback } from "react";

// ─────────────────────────────────────────────────────────────
// PHẦN 2: KHAI BÁO CUSTOM HOOK
// ─────────────────────────────────────────────────────────────

/**
 * Custom Hook: useViewTransitionNavigate
 *
 * CÁCH DÙNG trong component:
 *   const navigate = useViewTransitionNavigate();
 *   <button onClick={() => navigate("/about")}>Về chúng tôi</button>
 *
 * QUY TẮC CỦA REACT HOOK (quan trọng cho người mới):
 *  ✅ Chỉ gọi hook bên trong functional component hoặc custom hook khác
 *  ✅ Chỉ gọi hook ở cấp trên cùng của hàm, không được gọi trong if/for/...
 *  ✅ Tên hook bắt buộc phải bắt đầu bằng "use" để React nhận diện
 */
export function useViewTransitionNavigate() {
  // ── BƯỚC 1: Lấy hàm navigate gốc từ react-router-dom ──────
  /**
   * Gọi useNavigate() để lấy về hàm navigate.
   * Hàm này đã được react-router-dom chuẩn bị sẵn —
   * nó biết ứng dụng đang ở URL nào, history stack ra sao...
   *
   * Lưu ý: navigate là một hàm, không phải một giá trị bình thường.
   * Ví dụ: navigate("/home") → chuyển đến trang /home
   *        navigate(-1)       → quay lại trang trước (như nút Back)
   */
  const navigate = useNavigate();

  // ── BƯỚC 2: Tạo hàm điều hướng nâng cao với hiệu ứng ──────
  /**
   * vtNavigate (viết tắt của "View Transition Navigate") là hàm
   * mà chúng ta sẽ trả về cho người dùng hook này sử dụng.
   *
   * Tham số nhận vào:
   *  @param {string | number} to
   *    Đích đến — ví dụ: "/about", "/user/123", hoặc -1 (quay lại)
   *
   *  @param {Object} [options]
   *    Tùy chọn điều hướng (không bắt buộc) — ví dụ:
   *    { replace: true }   → thay thế trang hiện tại trong history
   *                          (bấm Back sẽ không quay lại trang này)
   *    { state: {...} }    → gửi kèm dữ liệu sang trang đích
   *                          (như truyền "hành lý" khi chuyển trang)
   */
  const vtNavigate = useCallback(
    (to, options) => {
      // ── BƯỚC 2A: Kiểm tra trình duyệt có hỗ trợ không ──────
      /**
       * document.startViewTransition là hàm do trình duyệt cung cấp.
       * Nếu trình duyệt hỗ trợ (Chrome 111+, Edge 111+...): hàm tồn tại → truthy
       * Nếu trình duyệt KHÔNG hỗ trợ (Firefox cũ, Safari cũ): hàm là undefined → falsy
       *
       * Toán tử "!" đảo ngược: !undefined → true (tức là "KHÔNG hỗ trợ")
       *
       * Đây là pattern "feature detection" — kiểm tra tính năng trước khi dùng,
       * thay vì kiểm tra tên trình duyệt (vì cùng trình duyệt, version khác nhau
       * có thể hỗ trợ khác nhau).
       */
      if (!document.startViewTransition) {
        /**
         * FALLBACK (dự phòng): Trình duyệt không hỗ trợ hiệu ứng.
         * Gọi navigate bình thường — chuyển trang ngay, không có animation.
         * "return" để thoát hàm luôn, không chạy code bên dưới.
         */
        navigate(to, options);
        return;
      }

      // ── BƯỚC 2B: Kích hoạt hiệu ứng chuyển cảnh ────────────
      /**
       * document.startViewTransition(callback) hoạt động theo 3 giai đoạn:
       *
       * GIAI ĐOẠN 1 — CHỤP ẢNH TRANG CŨ:
       *   Trình duyệt chụp "ảnh chụp màn hình" (screenshot) của trang hiện tại.
       *   Ảnh này sẽ dùng để làm hiệu ứng "trang cũ biến mất".
       *
       * GIAI ĐOẠN 2 — GỌI CALLBACK (hàm bên trong):
       *   Trình duyệt gọi hàm () => { navigate(to, options) }
       *   React cập nhật DOM → trang mới được render
       *   Trình duyệt chụp "ảnh" của trang mới.
       *
       * GIAI ĐOẠN 3 — CHẠY ANIMATION:
       *   Trình duyệt dùng CSS ::view-transition-old và ::view-transition-new
       *   để animate: trang cũ mờ dần, trang mới hiện dần (hoặc slide, v.v.)
       *   Các hiệu ứng cụ thể được định nghĩa trong file index.css.
       *
       * 🎨 HÌNH DUNG NHƯ POWERPOINT:
       *   Đây giống như tính năng "Slide Transition" trong PowerPoint —
       *   thay vì chuyển slide cụp cái, bạn thêm hiệu ứng dissolve/wipe/fly.
       *   Trình duyệt tự làm phần "dissolve", bạn chỉ cần nói "chuyển trang đi".
       */
      document.startViewTransition(() => {
        /**
         * Gọi navigate bên trong callback này.
         *
         * TẠI SAO navigate phải nằm TRONG startViewTransition?
         * Vì startViewTransition cần biết "DOM sẽ thay đổi gì" để chụp ảnh đúng lúc.
         * Nếu gọi navigate TRƯỚC startViewTransition → trang đã đổi rồi mới chụp ảnh
         * → trình duyệt không có ảnh trang cũ → không có hiệu ứng chuyển cảnh.
         *
         * Thứ tự đúng:
         *   startViewTransition(            ← BẮT ĐẦU: chụp ảnh trang cũ
         *     () => navigate(to, options)   ← GIỮA: cập nhật trang
         *   )                               ← KẾT THÚC: chụp ảnh trang mới, chạy CSS
         */
        navigate(to, options);
      });
    },

    /**
     * MẢNG PHỤ THUỘC của useCallback: [navigate]
     *
     * React sẽ theo dõi biến navigate — khi navigate thay đổi (rất hiếm,
     * nhưng có thể xảy ra khi router context thay đổi), useCallback sẽ
     * tạo lại hàm vtNavigate mới để đảm bảo dùng navigate mới nhất.
     *
     * Nếu để mảng rỗng [] → vtNavigate sẽ "đóng băng" tham chiếu navigate
     * từ lần render đầu tiên → có thể gây bug khó debug.
     *
     * Quy tắc vàng: mảng phụ thuộc phải chứa TẤT CẢ biến bên ngoài
     * mà hàm bên trong useCallback có sử dụng.
     */
    [navigate],
  );

  // ── BƯỚC 3: Trả về hàm điều hướng đã được nâng cấp ────────
  /**
   * Trả về vtNavigate để component sử dụng.
   *
   * Người dùng hook này chỉ cần viết:
   *   const navigate = useViewTransitionNavigate();
   *   navigate("/contact"); // ← tự động có hiệu ứng nếu trình duyệt hỗ trợ
   *
   * API sử dụng y hệt useNavigate gốc → dễ dàng thay thế trong dự án cũ.
   */
  return vtNavigate;
}
