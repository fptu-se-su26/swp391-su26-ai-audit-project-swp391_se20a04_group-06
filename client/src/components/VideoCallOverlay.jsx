// Import các hook useEffect và useRef từ thư viện React để quản lý vòng đời và tham chiếu DOM của video
import { useEffect, useRef } from "react";
// Import hàm createPortal từ thư viện react-dom để render overlay ra ngoài cấu trúc DOM của component cha, trực tiếp vào thẻ body
import { createPortal } from "react-dom";

// Định nghĩa và export component VideoCallOverlay nhận vào các props quản lý cuộc gọi video: callState, localStream, remoteStream, onAccept, onReject, partnerName
export function VideoCallOverlay({
  callState, // Trạng thái hiện tại của cuộc gọi (calling, incoming, connected)
  localStream, // Dòng dữ liệu camera/mic cục bộ của người dùng
  remoteStream, // Dòng dữ liệu camera/mic từ xa của đối phương
  onAccept, // Hàm callback thực thi khi chấp nhận cuộc gọi đến
  onReject, // Hàm callback thực thi khi từ chối hoặc kết thúc cuộc gọi
  partnerName, // Tên của đối tác đang thực hiện cuộc gọi
}) {
  // Tạo ref tham chiếu đến phần tử video của camera cục bộ
  const localVideoRef = useRef(null);
  // Tạo ref tham chiếu đến phần tử video từ phía đối phương
  const remoteVideoRef = useRef(null);

  // ─── FIX: Thêm `callState` vào deps ──────────────────────────────────────
  //
  // Vấn đề cũ: setLocalStream() chạy trước khi callState = "connected",
  //   lúc đó <video> chưa mount → localVideoRef.current = null → srcObject không được gán.
  //   Khi callState chuyển sang "connected" và <video> mount, localStream
  //   không thay đổi → useEffect([localStream]) không chạy lại → màn hình đen.
  //
  // Cách sửa: Luôn render <video> trong DOM (dùng display:none/block thay vì unmount)
  //   + thêm callState vào deps để effect chạy lại khi state chuyển sang "connected".

  // Effect gán nguồn dữ liệu stream nội bộ (localStream) vào thẻ video cục bộ mỗi khi stream hoặc trạng thái cuộc gọi thay đổi
  useEffect(() => {
    // Lấy thẻ video cục bộ từ ref
    const el = localVideoRef.current;
    // Nếu phần tử video tồn tại và stream nội bộ có dữ liệu
    if (el && localStream) {
      // Nếu nguồn stream gán cho thẻ video khác với localStream hiện tại thì cập nhật lại
      if (el.srcObject !== localStream) {
        // Gán localStream làm nguồn phát cho thẻ video
        el.srcObject = localStream;
      }
      // Gọi phương thức play để bắt đầu phát video, bắt lỗi im lặng nếu có sự cố tự động phát (autoplay)
      el.play().catch(() => {});
    }
  }, [localStream, callState]); // ← callState nằm trong mảng deps để fix lỗi gán stream khi thay đổi trạng thái cuộc gọi

  // Effect gán nguồn dữ liệu stream đối phương (remoteStream) vào thẻ video từ xa mỗi khi stream hoặc trạng thái cuộc gọi thay đổi
  useEffect(() => {
    // Lấy thẻ video từ xa từ ref
    const el = remoteVideoRef.current;
    // Nếu phần tử video tồn tại và stream từ xa có dữ liệu
    if (el && remoteStream) {
      // Nếu nguồn stream gán cho thẻ video khác với remoteStream hiện tại thì cập nhật lại
      if (el.srcObject !== remoteStream) {
        // Gán remoteStream làm nguồn phát cho thẻ video từ xa
        el.srcObject = remoteStream;
      }
      // Gọi phát video từ xa, nếu thất bại thử phát lại sau 300 mili giây để phòng tránh rào cản tự phát của trình duyệt
      el.play().catch(() => {
        // Hẹn giờ chạy lại play()
        setTimeout(() => el.play().catch(() => {}), 300);
      });
    }
  }, [remoteStream, callState]); // ← callState nằm trong mảng deps để đảm bảo luồng video từ xa tự động phát khi kết nối thành công

  // Định nghĩa cấu trúc JSX cho màn hình overlay cuộc gọi
  const overlay = (
    <div
      // Style inline thiết lập phủ toàn màn hình cố định, nền tối Slate, zIndex cực cao và căn giữa
      style={{
        position: "fixed", // Định vị cố định so với cửa sổ trình duyệt
        inset: 0, // Phủ kín 4 góc màn hình (top: 0, right: 0, bottom: 0, left: 0)
        background: "rgba(15, 23, 42, 0.98)", // Nền Slate sẫm màu với độ mờ 98%
        zIndex: 999999, // Đặt chỉ số lớp z-index siêu lớn để đè lên mọi menu hay modal khác
        display: "flex", // Bố cục flexbox
        flexDirection: "column", // Căn các thẻ con theo chiều dọc
        alignItems: "center", // Căn giữa theo trục ngang
        justifyContent: "center", // Căn giữa theo trục dọc
        color: "#fff", // Đặt màu văn bản mặc định là trắng
        fontFamily: "inherit", // Sử dụng phông chữ kế thừa từ hệ thống chung
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────────
          VIDEO ELEMENTS — Luôn ở trong DOM, chỉ thay đổi display.
          Đây là điều kiện bắt buộc để refs luôn hợp lệ khi streams được gán.
      ───────────────────────────────────────────────────────────────────── */}

      {/* Remote (full screen) — hiển thị toàn màn hình và chỉ hiển thị khi cuộc gọi đã kết nối thành công */}
      <video
        ref={remoteVideoRef} // Gán ref để JavaScript truy cập gán luồng stream
        autoPlay // Tự động phát video ngay khi sẵn sàng
        playsInline // Cho phép phát ngay trên trang thay vì chuyển sang chế độ toàn màn hình mặc định của iOS
        style={{
          position: "absolute", // Định vị tuyệt đối
          inset: 0, // Lấp đầy 100% khung chứa overlay
          width: "100%", // Chiều rộng 100%
          height: "100%", // Chiều cao 100%
          objectFit: "cover", // Co giãn video lấp đầy màn hình và cắt đi phần thừa
          // Chỉ hiển thị (block) khi cuộc gọi đã kết nối, ngược lại ẩn đi (none)
          display: callState === "connected" ? "block" : "none",
        }}
      />

      {/* Local (PiP - Picture in Picture) — webcam nội bộ hiển thị góc màn hình hoặc màn hình xem trước */}
      <video
        ref={localVideoRef} // Gán ref để JavaScript truy cập gán luồng webcam cục bộ
        autoPlay // Tự động phát webcam
        playsInline // Cho phép phát trên trang
        muted // Tắt âm thanh phát lại của chính mình để tránh hiện tượng phản hồi âm thanh (hú tiếng)
        style={{
          position: "absolute", // Định vị tuyệt đối
          // Khi đã kết nối: Đưa lên góc trên phải làm màn hình phụ (PiP). Khi đang đổ chuông: Đặt gần đáy làm preview nhỏ
          ...(callState === "connected"
            ? { top: 24, right: 24, width: 120, height: 160 }
            : { bottom: 120, right: 24, width: 100, height: 140 }),
          objectFit: "cover", // Cắt xén video vừa vặn khung hình
          borderRadius: 12, // Bo tròn góc viền video cục bộ 12px
          border: "2px solid rgba(255,255,255,0.8)", // Đường viền trắng mờ bao quanh video phụ
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)", // Đổ bóng đậm tạo chiều sâu
          zIndex: 10, // Nằm đè lên trên video từ xa của đối phương
          // Hiển thị khi đang gọi hoặc khi đã kết nối, ẩn đi ở trạng thái khác
          display:
            callState === "calling" || callState === "connected"
              ? "block"
              : "none",
        }}
      />

      {/* Giao diện UI: Đang thực hiện cuộc gọi đi */}
      {callState === "calling" && (
        <div style={{ textAlign: "center", zIndex: 5 }}>
          {/* Biểu tượng điện thoại nhấp nháy */}
          <div
            style={{
              fontSize: 64, // Emoji kích thước lớn 64px
              animation: "pulse 1.5s infinite", // Áp dụng hoạt ảnh nhịp đập pulse lặp vô hạn trong 1.5 giây
              marginBottom: 16, // Khoảng cách tới dòng tiêu đề
            }}
          >
            📞
          </div>
          {/* Tiêu đề trạng thái */}
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px 0" }}>
            Đang gọi video...
          </h2>
          {/* Mô tả chi tiết */}
          <p
            style={{
              color: "rgba(255,255,255,0.6)", // Chữ trắng mờ 60%
              fontSize: 14, // Cỡ chữ 14px
              margin: "0 0 4px", // Khoảng cách nhỏ phía dưới
            }}
          >
            Vui lòng chờ <strong>{partnerName}</strong> bắt máy
          </p>
          {/* Chú thích trạng thái camera */}
          <p
            style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}
          >
            Camera của bạn đang bật ở góc phải
          </p>
          {/* Nút hủy cuộc gọi */}
          <button
            onClick={onReject} // Click thực hiện hủy cuộc gọi
            // Gọi hàm xây dựng style cho nút hủy cuộc gọi với màu đỏ san hô và đổ bóng đậm
            style={btnStyle("#EF4444", "0 4px 14px rgba(239,68,68,0.45)", {
              marginTop: 36, // Đẩy nút xuống dưới 36px
            })}
          >
            Hủy cuộc gọi
          </button>
        </div>
      )}

      {/* Giao diện UI: Có cuộc gọi đến */}
      {callState === "incoming" && (
        <div style={{ textAlign: "center", zIndex: 5 }}>
          {/* Biểu tượng chuông nảy nhảy động */}
          <div
            style={{
              fontSize: 64, // Emoji kích thước 64px
              animation: "bounce 1s infinite", // Áp dụng hoạt ảnh nảy bounce lặp vô hạn trong 1 giây
              marginBottom: 16, // Khoảng cách phía dưới
            }}
          >
            🔔
          </div>
          {/* Tiêu đề cuộc gọi đến */}
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px 0" }}>
            Cuộc gọi video đến
          </h2>
          {/* Tên đối phương đang gọi tới */}
          <p
            style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: 0 }}
          >
            <strong>{partnerName}</strong> đang gọi cho bạn
          </p>
          {/* Cặp nút hành động: Trả lời / Từ chối */}
          <div
            style={{
              display: "flex", // Bố cục flex hàng ngang
              gap: 16, // Khoảng cách giữa 2 nút bấm là 16px
              justifyContent: "center", // Căn giữa 2 nút bấm
              marginTop: 36, // Khoảng cách cách đoạn text trên là 36px
            }}
          >
            {/* Nút bấm chấp nhận cuộc gọi màu xanh lá */}
            <button
              onClick={onAccept} // Chấp nhận cuộc gọi
              style={btnStyle("#10B981", "0 4px 14px rgba(16,185,129,0.45)")}
            >
              ✅ Trả lời
            </button>
            {/* Nút bấm từ chối cuộc gọi màu đỏ */}
            <button
              onClick={onReject} // Từ chối cuộc gọi
              style={btnStyle("#EF4444", "0 4px 14px rgba(239,68,68,0.45)")}
            >
              ❌ Từ chối
            </button>
          </div>
        </div>
      )}

      {/* Giao diện UI: Đã kết nối trò chuyện — chỉ hiển thị nút gác máy/kết thúc ở đáy màn hình */}
      {callState === "connected" && (
        <div
          style={{
            position: "absolute", // Định vị tuyệt đối
            bottom: 44, // Cách mép đáy màn hình 44px
            left: "50%", // Căn lề trái 50%
            transform: "translateX(-50%)", // Dịch chuyển ngược lại 50% để căn giữa chính xác theo chiều ngang
            zIndex: 20, // Đảm bảo nổi bật lên trên khung video
          }}
        >
          {/* Nút kết thúc cuộc gọi màu đỏ */}
          <button
            onClick={onReject} // Sự kiện click gác máy
            // Thiết lập kiểu nút màu đỏ, bóng mờ đỏ và định dạng bo tròn hình tròn dẹt kèm biểu tượng dừng 🛑
            style={btnStyle("#EF4444", "0 4px 14px rgba(239,68,68,0.45)", {
              display: "flex", // Flexbox ngang
              alignItems: "center", // Căn giữa biểu tượng và chữ dọc
              gap: 8, // Khoảng cách giữa emoji 🛑 và chữ
              borderRadius: 99, // Bo tròn dạng viên thuốc tròn dẹt
              padding: "14px 32px", // Đệm rộng sang hai bên
            })}
          >
            <span>🛑</span> Kết thúc cuộc gọi
          </button>
        </div>
      )}

      {/* Chèn khối style CSS để định nghĩa các hoạt ảnh keyframes pulse và bounce */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );

  // Sử dụng createPortal để gắn trực tiếp cây DOM của overlay này vào thẻ body của tài liệu HTML
  return createPortal(overlay, document.body);
}

// ── Hàm xây dựng style CSS tiện ích cho các nút bấm hành động ────────────────────────────────
function btnStyle(bg, shadow, extra = {}) {
  return {
    padding: "14px 36px", // Đệm trong mặc định của nút bấm
    background: bg, // Màu nền của nút bấm
    border: "none", // Loại bỏ viền mặc định
    borderRadius: 14, // Bo góc viền nút 14px
    color: "#fff", // Màu chữ trắng
    fontWeight: 700, // Kiểu chữ in đậm dày dặn
    fontSize: 14, // Cỡ chữ 14px
    cursor: "pointer", // Đổi con trỏ chuột thành pointer khi di qua
    boxShadow: shadow, // Hiệu ứng đổ bóng mờ xung quanh nút bấm
    ...extra, // Cho phép kế thừa và ghi đè bổ sung style tùy chỉnh
  };
}
