// ============================================================
// 📦 BƯỚC 1 – NHẬP CÁC CÔNG CỤ CẦN THIẾT TỪ REACT
// ============================================================
//
// React cung cấp sẵn nhiều "hook" – đây là các hàm đặc biệt
// giúp bạn quản lý dữ liệu và hành vi bên trong component.
//
//  • useState    → Lưu trữ giá trị có thể thay đổi theo thời gian
//                  (ví dụ: dữ liệu từ server, trạng thái loading...)
//  • useEffect   → Chạy một đoạn code SAU KHI component render xong
//                  (ví dụ: gọi API, đăng ký sự kiện, cập nhật title...)
//  • useCallback → Ghi nhớ (cache) một hàm để tránh tạo lại hàm mới
//                  mỗi lần component re-render, giúp tối ưu hiệu năng
//
import { useState, useEffect, useCallback } from "react";

// Nhập hàm `api` từ file services/api – đây là hàm tiện ích
// bọc sẵn logic fetch (ví dụ: thêm token, xử lý lỗi chung...).
// Thay vì gọi fetch() thô, ta dùng api() để tái sử dụng code.
import { api } from "../services/api";

// ============================================================
// 🧩 CUSTOM HOOK: useApiFetch
// ============================================================
//
// "Custom hook" là một hàm JavaScript bình thường, nhưng:
//   1. Tên bắt đầu bằng chữ "use" (quy ước bắt buộc của React)
//   2. Bên trong được phép dùng các hook của React (useState, v.v.)
//
// Hook này nhận vào:
//   • path (string) – Đường dẫn API cần gọi, ví dụ: "/api/users"
//   • deps (array)  – Mảng các giá trị "phụ thuộc"; mỗi khi một
//                     giá trị trong mảng này thay đổi, hook sẽ tự
//                     động gọi lại API để lấy dữ liệu mới.
//                     Mặc định là [] (mảng rỗng = chỉ gọi 1 lần).
//
// Hook này trả về:
//   • data    – Dữ liệu lấy được từ server
//   • loading – Có đang tải không? (true/false)
//   • error   – Thông báo lỗi nếu có
//   • refetch – Hàm để gọi lại API thủ công bất kỳ lúc nào
//
export function useApiFetch(path, deps = []) {
  // ----------------------------------------------------------
  // 📌 STATE 1: data – Lưu dữ liệu trả về từ API
  // ----------------------------------------------------------
  // Ban đầu chưa có dữ liệu gì → khởi tạo bằng null.
  // Khi API trả về kết quả, ta sẽ gọi setData(...) để cập nhật.
  const [data, setData] = useState(null);

  // ----------------------------------------------------------
  // 📌 STATE 2: loading – Trạng thái đang tải dữ liệu
  // ----------------------------------------------------------
  // Nếu có đường dẫn API (path không rỗng) → bắt đầu tải ngay
  // từ lúc hook được khởi tạo → loading = true.
  //
  // Cú pháp !!path: chuyển đổi path thành boolean
  //   "/api/users" → true   (có path → đang tải)
  //   ""  hoặc undefined → false (không có path → không tải)
  //
  const [loading, setLoading] = useState(!!path);

  // ----------------------------------------------------------
  // 📌 STATE 3: error – Lưu thông báo lỗi (nếu có)
  // ----------------------------------------------------------
  // Ban đầu chưa có lỗi gì → null.
  // Nếu API thất bại, ta lưu chuỗi mô tả lỗi vào đây.
  const [error, setError] = useState(null);

  // ----------------------------------------------------------
  // 📌 STATE 4: fetchKey – Khóa để kích hoạt tải lại thủ công
  // ----------------------------------------------------------
  // Đây là một "mẹo" phổ biến trong React:
  //   - fetchKey là một con số đơn giản (0, 1, 2, 3...)
  //   - Mỗi khi người dùng gọi hàm refetch(), ta tăng fetchKey lên 1
  //   - useEffect bên dưới "lắng nghe" fetchKey → khi nó thay đổi,
  //     useEffect tự động chạy lại → API được gọi lại
  //
  const [fetchKey, setFetchKey] = useState(0);

  // ----------------------------------------------------------
  // 🔑 depsKey – Chuyển mảng deps thành chuỗi để so sánh
  // ----------------------------------------------------------
  // Vấn đề: React so sánh dependencies bằng tham chiếu bộ nhớ.
  // Nếu bạn truyền deps = [userId] và userId không đổi,
  // nhưng mảng [userId] được tạo mới mỗi lần render → React
  // nghĩ rằng deps đã "thay đổi" dù giá trị bên trong không đổi.
  //
  // Giải pháp: Chuyển mảng thành chuỗi JSON.
  //   [1, "abc"] → '[ 1, "abc" ]'
  // Hai chuỗi có cùng nội dung sẽ bằng nhau → so sánh chính xác.
  //
  const depsKey = JSON.stringify(deps);

  // ----------------------------------------------------------
  // 🗂️ Lưu các giá trị "cũ" để phát hiện thay đổi trong render
  // ----------------------------------------------------------
  // Đây là kỹ thuật "derived state" – thay vì dùng useEffect
  // để phát hiện thay đổi (sẽ chạy SAU khi render), ta phát
  // hiện thay đổi NGAY TRONG lần render hiện tại.
  //
  // Mục đích: Reset data/loading/error về trạng thái ban đầu
  // NGAY LẬP TỨC khi path hoặc deps thay đổi, tránh để dữ liệu
  // cũ hiển thị trong khoảnh khắc chờ API mới trả về.
  //
  const [prevPath, setPrevPath] = useState(path); // Lưu path cũ
  const [prevDepsKey, setPrevDepsKey] = useState(depsKey); // Lưu deps cũ (dạng chuỗi)
  const [prevFetchKey, setPrevFetchKey] = useState(fetchKey); // Lưu fetchKey cũ

  // ----------------------------------------------------------
  // ⚡ Reset tức thì khi phát hiện thay đổi trong lúc render
  // ----------------------------------------------------------
  // Kiểm tra: có gì thay đổi so với lần render trước không?
  //
  //   • path thay đổi       → người dùng điều hướng đến trang mới
  //   • depsKey thay đổi    → dữ liệu phụ thuộc (userId, filter...) thay đổi
  //   • fetchKey thay đổi   → người dùng bấm nút "Tải lại"
  //
  if (
    path !== prevPath ||
    depsKey !== prevDepsKey ||
    fetchKey !== prevFetchKey
  ) {
    // Cập nhật "bản ghi cũ" thành giá trị mới nhất
    setPrevPath(path);
    setPrevDepsKey(depsKey);
    setPrevFetchKey(fetchKey);

    // Xóa sạch dữ liệu cũ → tránh hiển thị dữ liệu không còn đúng
    setData(null);

    // Bật trạng thái loading (nếu có path) → UI hiển thị spinner
    setLoading(!!path);

    // Xóa thông báo lỗi cũ → tránh hiển thị lỗi không còn liên quan
    setError(null);
  }

  // ============================================================
  // 🌐 useEffect – Thực hiện gọi API
  // ============================================================
  //
  // useEffect là nơi phù hợp để thực hiện các "tác vụ phụ"
  // (side effects) như: gọi API, cập nhật document.title, v.v.
  //
  // Nó chạy SAU KHI React đã vẽ xong giao diện lên màn hình.
  //
  // Tham số thứ hai [path, depsKey, fetchKey] là "dependency array":
  //   → useEffect chỉ chạy lại khi ít nhất một trong 3 giá trị này thay đổi.
  //   → Nếu bỏ trống [], nó chỉ chạy đúng 1 lần sau lần render đầu tiên.
  //
  useEffect(() => {
    // Nếu không có đường dẫn API → không cần gọi gì cả, thoát ra
    if (!path) return;

    // --------------------------------------------------------
    // 🛑 AbortController – Công cụ hủy yêu cầu mạng đang chờ
    // --------------------------------------------------------
    // Tình huống thực tế:
    //   1. User mở trang Profile → gọi API "/api/user/1"
    //   2. API đang xử lý (chưa trả về)...
    //   3. User liền chuyển sang trang khác
    //   4. API trả về kết quả → CÓ VẤN ĐỀ: component đã unmount,
    //      gọi setData() sẽ gây lỗi memory leak!
    //
    // AbortController giải quyết vấn đề này:
    //   • controller.abort() → báo hiệu "hủy yêu cầu ngay"
    //   • signal → được truyền vào fetch/api để nó "lắng nghe" lệnh hủy
    //
    const controller = new AbortController();
    const { signal } = controller;

    // --------------------------------------------------------
    // 📡 Gọi API – Bắt đầu yêu cầu mạng
    // --------------------------------------------------------
    api(path, { signal })
      // ✅ Xử lý khi API trả về thành công
      .then((result) => {
        // Kiểm tra: yêu cầu có bị hủy giữa chừng không?
        // Nếu đã bị hủy → bỏ qua kết quả, không cập nhật state
        // (component có thể đã unmount rồi)
        if (!signal.aborted) {
          setData(result); // Lưu dữ liệu thành công vào state
        }
      })

      // ❌ Xử lý khi API thất bại (lỗi mạng, server lỗi 500, v.v.)
      .catch((e) => {
        // Nếu lỗi do hủy yêu cầu (AbortError) → bỏ qua, không cần báo lỗi
        // Đây KHÔNG phải lỗi thật, chỉ là do ta chủ động hủy
        if (signal.aborted || e?.name === "AbortError") return;

        // Nếu là lỗi thật → lưu thông báo lỗi để UI hiển thị cho user
        // e.message: thông báo lỗi từ server hoặc hệ thống
        // "Lỗi không xác định": fallback khi lỗi không có message
        setError(e.message || "Lỗi không xác định");
      })

      // 🏁 Luôn chạy sau cùng dù thành công hay thất bại
      .finally(() => {
        // Chỉ tắt loading nếu yêu cầu không bị hủy
        // (nếu đã hủy → component đã unmount, không cần tắt loading)
        if (!signal.aborted) {
          setLoading(false); // Tắt trạng thái loading → UI ẩn spinner
        }
      });

    // --------------------------------------------------------
    // 🧹 Cleanup function – Dọn dẹp khi component "rời đi"
    // --------------------------------------------------------
    // React tự động gọi hàm này khi:
    //   1. Component bị unmount (tháo khỏi giao diện)
    //   2. useEffect sắp chạy lại (do dependency thay đổi)
    //
    // → Hủy yêu cầu API đang chờ để tránh memory leak và
    //   tránh cập nhật state của component đã bị tháo xuống.
    //
    return () => {
      controller.abort();
    };
  }, [path, depsKey, fetchKey]);
  //         ^          ^          ^
  //         |          |          |
  //   Khi path     Khi deps    Khi người dùng
  //   thay đổi     thay đổi    gọi refetch()
  //   → gọi lại    → gọi lại   → gọi lại API
  //   API mới      API mới

  // ============================================================
  // 🔄 Hàm refetch – Cho phép gọi lại API thủ công
  // ============================================================
  //
  // useCallback ghi nhớ hàm này → không tạo lại mỗi lần render.
  // Điều này quan trọng khi truyền refetch làm prop xuống component
  // con, giúp tránh re-render không cần thiết ở component con.
  //
  // Cách hoạt động:
  //   refetch() → tăng fetchKey lên 1
  //             → fetchKey là dependency của useEffect
  //             → useEffect chạy lại
  //             → API được gọi lại
  //
  // Ví dụ sử dụng:
  //   <button onClick={refetch}>🔄 Tải lại</button>
  //
  const refetch = useCallback(() => {
    // Dùng dạng callback (k) => k + 1 thay vì fetchKey + 1
    // để luôn dùng giá trị mới nhất, tránh bị "cũ" do closure
    setFetchKey((k) => k + 1);
  }, []); // [] → hàm này chỉ được tạo 1 lần duy nhất, không bao giờ thay đổi

  // ============================================================
  // 📤 Trả về kết quả cho component sử dụng hook này
  // ============================================================
  //
  // Component sử dụng hook sẽ nhận được:
  //
  //   const { data, loading, error, refetch } = useApiFetch("/api/users");
  //
  //   data    → null (chưa có) | object/array (đã có dữ liệu)
  //   loading → true (đang tải) | false (xong rồi)
  //   error   → null (không lỗi) | "Lỗi 404: ..." (có lỗi)
  //   refetch → gọi hàm này để tải lại dữ liệu
  //
  return { data, loading, error, refetch };
}

// ============================================================
// 💡 VÍ DỤ SỬ DỤNG TRONG COMPONENT
// ============================================================
//
//  function UserList() {
//    const { data, loading, error, refetch } = useApiFetch("/api/users");
//
//    if (loading) return <p>⏳ Đang tải...</p>;
//    if (error)   return <p>❌ Lỗi: {error} <button onClick={refetch}>Thử lại</button></p>;
//    if (!data)   return null;
//
//    return (
//      <ul>
//        {data.map(user => <li key={user.id}>{user.name}</li>)}
//      </ul>
//    );
//  }
//
// ============================================================
//
//  // Ví dụ với dependencies: gọi lại API mỗi khi userId thay đổi
//  function UserProfile({ userId }) {
//    const { data, loading } = useApiFetch(`/api/users/${userId}`, [userId]);
//    ...
//  }
//
// ============================================================
