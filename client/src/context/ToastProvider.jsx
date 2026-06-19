/**
 * ============================================================
 * FILE: ToastProvider.jsx
 * ============================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Đây là "nhà máy sản xuất & trưng bày Toast" thật sự — nơi:
 *   1. LƯU TRỮ danh sách các thông báo đang hiển thị (state)
 *   2. ĐỊNH NGHĨA hàm addToast — cách thêm 1 thông báo mới
 *   3. TỰ ĐỘNG XOÁ thông báo sau 3 giây (giống như đèn LED tự tắt)
 *   4. VẼ RA giao diện thật của các hộp thông báo trên màn hình
 *
 * Nhắc lại bức tranh toàn cảnh đã xây dựng qua 2 file trước:
 *
 *   ToastContext.jsx  → tạo "kênh phát" + hook useToast (cách BẮT SÓNG)
 *   ToastProvider.jsx → "đài phát sóng" thật sự (file NÀY — cách PHÁT)
 *
 * Component này sẽ được dùng ở App.jsx, bọc NGOÀI CÙNG ứng dụng:
 *
 *   <ToastProvider>      ← "đài phát sóng" toast cho toàn app
 *     <AuthProvider>
 *       <Router>...</Router>
 *     </AuthProvider>
 *   </ToastProvider>
 *
 * Nhờ vậy, BẤT KỲ component nào (LoginPage, Dashboard, ChatBox...)
 * gọi useToast().success("...") đều khiến hộp thông báo hiện ra
 * ở GÓC MÀN HÌNH — vị trí được vẽ ngay TRONG component này.
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
// PHẦN 1: IMPORT
// ─────────────────────────────────────────────────────────────

/**
 * useState     → lưu và cập nhật danh sách toasts (mảng các thông báo)
 * useCallback  → ghi nhớ hàm addToast, tránh tạo hàm mới mỗi lần render
 *                (quan trọng vì addToast được "phát" qua Context — nếu
 *                tạo mới liên tục sẽ khiến mọi nơi dùng useToast() bị
 *                ảnh hưởng hiệu năng không cần thiết)
 */
import { useState, useCallback } from "react";

/**
 * ToastContext — "kênh phát" đã tạo ở file ToastContext.jsx.
 * File này sẽ dùng ToastContext.Provider để "phát" hàm addToast
 * xuống cho mọi component con.
 */
import { ToastContext } from "./ToastContext";

// ─────────────────────────────────────────────────────────────
// PHẦN 2: COMPONENT ToastProvider
// ─────────────────────────────────────────────────────────────

/**
 * ToastProvider — Component bao bọc (Wrapper Component)
 * Tương tự AuthProvider đã học — nhận "children" là toàn bộ phần
 * ứng dụng nằm bên trong, và "bọc thêm" khả năng hiển thị toast.
 */
export function ToastProvider({ children }) {
  // ── STATE: Danh sách các toast đang hiển thị ──────────────
  /**
   * toasts: một MẢNG (array) chứa các object, mỗi object là 1 toast.
   *
   * Cấu trúc mỗi phần tử trong mảng:
   *   { id: 1718500000000, message: "Lưu thành công!", type: "success" }
   *
   * Ban đầu mảng RỖNG [] — nghĩa là chưa có thông báo nào hiển thị.
   * Mỗi khi gọi addToast(...), một phần tử MỚI sẽ được thêm vào mảng,
   * và sau 3 giây, phần tử đó sẽ tự bị LOẠI RA khỏi mảng.
   *
   * 💡 HÌNH DUNG: toasts giống như "hàng đợi vé xếp hàng" ở quầy —
   * vé mới được thêm vào CUỐI hàng, và khi "hết hạn xử lý" (3 giây)
   * thì tự động bị gỡ ra, không cần ai bấm nút xoá thủ công.
   */
  const [toasts, setToasts] = useState([]);

  // ── HÀM: Thêm một toast mới ────────────────────────────────
  /**
   * addToast — hàm THẬT, sẽ được "phát" ra Context để mọi nơi dùng.
   *
   * @param {string} message  - Nội dung văn bản hiển thị trong toast
   * @param {string} [type="info"] - Loại toast: "success" | "error" |
   *                                  "warn" | "info" (mặc định "info"
   *                                  nếu không truyền vào)
   *
   * Cú pháp (message, type = "info") — đây là GIÁ TRỊ THAM SỐ MẶC ĐỊNH
   * (default parameter) của JavaScript: nếu người gọi KHÔNG truyền
   * "type", nó sẽ tự lấy "info" thay thế.
   *
   * Ví dụ:
   *   addToast("Xin chào!")            → type tự động = "info"
   *   addToast("Lỗi rồi!", "error")    → type = "error"
   */
  const addToast = useCallback((message, type = "info") => {
    /**
     * Tạo ID DUY NHẤT cho toast này bằng Date.now().
     *
     * Date.now() trả về số milliseconds đã trôi qua kể từ
     * 1/1/1970 (Unix Epoch) — một con số luôn TĂNG DẦN theo thời gian.
     *
     * TẠI SAO CẦN ID DUY NHẤT?
     * Để biết CHÍNH XÁC toast nào cần xoá khi hết 3 giây (xem phần
     * setTimeout dưới), và để React dùng làm "key" khi render danh
     * sách (giải thích chi tiết ở phần JSX bên dưới).
     *
     * ⚠️ LƯU Ý NHỎ (kiến thức nâng cao, không quá nghiêm trọng ở đây):
     * Nếu 2 lệnh addToast() được gọi ở CÙNG một millisecond
     * (cực hiếm khi user dùng tay, nhưng có thể xảy ra nếu code
     * gọi addToast() liên tiếp trong 1 vòng lặp for không có
     * await), 2 toast có thể bị TRÙNG ID → khi 1 toast hết hạn,
     * .filter() có thể vô tình xoá luôn toast trùng ID đó.
     * Cách khắc phục an toàn hơn (nếu cần): dùng
     * crypto.randomUUID() hoặc thư viện như "nanoid" để đảm bảo
     * ID không trùng tuyệt đối. Với ứng dụng thông thường,
     * Date.now() vẫn đủ tốt trong 99% trường hợp thực tế.
     */
    const id = Date.now();

    /**
     * Thêm toast mới vào CUỐI mảng toasts hiện tại.
     *
     * setToasts((prev) => [...prev, { id, message, type }])
     *
     * TẠI SAO DÙNG "FUNCTIONAL UPDATE" (prev) => ... THAY VÌ
     * setToasts([...toasts, {...}]) TRỰC TIẾP?
     *
     * Vì addToast được bọc trong useCallback VỚI MẢNG DEPENDENCY
     * RỖNG [] — nghĩa là hàm addToast được "đóng băng" (tạo) MỘT
     * LẦN DUY NHẤT khi component mount, và sẽ KHÔNG được tạo lại
     * dù state "toasts" có thay đổi sau đó.
     *
     * Nếu viết setToasts([...toasts, {...}]) (đọc trực tiếp biến
     * "toasts" bên ngoài), hàm addToast sẽ bị "CLOSURE" giữ lại
     * giá trị "toasts" CŨ từ lần đầu tạo hàm (luôn luôn là mảng
     * rỗng [] ban đầu!) → mỗi lần addToast() được gọi sẽ LUÔN
     * GHI ĐÈ lại mảng chỉ có 1 phần tử, làm "mất" các toast cũ
     * đang hiển thị → BUG nghiêm trọng!
     *
     * Dùng FUNCTIONAL UPDATE (prev) => [...]:
     * React đảm bảo "prev" LUÔN LUÔN là giá trị STATE MỚI NHẤT
     * tại thời điểm cập nhật thực sự diễn ra — không phụ thuộc
     * vào giá trị "toasts" cũ bị đóng băng trong closure.
     *
     * [...prev, { id, message, type }]
     * Đây là SPREAD OPERATOR (dấu ba chấm "..."):
     *   • "...prev" → "trải" tất cả phần tử cũ trong mảng prev ra
     *   • thêm { id, message, type } vào CUỐI
     *   → Tạo ra một MẢNG MỚI HOÀN TOÀN (không sửa trực tiếp mảng cũ)
     *
     * TẠI SAO KHÔNG DÙNG prev.push({...}) RỒI setToasts(prev)?
     * Vì .push() làm THAY ĐỔI TRỰC TIẾP (mutate) mảng cũ, vi phạm
     * nguyên tắc "Immutability" (bất biến) của React — React so
     * sánh state cũ/mới bằng cách kiểm tra THAM CHIẾU (reference),
     * nếu mảng vẫn là CÙNG MỘT object trong bộ nhớ, React có thể
     * KHÔNG nhận ra state đã thay đổi → không re-render → toast
     * không hiện ra. Luôn tạo MẢNG MỚI là quy tắc vàng trong React.
     */
    setToasts((prev) => [...prev, { id, message, type }]);

    /**
     * setTimeout — hẹn giờ chạy 1 đoạn code SAU 3000 milliseconds
     * (tức 3 giây) kể từ lúc dòng này được thực thi.
     *
     * Đây là cách "lập trình bất đồng bộ" (asynchronous) đơn giản
     * nhất trong JavaScript: "Này trình duyệt, 3 giây sau hãy
     * tự chạy đoạn code này cho tôi, còn bây giờ tôi đi làm
     * việc khác trước."
     */
    setTimeout(() => {
      /**
       * Sau 3 giây, XOÁ toast có "id" TƯƠNG ỨNG khỏi mảng toasts.
       *
       * .filter((t) => t.id !== id)
       *
       * .filter() tạo ra MẢNG MỚI chỉ chứa các phần tử THOẢ ĐIỀU
       * KIỆN trong hàm callback. Ở đây, điều kiện là "t.id !== id"
       * (giữ lại toast nào có id KHÁC với id của toast vừa hết hạn).
       *
       * 💡 HÌNH DUNG: giống như đến giờ hẹn, ta lọc qua TOÀN BỘ
       * "hàng đợi vé" và CHỈ BỎ ĐI đúng tấm vé có số hiệu trùng với
       * vé đã "hết hạn sử dụng", giữ nguyên các vé khác không động đến.
       *
       * Lại dùng functional update (prev) => ... vì lý do TƯƠNG TỰ
       * như trên: setTimeout callback này được tạo ra ở một THỜI
       * ĐIỂM TRONG QUÁ KHỨ (lúc addToast chạy), nên nếu đọc trực
       * tiếp biến "toasts" bên ngoài, nó sẽ bị "đóng băng" tại giá
       * trị CŨ lúc đó — không phản ánh đúng những toast khác đã được
       * thêm/xoá xen vào TRONG 3 GIÂY chờ đợi đó.
       *
       * ⚠️ LƯU Ý VỀ "CLEANUP" (so sánh với AuthProvider.jsx đã học):
       * Ở AuthProvider, ta dùng AbortController để HUỶ request nếu
       * component unmount giữa lúc đang chờ.
       * Ở ĐÂY, setTimeout này KHÔNG có cơ chế huỷ tương tự (không có
       * clearTimeout trong cleanup function). Trong thực tế, điều
       * này CHẤP NHẬN ĐƯỢC vì ToastProvider thường đặt ở GỐC app
       * (App.jsx) và TỒN TẠI SUỐT đời sống ứng dụng — không bao giờ
       * bị unmount. Nhưng nếu một ngày ToastProvider được dùng ở nơi
       * có thể unmount (ví dụ trong 1 Modal tạm thời), nên cân nhắc
       * lưu lại timeoutId và gọi clearTimeout() khi unmount để tránh
       * cảnh báo "setState on unmounted component".
       */
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []); // Mảng dependency rỗng → addToast được tạo DUY NHẤT 1 lần, không đổi

  // ─────────────────────────────────────────────────────────
  // PHẦN RENDER: Phát Context + Vẽ giao diện Toast thật
  // ─────────────────────────────────────────────────────────
  return (
    /**
     * <ToastContext.Provider value={addToast}>
     *
     * "Phát" hàm addToast ra cho toàn bộ component con bên trong
     * — đây CHÍNH LÀ giá trị mà useContext(ToastContext) ở file
     * ToastContext.jsx sẽ nhận được khi các component khác gọi
     * useToast().
     */
    <ToastContext.Provider value={addToast}>
      {/*
        {children} — render lại nguyên vẹn toàn bộ phần ứng dụng
        được đặt BÊN TRONG <ToastProvider>...</ToastProvider>
        (ví dụ: <AuthProvider><Router>...</Router></AuthProvider>)
      */}
      {children}

      {/*
        ──────────────────────────────────────────────────────
        KHUNG CHỨA TOAST — phần TỬ GIAO DIỆN THẬT, luôn "nổi"
        ở góc dưới-phải màn hình, BẤT KỂ trang nào đang hiển thị.
        ──────────────────────────────────────────────────────

        Vì div này được đặt NGAY TRONG ToastProvider — một component
        bọc ở GỐC app — nó sẽ LUÔN tồn tại trên màn hình dù người
        dùng điều hướng (navigate) qua bất kỳ trang nào trong app.
      */}
      <div
        style={{
          /**
           * position: "fixed"
           * Định vị phần tử này theo TOẠ ĐỘ CỦA TRÌNH DUYỆT (viewport),
           * KHÔNG theo vị trí của các phần tử cha trong DOM.
           *
           * Khác với position: "static" (vị trí mặc định, trôi theo
           * dòng chảy trang) hoặc "absolute" (theo phần tử cha gần nhất
           * có position khác static), "fixed" khiến phần tử này
           * "DÍNH CHẶT" vào một góc màn hình — dù người dùng CUỘN
           * (scroll) trang lên xuống, khung toast vẫn đứng yên tại đó.
           */
          position: "fixed",

          /** bottom: 20 → cách đáy màn hình 20px (đơn vị mặc định là px) */
          bottom: 20,

          /** right: 20 → cách lề phải màn hình 20px */
          right: 20,

          /**
           * zIndex: 99999
           * Quyết định "LỚP NÀO Ở TRÊN, LỚP NÀO Ở DƯỚI" khi nhiều
           * phần tử HTML chồng lên nhau (giống như các lớp giấy
           * trong suốt xếp chồng — số zIndex CAO HƠN sẽ NẰM TRÊN).
           *
           * Đặt giá trị RẤT CAO (99999) để đảm bảo khung Toast
           * LUÔN hiện trên TẤT CẢ các thành phần khác của trang —
           * dù trang đó có Modal, Dropdown, hay bất kỳ overlay nào
           * khác với zIndex thấp hơn, Toast vẫn không bị che mất.
           */
          zIndex: 99999,

          /**
           * display: "flex" + flexDirection: "column"
           * Biến div này thành FLEXBOX container, sắp xếp các toast
           * con theo CỘT ĐỨNG (từ trên xuống dưới) — toast mới nhất
           * sẽ nằm Ở DƯỚI CÙNG (vì được .push vào CUỐI mảng "toasts").
           */
          display: "flex",
          flexDirection: "column",

          /** gap: 8 → khoảng cách 8px giữa các hộp toast liên tiếp */
          gap: 8,
        }}
      >
        {/*
          .map() duyệt qua TỪNG phần tử trong mảng "toasts" và biến
          mỗi phần tử thành 1 đoạn JSX (<div>) tương ứng để hiển thị.

          Khi mảng "toasts" có 3 phần tử → sẽ render ra 3 hộp <div>
          xếp chồng theo cột đứng như cấu hình flexDirection ở trên.
        */}
        {toasts.map((t) => (
          <div
            /**
             * key={t.id} — THUỘC TÍNH BẮT BUỘC khi render LIST trong
             * React (dùng .map() để tạo ra nhiều phần tử JSX).
             *
             * "key" giúp React PHÂN BIỆT từng phần tử trong danh sách
             * MỘT CÁCH ỔN ĐỊNH qua các lần render — để khi có toast
             * MỚI thêm vào hoặc toast CŨ bị xoá đi, React biết CHÍNH
             * XÁC phần tử DOM nào cần thêm/xoá, thay vì phải vẽ lại
             * TOÀN BỘ danh sách từ đầu (rất tốn hiệu năng).
             *
             * Dùng t.id (giá trị Date.now() đã tạo ở addToast) làm
             * key là HOÀN HẢO vì nó DUY NHẤT và KHÔNG ĐỔI theo thời
             * gian sống của từng toast — đúng theo khuyến nghị chính
             * thức của React: "key nên là 1 ID ổn định, KHÔNG nên
             * dùng index của mảng (0, 1, 2...) khi danh sách có thể
             * thêm/xoá/sắp xếp lại".
             */
            key={t.id}
            style={{
              /** padding: khoảng đệm bên trong hộp — 12px trên/dưới, 20px trái/phải */
              padding: "12px 20px",

              /**
               * background — chọn MÀU NỀN dựa vào "type" của toast,
               * dùng TOÁN TỬ BA NGÔI (ternary operator) LỒNG NHAU:
               *
               *   điều_kiện ? giá_trị_nếu_đúng : giá_trị_nếu_sai
               *
               * Đọc từng bước:
               *   t.type === "success" ?  "#22C55E"  (xanh lá)
               *                        :  t.type === "error"
               *                           ?  "#EF4444"  (đỏ)
               *                           :  "#3B82F6"  (xanh dương,
               *                              dùng CHUNG cho cả "info"
               *                              VÀ "warn" — vì code không
               *                              có nhánh riêng kiểm tra
               *                              "warn", nên nó "rơi" vào
               *                              nhánh else cuối cùng)
               *
               * ⚠️ LƯU Ý THỰC TẾ: comment gốc của code ghi "warn (màu
               * vàng)", nhưng NHÌN KỸ logic thì warn ĐANG dùng MÀU
               * XANH DƯƠNG giống info (vì không có nhánh kiểm tra
               * t.type === "warn" riêng). Đây có thể là MỘT LỖI NHỎ
               * (bug) cần sửa nếu bạn muốn warn có màu vàng/cam riêng
               * biệt thật sự, ví dụ thêm 1 nhánh:
               *   : t.type === "warn" ? "#F59E0B" : "#3B82F6"
               */
              background:
                t.type === "success"
                  ? "#22C55E"
                  : t.type === "error"
                    ? "#EF4444"
                    : "#3B82F6",

              /** color: "#fff" → màu chữ trắng, tương phản tốt với các nền màu đậm trên */
              color: "#fff",

              /** borderRadius: 8 → bo tròn 4 góc hộp 8px, tạo cảm giác mềm mại hơn */
              borderRadius: 8,

              /**
               * boxShadow — tạo BÓNG ĐỔ mờ phía dưới hộp, giúp toast
               * trông "nổi" hẳn lên khỏi nền trang, có chiều sâu (depth).
               * "0 4px 12px rgba(0,0,0,0.15)" nghĩa là:
               *   - lệch ngang 0px, lệch xuống 4px, độ mờ lan toả 12px
               *   - màu đen (0,0,0) với độ trong suốt (alpha) 0.15 (15%)
               */
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",

              /** fontSize: 14 → cỡ chữ 14px, vừa đủ đọc, không quá to */
              fontSize: 14,

              /** fontWeight: 500 → độ đậm chữ ở mức TRUNG BÌNH (medium),
               *  đậm hơn chữ thường (400) nhưng nhẹ hơn chữ in đậm (700) */
              fontWeight: 500,
            }}
          >
            {/* Hiển thị nội dung văn bản thật của toast, ví dụ: "Lưu thành công!" */}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
