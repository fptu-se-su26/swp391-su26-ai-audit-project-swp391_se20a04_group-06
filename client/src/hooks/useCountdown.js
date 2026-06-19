// ============================================================
// 📦 BƯỚC 1 – NHẬP CÁC CÔNG CỤ CẦN THIẾT TỪ REACT
// ============================================================
//
//  • useState    → Lưu trữ giá trị có thể thay đổi theo thời gian.
//                  Mỗi lần gọi setter (vd: setRem(...)), React sẽ
//                  vẽ lại giao diện với giá trị mới nhất.
//
//  • useEffect   → Chạy một đoạn code SAU KHI component render xong,
//                  và chạy lại mỗi khi dependency (tham số phụ thuộc)
//                  thay đổi. Dùng để thiết lập timer, gọi API, v.v.
//
import { useState, useEffect } from "react";

// ============================================================
// ⏳ CUSTOM HOOK: useCountdown
// ============================================================
//
// Hook này tính toán thời gian đếm ngược theo quy tắc:
//   "Hải sản đánh bắt được dùng trong vòng 24 giờ."
//
// Nhận vào:
//   • catchTime (string | Date) – Thời điểm đánh bắt hải sản.
//     Ví dụ: "2024-06-15T08:00:00" hoặc một đối tượng Date.
//
// Trả về:
//   • rem (string) – Chuỗi mô tả thời gian còn lại.
//     Ví dụ: "12h 30m"  → còn 12 giờ 30 phút
//             "0h 5m"   → còn 5 phút
//             "Hết hạn" → đã quá 24 giờ
//             ""        → chưa có dữ liệu catchTime
//
export function useCountdown(catchTime) {
  // ----------------------------------------------------------
  // 📌 STATE: rem – Chuỗi thời gian còn lại hiển thị cho user
  // ----------------------------------------------------------
  // Khởi tạo bằng chuỗi rỗng "" thay vì null để tránh lỗi khi
  // component render lần đầu chưa có dữ liệu.
  //
  //   rem = ""          → chưa tính toán (catchTime chưa có)
  //   rem = "12h 30m"   → đang đếm ngược
  //   rem = "Hết hạn"   → đã quá 24 giờ
  //
  const [rem, setRem] = useState("");

  // ============================================================
  // ⚙️ useEffect – Thiết lập bộ đếm thời gian tự động
  // ============================================================
  //
  // useEffect chạy SAU khi React vẽ xong giao diện.
  // Dependency [catchTime] ở cuối có nghĩa là:
  //   → Chạy lần đầu khi component xuất hiện
  //   → Chạy lại mỗi khi catchTime thay đổi
  //     (ví dụ: user chọn sản phẩm hải sản khác)
  //
  useEffect(() => {
    // --------------------------------------------------------
    // 🚪 Điều kiện thoát sớm (Early Return Guard)
    // --------------------------------------------------------
    // Nếu catchTime là null, undefined hoặc chuỗi rỗng → không
    // có gì để đếm ngược → thoát ngay, không thiết lập timer.
    //
    // Điều này bảo vệ code khỏi lỗi "cannot read property of null"
    // khi truyền vào: new Date(null) → invalid date.
    //
    if (!catchTime) return;

    // --------------------------------------------------------
    // 🔢 Hàm tick – Logic tính toán cốt lõi
    // --------------------------------------------------------
    // "tick" là tên ẩn dụ từ tiếng đồng hồ "tích tắc".
    // Hàm này được gọi ngay lập tức + mỗi 30 giây để cập nhật rem.
    //
    const tick = () => {
      // ──────────────────────────────────────────────────────
      // TÍNH THỜI GIAN CÒN LẠI (diff)
      // ──────────────────────────────────────────────────────
      //
      // Công thức:
      //   diff = Hạn sử dụng tổng cộng  -  Thời gian đã dùng
      //        = 24 giờ (ms)             -  (Bây giờ - Lúc đánh bắt)
      //
      // Chi tiết từng phần:
      //
      //   24 * 3600000
      //   → 24 giờ × 3.600.000 ms/giờ = 86.400.000 ms (mili giây)
      //   → Đây là tổng thời gian hải sản còn dùng được
      //
      //   Date.now()
      //   → Thời điểm HIỆN TẠI tính bằng mili giây (từ 1/1/1970)
      //   → Ví dụ: 1718438400000
      //
      //   new Date(catchTime).getTime()
      //   → Chuyển chuỗi catchTime thành mili giây
      //   → Ví dụ: "2024-06-15T08:00:00" → 1718438000000
      //
      //   Date.now() - new Date(catchTime).getTime()
      //   → Số mili giây ĐÃ TRÔI QUA kể từ khi đánh bắt
      //
      //   Kết quả: diff = số ms CÒN LẠI trong hạn 24 giờ
      //
      const diff = 24 * 3600000 - (Date.now() - new Date(catchTime).getTime());

      // ──────────────────────────────────────────────────────
      // TRƯỜNG HỢP 1: Đã hết hạn (diff <= 0)
      // ──────────────────────────────────────────────────────
      //
      // diff <= 0 nghĩa là đã quá 24 giờ kể từ khi đánh bắt.
      //
      // Kỹ thuật: "return setRem(...)" viết gọn 2 dòng thành 1:
      //   setRem("Hết hạn"); ← cập nhật state
      //   return;             ← thoát hàm tick, không chạy tiếp
      //
      // Lưu ý: setRem(...) không trả về gì (undefined), nhưng
      // việc return undefined vẫn thoát được hàm như return thường.
      //
      if (diff <= 0) return setRem("Hết hạn");

      // ──────────────────────────────────────────────────────
      // TRƯỜNG HỢP 2: Còn hạn – Tính giờ và phút còn lại
      // ──────────────────────────────────────────────────────
      //
      // Lúc này diff > 0, tức là hải sản vẫn còn dùng được.
      // Ta tách diff (ms) ra thành giờ + phút để hiển thị.
      //
      //   diff = 45.180.000 ms (ví dụ: còn 12 giờ 33 phút)
      //
      //   Tính giờ:
      //     diff / 3.600.000 = 12.55 giờ
      //     Math.floor(12.55) = 12 giờ  ← bỏ phần thập phân
      //
      const h = Math.floor(diff / 3600000);

      //   Tính phút (phần còn lại sau khi đã lấy giờ):
      //     diff % 3.600.000 = phần ms chưa đủ 1 giờ
      //                      = 45.180.000 % 3.600.000
      //                      = 1.980.000 ms (phần lẻ)
      //     1.980.000 / 60.000 = 33 phút
      //     Math.floor(33) = 33 phút
      //
      //   Toán tử %  (modulo) = lấy phần DƯ sau khi chia
      //   Ví dụ: 17 % 5 = 2  (17 = 5×3 + phần dư 2)
      //
      const m = Math.floor((diff % 3600000) / 60000);

      // Ghép giờ và phút thành chuỗi hiển thị
      // Template literal `${h}h ${m}m` → ví dụ: "12h 33m"
      setRem(`${h}h ${m}m`);
    };

    // --------------------------------------------------------
    // 🚀 Gọi tick() ngay lập tức (lần đầu tiên)
    // --------------------------------------------------------
    // Nếu không có dòng này, người dùng sẽ phải chờ 30 giây
    // mới thấy thời gian đếm ngược hiển thị lần đầu → trải
    // nghiệm xấu. Gọi tick() ngay để hiển thị kết quả tức thì.
    //
    tick();

    // --------------------------------------------------------
    // ⏱️ setInterval – Tự động lặp lại mỗi 30 giây
    // --------------------------------------------------------
    //
    // setInterval(callback, delay):
    //   • callback = hàm được gọi lặp đi lặp lại
    //   • delay    = khoảng cách giữa các lần gọi (ms)
    //   • 30000 ms = 30 giây
    //
    // Tại sao 30 giây? Vì ta chỉ hiển thị đến đơn vị phút,
    // cập nhật mỗi giây là dư thừa. 30 giây là đủ chính xác
    // mà không tốn tài nguyên CPU.
    //
    // setInterval trả về một ID (số nguyên) dùng để hủy sau này.
    //   id = 42  (ví dụ)
    //
    const id = setInterval(tick, 30000);

    // --------------------------------------------------------
    // 🧹 Cleanup function – Dọn dẹp khi "rời đi"
    // --------------------------------------------------------
    //
    // React tự động gọi hàm return này khi:
    //   1. Component bị unmount (xóa khỏi giao diện)
    //   2. catchTime thay đổi → useEffect sắp chạy lại
    //
    // Nếu KHÔNG có cleanup:
    //   → setInterval vẫn tiếp tục chạy ngầm dù component đã tắt
    //   → Mỗi lần catchTime thay đổi, một timer mới được tạo
    //   → Sau 10 lần thay đổi: 10 timer chạy cùng lúc = memory leak!
    //   → setRem() gọi trên component đã unmount → cảnh báo trong console
    //
    // clearInterval(id) → hủy đúng timer đã tạo ở trên bằng ID của nó.
    //
    return () => clearInterval(id);
  }, [catchTime]);
  //    ^
  //    |
  //  Dependency: chỉ chạy lại effect khi catchTime thay đổi.
  //  Ví dụ: user xem hải sản A (catchTime = "08:00")
  //         → chuyển xem hải sản B (catchTime = "14:00")
  //         → cleanup timer cũ → tạo timer mới cho hải sản B

  // ============================================================
  // 📤 Trả về kết quả
  // ============================================================
  //
  // Component sử dụng hook chỉ nhận một giá trị duy nhất: chuỗi rem.
  //
  //   const timeLeft = useCountdown(product.catchTime);
  //   // timeLeft = "12h 33m"  hoặc  "Hết hạn"  hoặc  ""
  //
  //   return <span>{timeLeft}</span>;
  //
  return rem;
}

// ============================================================
// 💡 VÍ DỤ SỬ DỤNG TRONG COMPONENT
// ============================================================
//
//  function SeafoodCard({ product }) {
//    const timeLeft = useCountdown(product.catchTime);
//
//    return (
//      <div>
//        <h2>{product.name}</h2>
//
//        {timeLeft === ""         && <span>Không có thông tin</span>}
//        {timeLeft === "Hết hạn"  && <span style={{ color: "red" }}>❌ Hết hạn rồi!</span>}
//        {timeLeft !== "Hết hạn"
//          && timeLeft !== ""     && <span style={{ color: "green" }}>✅ Còn {timeLeft}</span>}
//      </div>
//    );
//  }
//
// ============================================================
//
//  // Luồng thời gian thực tế:
//  //
//  //   catchTime = "2024-06-15 08:00"   (đánh bắt lúc 8 giờ sáng)
//  //
//  //   Lúc  8:00 → diff = 24h      → rem = "24h 0m"
//  //   Lúc 12:30 → diff = 19.5h    → rem = "19h 30m"
//  //   Lúc 20:00 → diff = 12h      → rem = "12h 0m"
//  //   Lúc 07:45 (hôm sau) → diff < 0 → rem = "Hết hạn"
//
// ============================================================
